# Clusters 模块细节设计

## 1. 模块定位

`Clusters` 管理 AI 业务集群（Cluster）。新建/编辑采用**五步向导**（已移除集群内实例池步骤）；后端实例由所选服务商的 `instance_pool` 派生。大模型配置通过 `llm_config.provider` 引用服务商，转发模型与 Keys 从服务商详情加载。

## 2. 路由与入口

| 路由 | name | 组件 | 说明 |
|------|------|------|------|
| `/cluster` | `AICluster.list` | `modules/Clusters/index.vue` | 集群列表页。 |

## 3. 页面结构

### 3.1 列表页

- `pageTable` 展示 `name`、`description` 等字段。
- 操作列：详情、编辑、删除。
- 顶部「创建集群」打开 80% 宽度抽屉。

### 3.2 新建/编辑向导（5 步）

抽屉内 `components/index.vue`：

1. **基础配置**（BaseConfig）
2. **超时与重试**（Timeout）
3. **被动健康检查**（PassiveHealthCheck）
4. **大模型配置**（GatewayConfig）
5. **复核**（Review）

> **不再包含「实例池」步骤**。实例池在服务商模块维护；提交 `POST/PATCH /clusters` **不携带** `instance_pool`。

### 3.3 详情查看

- 列表「详情」打开同一抽屉，直接展示 `Review`（`showFooter=false`）。
- 编辑时 `GET /clusters/{cluster_name}` 拉取完整详情。

## 4. 组件清单

| 组件 | 职责 | 关键 Props | 事件 |
|------|------|------------|------|
| `components/index.vue` | 5 步向导容器 | `currentCluster`、`clusterNames`、`isAdd` | `submit` |
| `BaseConfig.vue` | 基础配置 | `baseConfigData`、`reportFlag`、`isAdd`、`clusterNames` | `submitData` |
| `Timeout.vue` | 超时与重试 | `baseConfigData`、`reportFlag`、`isAdd` | `submitData` |
| `PassiveHealthCheck.vue` | 被动健康检查 | `passiveHealthData`、`reportFlag`、`isAdd` | `submitData` |
| `GatewayConfig.vue` | 大模型配置 | `llmConfigData`、`reportFlag`、`isAdd` | `submitData` |
| `Review.vue` | 复核/详情 | 各配置分片 props、`showFooter`、`reportFlag` | `submit` / `submitData` |
| `InstancePool.vue` | 实例池表单（**仅服务商模块嵌入**） | `instancePoolData`、`endpointSchema` | `pool-change`、`submitData` |

## 5. 数据流

```
Clusters/index.vue
    └─ components/index.vue
          ├─ reportFlag 触发当前步子表单校验
          ├─ acceptDataHandler 按 topic 合并 state
          └─ Review → Clusters/index.vue → POST/PATCH clusters（无 instance_pool）
```

`InstancePool.vue` 仍位于 `Clusters/components/`，导出 `formatInstancePoolForApi`、`parseInstancePool` 等供 **Providers** 复用。

## 6. 表单字段与校验要点

### 6.1 BaseConfig / Timeout / PassiveHealthCheck

与既有设计一致：集群名称唯一性、`HealthRegCheck`、`uri` 以 `/` 开头等。

### 6.2 GatewayConfig（大模型配置）

| 字段 / 交互 | 说明 |
|-------------|------|
| `provider` | **所属服务商**（必填）。`GET providers/actions/get-provider-names` 下拉；选中后 `GET providers/{name}` 加载 `models`、`keys`。 |
| `models` | **转发模型**多选；下拉首项「全选」（已全部选中时隐藏）；支持 `clearable`。 |
| `strip_prefix` / `match_prefix` | 裁剪前缀；开启时 `match_prefix` 必填且以 `/` 结尾。 |
| `model_mappings` | 模型重定向；原模型名不可重复。选择目标模型时，若原模型名为空则自动填入同名，已填写则不覆盖。 |
| `keys[]` | 仅 `name` + `weight`（**无 key 明文**）；**非必填**；空行不参与校验；提交前 `filter` 掉 `name` 为空的项；有值的 `name` 须属于所选服务商 Keys；权重之和 = 100；表头文案「Key」。下拉过滤其他行已选名称（本行保留当前项）；提交时仍校验名称不重复。 |
| `key_policy` | `strategy` 仅 `weighted_random`；退避最大值 ≥ 初始值。 |

权重校验错误在 Keys 表格下方**单行**展示，避免重复提示。

**已移除字段**：`provider_type`、`model_endpoint`、Keys 明文、`tools/get-models-from-provider`。

### 6.3 Review（复核 / 详情）

只读展示：基本配置、超时、健康检查、大模型配置（含所属服务商名称、转发模型、裁剪前缀、重定向、Keys、Key 策略）。

**不展示**服务商实例池表格（实例池归属 Provider 资源）。

## 7. OpenAPI 消费映射

| 组件 | 方法 | 相对 URL | 说明 |
|------|------|----------|------|
| `Clusters/index.vue` | `GET` | `clusters` | 集群列表。 |
| `Clusters/index.vue` | `GET` | `clusters/{cluster_name}` | 集群详情。 |
| `Clusters/index.vue` | `DELETE` | `clusters/{cluster_name}` | 删除集群。 |
| `Clusters/index.vue` | `GET` | `route-tables` / `entities` / `api-keys` | 删除被引用时解析引用方。 |
| `components/index.vue` | `POST` | `clusters` | 新建；Body 不含 `instance_pool`。 |
| `components/index.vue` | `PATCH` | `clusters/{cluster_name}` | 更新。 |
| `GatewayConfig.vue` | `GET` | `providers/actions/get-provider-names` | 所属服务商名称列表。 |
| `GatewayConfig.vue` | `GET` | `providers/{provider_name}` | 转发模型、Keys 选项来源。 |

## 8. 边界情况

- `cancel_on_client_close` 编辑时字符串与布尔互转。
- 提交前空对象字段可转为 `null`。
- 被动健康检查 `host` 为空时后端使用所属服务商首个实例 `addr`。
- 删除集群若被路由规则引用，前端解析引用并提示跳转。
- 健康检查展示文案：「使用所属服务商首个实例」。
