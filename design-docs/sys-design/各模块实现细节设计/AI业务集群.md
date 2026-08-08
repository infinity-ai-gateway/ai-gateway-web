# Clusters 模块细节设计

## 1. 模块定位

`Clusters` 管理 AI 业务集群（Cluster），是系统中最复杂的配置对象之一。新建/编辑采用**六步向导**模式，每个步骤负责 Cluster 的一部分配置，最终由复核步骤统一提交。

## 2. 路由与入口

| 路由 | name | 组件 | 说明 |
|------|------|------|------|
| `/cluster` | `AICluster.list` | `modules/Clusters/index.vue` | 集群列表页。 |

## 3. 页面结构

### 3.1 列表页

- 使用 `pageTable` 展示 `name`（可搜索、可排序）、`description`、操作列。
- 操作列：详情、编辑、删除。
- 顶部「创建集群」按钮打开 80% 宽度抽屉。
- 删除失败时，进行引用冲突检测（查找 route-tables 中引用该集群的路由规则），弹 Modal 显示冲突列表并提供「前往处理」链接。

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
- 详情直接从表格行数据构造展示数据，不额外调用 GET 单集群 API（列表 API 返回的数据已包含完整集群结构）。
- 编辑时先调用 `GET /clusters/{cluster_name}` 拉取完整详情。

## 4. 组件清单

| 组件 | 职责 | 关键 Props | 事件 |
|------|------|------------|------|
| `index.vue` | 列表 CRUD + Drawer 容器 | — | — |
| `components/index.vue` | 6 步向导容器 | `currentCluster`、`clusterNames`、`isAdd` | `submit` |
| `BaseConfig.vue` | 基础配置 | `baseConfigData`、`reportFlag`、`isAdd`、`clusterNames` | `submitData({ topic, data })` |
| `Timeout.vue` | 超时与重试 | `baseConfigData`、`reportFlag`、`isAdd` | `submitData` |
| `PassiveHealthCheck.vue` | 被动健康检查 | `passiveHealthData`、`reportFlag`、`isAdd`、`submitName` | `submitData` |
| `InstancePool.vue` | 实例池 | `instancePoolData`、`reportFlag` | `submitData` |
| `GatewayConfig.vue` | 大模型配置 | `llmConfigData`、`originalLlmConfigKey`、`originalLlmConfigHeaders`、`isAdd`、`stepsCurrentState`、`instancePoolData`、`reportFlag` | `submitData` |
| `Review.vue` | 复核/详情 | `baseConfigData`、`passiveHealthData`、`instancePoolData`、`llmConfigData`、`originalLlmConfigKey`、`originalLlmConfigHeaders`、`showFooter`、`isAdd`、`reportFlag` | `submitData` |

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
- `reportFlag` 模式：父组件为每步维护 Boolean flag（`baseSubmitFlag`、`timeoutSubmitFlag` 等），点击「下一步」时翻转对应 flag，子组件 `watch reportFlag` 检测变化后调 `handleSubmit()` 校验。
- `acceptDataHandler` 按 `data.topic` 动态赋值 `this[data.topic]`，特殊处理 LLM key 保持逻辑（`keepExistingKey`），然后 `currentStepIndex += 1` 自动前进。
- `InstancePool.vue` 导出 `parseInstancePool`、`getClusterInstancePool`、`detectInstanceMode`、`formatInstanceForApi`、`formatInstancePoolForApi`、`getInstanceEndpointHosts` 等工具函数，供其他步骤复用。
- 最终提交 `handelData()` 组装完整 payload：`{ name, description, basic, instance_pool, sticky_sessions, passive_health_check, llm_config }`，`changeObj()` 将空对象字段设为 `null`。

## 6. 表单字段与校验要点

### 6.1 BaseConfig

| 字段 | 校验 | 说明 |
|------|------|------|
| `name` | 新建唯一性 + `ClustersNameRegCheck`：`/^[a-zA-Z0-9]([a-zA-Z0-9._-]{0,62}[a-zA-Z0-9])?$/`，≤64 字符 | 集群名称。编辑 disabled。 |
| `description` | 可选，≤256 字符，不含控制字符 | 描述。 |
| `protocol` | 必填 | `http` / `https`。 |
| `connection.max_idle_conn_per_rs` | 非负整数，≤99999999 | 最大空闲连接。 |
| `connection.cancel_on_client_close` | Select（字符串 `'true'`/`'false'`） | 编辑时 `String()` 转换，提交时转布尔。 |
| `sticky_sessions.enabled` | Select（字符串） | 会话保持开关。 |
| `sticky_sessions.hash_strategy` | Select | `CLIENT_ID_ONLY` / `CLIENT_IP_ONLY` / `CLIENT_ID_PREFERED`。仅 enabled='true' 时显示。 |
| `sticky_sessions.hash_header` | `hash_strategy !== 'CLIENT_IP_ONLY'` 时必填 | 会话保持 Header。`CLIENT_IP_ONLY` 时移除校验。 |
| `buffers.req_write_buffer_size` | 正整数，≤99999999 | 缓冲区大小。 |

### 6.2 Timeout

- 5 个 timeout 字段（`timeout_read_client_again`、`timeout_readbody_client`、`timeout_conn_serv`、`timeout_response_header`、`timeout_write_client`）及 `max_retry_in_cluster` 均为非负整数，上限 `99999999`。

### 6.3 PassiveHealthCheck

