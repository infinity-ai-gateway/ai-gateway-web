# Clusters 模块细节设计

## 1. 模块定位

`Clusters` 管理 AI 业务集群（Cluster），是系统中最复杂的配置对象之一。新建/编辑采用**六步向导**模式，每个步骤负责 Cluster 的一部分配置（含多 Key 加权、价格关联提供商、模型前缀裁剪），最终由复核步骤统一提交。

## 2. 路由与入口

| 路由 | name | 组件 | 说明 |
|------|------|------|------|
| `/cluster` | `AICluster.list` | `modules/Clusters/index.vue` | 集群列表页。 |

## 3. 页面结构

### 3.1 列表页

- 使用 `pageTable` 展示 `name`、`description` 等字段。
- `name` 列支持搜索与排序。
- 操作列：详情、编辑、删除。
- 顶部「创建集群」按钮打开 80% 宽度抽屉。

### 3.2 新建/编辑向导

抽屉内加载 `components/index.vue` 作为 6 步向导容器：

1. **基础配置**（BaseConfig）
2. **超时与重试**（Timeout）
3. **被动健康检查**（PassiveHealthCheck）
4. **实例池**（InstancePool）
5. **大模型配置**（GatewayConfig）
6. **复核**（Review）

### 3.3 详情查看

- 列表页点击「详情」打开同一抽屉，但直接展示 `Review`（`showFooter=false`）。
- 编辑时先调用 `GET /clusters/{cluster_name}` 拉取完整详情。

## 4. 组件清单

| 组件 | 职责 | 关键 Props | 事件 |
|------|------|------------|------|
| `components/index.vue` | 6 步向导容器 | `currentCluster`、`clusterNames`、`isAdd` | `submit` |
| `BaseConfig.vue` | 基础配置 | `baseConfigData`、`reportFlag`、`isAdd`、`clusterNames` | `submitData({ topic, data })` |
| `Timeout.vue` | 超时与重试 | `baseConfigData`、`reportFlag`、`isAdd` | `submitData` |
| `PassiveHealthCheck.vue` | 被动健康检查 | `passiveHealthData`、`reportFlag`、`isAdd` | `submitData` |
| `InstancePool.vue` | 实例池 | `instancePoolData`、`reportFlag` | `submitData` |
| `GatewayConfig.vue` | 大模型配置 | `llmConfigData`、`originalLlmConfigKey/Headers`、`isAdd`、`stepsCurrentState`、`instancePoolData`、`reportFlag` | `submitData` |
| `Review.vue` | 复核/详情 | 各配置分片 props、`showFooter`、`reportFlag` | `submitData` |

## 5. 数据流

```
Clusters/index.vue
    ├─ 打开 Drawer → 传入 currentCluster / clusterNames / isAdd
    └─ components/index.vue (向导容器)
          ├─ 通过 reportFlag 翻转触发当前步骤子表单校验
          ├─ 子表单 $emit('submitData', { topic, data })
          ├─ acceptDataHandler 按 topic 合并到父级 state
          └─ Review 最终 $emit('submit') → Clusters/index.vue 调接口并刷新列表
```

- 子表单不直接修改 `props`；所有状态提升回向导容器。
- `InstancePool.vue` 提供 `getClusterInstancePool`、`formatInstancePoolForApi` 等工具函数，供其他步骤复用。

## 6. 表单字段与校验要点

### 6.1 BaseConfig

| 字段 | 校验 | 说明 |
|------|------|------|
| `name` | 新建唯一性 + `ClustersNameRegCheck` | 集群名称。 |
| `protocol` | 必填 | 协议类型。 |
| `connection` | 必填 | 连接模式。 |
| `hash_header` | `sticky_sessions === 'CLIENT_IP_ONLY'` 时移除校验 | 会话保持相关字段。 |

### 6.2 Timeout

- 5 个 timeout 字段及 `retries.max_retry_in_cluster` 均为非负整数，上限 `99999999`。

### 6.3 PassiveHealthCheck

- `interval`、`failnum`、`statuscode` 为数值。
- `host` 使用 `HealthRegCheck`。
- `uri` 必须以 `/` 开头。

### 6.4 InstancePool

- 支持 IP 模式与域名模式。
- IP + 端口重复检测。
- 域名模式使用 FQDN 校验；端口随 LLM `model_endpoint.schema` 同步（http → 80，https → 443），提交与探测模型时保持一致。

### 6.5 GatewayConfig（大模型配置）

| 字段 | 校验 | 说明 |
|------|------|------|
| `provider_type` | 可选 | 模型服务商类型，用于探测模型列表与接口适配。 |
| `provider` | 可选 | 价格关联提供商，与模型定价表 `provider` 匹配。 |
| `strip_prefix` | 布尔 | 开启后转发前去掉请求 model 中的匹配前缀。 |
| `match_prefix` | 开启裁剪时必填，必须以 `/` 结尾 | 模型前缀匹配，如 `openrouter/`。 |
| `model_endpoint` | schema + uri；uri 以 `/` 开头 | 模型列表接口；host 来自实例池。 |
| `models` | 必填 | 已选模型列表。 |
| `model_mappings` | 原模型名不可重复 | 模型重定向。 |
| `keys[]` | name/key 成对填写；权重 0–100，有效 Key 权重之和 = 100 | 多 Key 加权；请求头含 `${API_KEY}` 时 Keys 不能为空。 |
| `key_policy` | `strategy` 仅 `weighted_random`；退避最大值 ≥ 初始值 | Key 路由策略（重试与退避）。 |

密钥与 headers 编辑时做掩码；未修改则提交原值。

复核页 `Review.vue` 只读展示上述 LLM 字段（含提供商、裁剪前缀、前缀匹配、Keys、Key 策略）。

## 7. OpenAPI 消费映射

| 组件 | 方法 | 相对 URL | 说明 |
|------|------|----------|------|
| `Clusters/index.vue` | `GET` | `clusters` | 集群列表。 |
| `Clusters/index.vue` | `GET` | `clusters/{cluster_name}` | 单个集群详情。 |
| `Clusters/index.vue` | `DELETE` | `clusters/{cluster_name}` | 删除集群。 |
| `components/index.vue` | `POST` | `clusters` | 新建集群。 |
| `components/index.vue` | `PATCH` | `clusters/{cluster_name}` | 更新集群。 |
| `GatewayConfig.vue` | `GET` | `model-provider-types` | 服务商类型列表。 |
| `GatewayConfig.vue` | `POST` | `tools/get-models-from-provider` | 探测下游模型列表。 |
| `Review.vue` | `GET` | `model-provider-types` | 详情展示服务商类型名称。 |

> 更新集群使用 `PATCH`。

## 8. 边界情况

- `cancel_on_client_close` 字段在编辑时存在字符串与布尔互转。
- 提交前将空对象字段转为 `null`。
- LLM keys / headers 编辑时做掩码处理，避免明文泄露。
- 实例池端口随 endpoint schema 同步；探测模型与提交使用同一套 host:port。
- 删除集群若被路由规则引用，前端解析 `route-tables` / Entity / API-Key 引用并提示跳转处理。