- `failnum`、`interval`、`statuscode` 为非负整数，≤99999999。
- `host` 可选，使用 `isHostname` 校验（RFC 1123，2-255 字符，或有效 IPv4/IPv6）。
- `uri` 可选，必须以 `/` 开头。
- 默认值：`{ failnum: 3, interval: 1000, host: '', uri: '/', statuscode: 0 }`。

### 6.4 InstancePool

- 支持 IP 模式与域名模式（`detectInstanceMode`：仅 1 条实例且 addr 为合法 hostname 但非 IP → 域名模式）。
- IP 模式：每条实例含 `addr`（IPv4/IPv6，不可重复）、`port`（1-65535）、`weight`（0-100）。**权重总和必须等于 100，且至少 1 个正权重。**
- 域名模式：使用 `isHostname` 校验，端口固定为 443，权重固定为 100。
- IP + 端口重复检测。

### 6.5 GatewayConfig

- `provider_type`：Select，动态 options 来自 `GET model-provider-types`。空时提交删除该字段。
- `model_endpoint`（含 `schema`、`uri`、`headers`）：schema 和 uri 同时有或同时无；uri 必须以 `/` 开头；无连续 `//`；不以 `/` 结尾（除非为 `/`）。
- `models`：必填，多选。
- `model_mappings`：每行 `source_model` 和 `target_model` 都非空；`source_model` 不可重复。提交前过滤空行。
- `keyInput`（Service Auth Key）：长度 ≤512 字符；未修改时跳过校验。通过掩码 + focus 事件实现「未修改则保留原值」。

## 7. OpenAPI 消费映射

| 组件 | 方法 | 相对 URL | 说明 |
|------|------|----------|------|
| `Clusters/index.vue` | `GET` | `clusters` | 集群列表。 |
| `Clusters/index.vue` | `GET` | `clusters/{cluster_name}` | 单个集群详情（编辑时）。 |
| `Clusters/index.vue` | `DELETE` | `clusters/{cluster_name}` | 删除集群。 |
| `Clusters/index.vue` | `GET` | `route-tables` | 删除冲突检测：查找引用该集群的路由表。 |
| `Clusters/index.vue` | `GET` | `entities` | 删除冲突检测：获取 owner 标签。 |
| `Clusters/index.vue` | `GET` | `api-keys` | 删除冲突检测：获取 owner 标签。 |
| `Clusters/index.vue` | `GET` | `global-route-rules` | 删除冲突检测：全局路由规则。 |
| `Clusters/index.vue` | `GET` | `entities/{owner}` | 删除冲突检测：Entity 路由规则。 |
| `Clusters/index.vue` | `GET` | `api-keys/{owner}` | 删除冲突检测：API-Key 路由规则。 |
| `components/index.vue` | `POST` | `clusters` | 新建集群。 |
| `components/index.vue` | `PATCH` | `clusters/{cluster_name}` | 更新集群。 |
| `GatewayConfig.vue` | `GET` | `model-provider-types` | 提供商类型列表。 |
| `GatewayConfig.vue` | `POST` | `tools/get-models-from-provider` | 从 provider 探测模型列表。 |
| `Review.vue` | `GET` | `model-provider-types` | 详情展示提供商名称。 |

> 注：实际代码使用 `PATCH` 更新集群，与 `OpenAPI消费接口映射.md` 中标注的 `PUT` 不一致，以代码实现为准。提供商列表接口为 `model-provider-types`，模型探测接口为 `tools/get-models-from-provider`。

## 8. 边界情况

- `cancel_on_client_close` 字段在编辑时 `String()` 转为字符串，提交时 `'true'`/`true` → `true`，其他 → `false`。
- `sticky_sessions` 布尔值转换：编辑时 `formatStickySessionsForEdit` 将 `enabled: true` → `'true'`；提交时 `formatStickySessionsForApi` 将字符串转回布尔，`CLIENT_IP_ONLY` 时删除 `hash_header`。
- 提交前 `changeObj()` 将空对象 `{}` 的字段设为 `null`。
- LLM key 掩码：通过 `maskSecretKey`（前 8 位 + `****` + 后 4 位，长度 ≤12 时全脱敏 `****`）。加载时与 `originalLlmConfigKey` 比较决定显示掩码或明文；focus 时若未修改且显示掩码则清空输入框；提交时若未变则不传 `key` 字段（保留原值），若已变且非空则传 `key`。
- LLM headers 掩码：同样的掩码模式应用于 `model_endpoint.headers` 的值。加载时与 `originalLlmConfigHeaders` 比较；focus 时清空；提交时未修改则用原始值，已修改则用当前值。
- 实例池数据来自 `cluster.instance_pool` 数组（`getClusterInstancePool`），**不使用 `sub_clusters`**。`instance_pool` 非数组时返回空数组。
- 删除冲突检测：删除集群失败时，查找所有 route-tables 及其引用规则（global-route-rules、entities/{owner}、api-keys/{owner}），检查 `targets` 中是否有 `ClusterName` 匹配，弹 Modal 显示冲突列表。
- `InstancePool` 使用动态 `:key`（`instancePoolRenderKey`）确保编辑不同集群时组件完全重建。
- `GatewayConfig` 在 `stepsCurrentState` 变为 4 时自动调用 `getProviders()` 和 `getModels()`。
- `Review` 中 `providerTypeText` 将 `provider_type` id 映射为可读名称，找不到则显示原始 id。
