# APIKey 模块细节设计

## 1. 模块定位

`APIKey` 管理外部系统访问 AI 网关的 API Key，包括创建、编辑、查看详情、删除、配额重置以及模型/限流/子网配置。

## 2. 路由与入口

| 路由 | name | 组件 | 说明 |
|------|------|------|------|
| `/api-key` | `APIKey.list` | `modules/APIKey/index.vue` | Tab 容器，当前仅含 API-Key 列表。 |

实际列表组件：`modules/APIKey/components/ApiKeyList.vue`。

## 3. 页面结构

### 3.1 列表页

- 使用 `pageTable` 展示以下列：
  - `id`（可搜索、可排序）
  - `key`（脱敏显示：长度 > 12 时显示前 8 位 + `****` + 后 4 位，点击弹出 Modal 查看完整 Key 并支持复制）
  - `description`（可搜索、可排序）
  - `enabled`（Tag 渲染：success/default，下拉搜索过滤 true/false）
  - `quota_plan_unlimited`（从 `quota_plan.unlimited` 取值，Tag：unlimited/limited）
  - `quota_plan_used`（显示 `used / quota`，无限配额显示 `-`，数字用 `formatNumber` 缩写 K/M）
  - `rate_limit_policy_enabled`（从 `rate_limit_policy.enabled` 取值，Tag）
  - `entity_name`（从 `entity.name` 取值）
  - 操作列（3 个按钮：管理路由规则 success、编辑 primary、删除 error）
- 顶部「创建」按钮打开抽屉。
- 行点击可进入详情；行内支持编辑、删除。
- 「管理路由规则」按钮跳转 `AdvanceRouteRule.list`，携带 query `{ type: 'apikey', owner: row.id }`。
- 删除使用 `CustomModal` 二次确认。

### 3.2 新建/编辑抽屉

- 使用 `Upsert.vue`，宽度 60%。
- 包含 3 个 Card 分区：基本信息、配额信息、限流配置。
- 基本信息含 `description`、`expired_time`（含「永不过期」Checkbox + DatePicker）、`enabled`、`unlimited_quota`、`models`（el-select multiple，按 cluster 分组）、`subnet`（textarea 多行输入）、`entity_id`（el-select filterable）。
- 配额信息：`quota_plan.unlimited`、`pass_when_no_enough_quota`、`quota`（InputNumber，max=INT64_MAX）、`unit`（固定 `total_token`）、`reset_period`。非无限配额时才显示除 unlimited 外字段。
- 限流配置：`rate_limit_policy.enabled`。启用时显示 TPM/RPM 规则编辑区和最大并发设置。

### 3.3 详情抽屉

- 使用 `ApiKeyView.vue`。
- 展示 3 个 Card：基本信息、配额信息（含使用进度条 Progress）、限流配置。
- 提供「重置配额」操作，弹出 Modal 预填当前 quota，可填写 `newQuota`（InputNumber）和 `resetReason`（textarea，可选）。

## 4. 组件清单

| 组件 | 职责 | 关键 Props | 事件 |
| ------ | ------ | ------------ | ------ |
| `index.vue` | Tab 容器 | — | — |
| `ApiKeyList.vue` | 列表 CRUD | — | — |
| `Upsert.vue` | 新建/编辑表单 | `currentData`、`isAdd` | `submit`、`cancel` |
| `ApiKeyView.vue` | 详情 + 配额重置 | `currentData` | `cancel`、`submit` |

## 5. 表单字段与校验

| 字段 | 校验 | 说明 |
| ------ | ------ | ------ |
| `description` | 必填，非空 trim，≤512 字符 | 描述。 |
| `enabled` | Select（字符串 `"true"`/`"false"`） | 启用状态，提交时转布尔。 |
| `expired_time` | 非永不过期时必选 | 提交时转为 Unix 秒或 `-1`（永久）。`null` 也视为永不过期。 |
| `unlimited_quota` | Select（字符串） | 是否执行配额检查。 |
| `subnet` | textarea 多行输入；trigger: blur；不能为空；`*` 不能与其他 CIDR 共存；每条需为合法 CIDR（IPv4/IPv6）；不能有重复；不能有包含/被包含关系 | 访问来源限制。空输入回退为 `["*"]`。 |
| `entity_id` | 可选 | 挂载的 Entity。 |
| `models` | el-select multiple；`*` 与具体模型互斥 | 模型白名单。watch 实现：最后选 `*` 则只保留 `*`，否则移除 `*`。 |
| `quota_plan.unlimited` | Select（字符串） | 无限配额。 |
| `quota_plan.pass_when_no_enough_quota` | Select（字符串） | 配额不足时放行。 |
| `quota_plan.quota` | 有限配额时必填非负整数，≤INT64_MAX（9223372036854775807） | 配额数值。 |
| `quota_plan.unit` | 固定 `total_token` | 配额单位。 |
| `quota_plan.reset_period` | Select | `never` / `weekly` / `monthly`。 |
| `rate_limit_policy.enabled` | Select（字符串） | 启用限流。 |
| `rate_limit_policy.rules.tpm[]` | 每条规则 4 字段校验（见下） | TPM 规则，最多 3 条。 |
| `rate_limit_policy.rules.rpm[]` | 每条规则 3 字段校验（见下） | RPM 规则，最多 3 条。 |
| `rate_limit_policy.rules.max_concurrency` | limited 模式下正整数，≤INT_MAX | 并发限制（见 5.1）。 |

### 5.1 并发模式

通过 `maxConcurrencyMode`（`unlimited` / `banned` / `limited`）管理底层 `max_concurrency` 值：

- `-1`：不限（`unlimited`）—单独不触发限流，不能作为唯一规则
- `0`：封禁（`banned`）
- `>0`：限制为指定数值（`limited`，max=INT_MAX=2147483647）

`syncMaxConcurrencyMode` 从值反推模式，`onMaxConcurrencyModeChange` 从模式设值。

### 5.2 限流规则字段

**TPM 规则**（每条，最多 3 条）：

| 字段 | 校验 | 说明 |
| ------ | ------ | ------ |
| `name` | 必填，1-128 字符，TPM 内唯一 | 规则名称。 |
| `model` | el-select | `*` 或具体模型。 |
| `window_minutes` | 必填，1-360 | 时间窗口。 |
| `max_tokens` | 必填，≥0，≤INT64_MAX | 最大 Token 数。 |
| `step_minutes` | 必填，1-360，且 ≤ `window_minutes` | 步长。 |

**RPM 规则**（每条，最多 3 条）：

| 字段 | 校验 | 说明 |
| ------ | ------ | ------ |
| `name` | 必填，1-128 字符，RPM 内唯一 | 规则名称。 |
| `model` | el-select | `*` 或具体模型。 |
| `window_minutes` | 必填，1-360 | 时间窗口。 |
| `max_requests` | 必填，≥0，≤INT64_MAX | 最大请求数。 |

### 5.3 限流组合唯一性

- TPM 组合键：`model|window_minutes|max_tokens|step_minutes`，不可重复。
- RPM 组合键：`model|window_minutes|max_requests`，不可重复。
- 启用限流时至少需有一条有效规则（TPM 或 RPM 或有效的 max_concurrency），`max_concurrency='unlimited'` 单独不算有效规则。

### 5.4 布尔字段

UI 中部分启用/禁用字段使用字符串 `"true"`/`"false"`（iView Select），编辑回填时 `normalizeSelectBool` 将布尔转字符串，提交时再转回布尔。

## 6. 数据流

```
APIKey/index.vue (Tab 容器)
    └─ ApiKeyList.vue
          ├─ Upsert.vue (Drawer) → $emit('submit') → 父组件 POST/PATCH
          ├─ ApiKeyView.vue (Drawer) → $emit('submit') → 重置配额
          └─ 行操作 → 删除/编辑/查看/管理路由规则
```

- 无 Vuex 状态；数据由 `ApiKeyList.vue` 集中管理。
- 通过 `isAdd` 和 `isView` 两个布尔值控制 Drawer 内容：
  - `isAdd=true, isView=false` → 渲染 `Upsert`（新增）
  - `isAdd=false, isView=false` → 渲染 `Upsert`（编辑）
  - `isAdd=false, isView=true` → 渲染 `ApiKeyView`（查看），computed `isViewMode` = `isView && !isAdd`
- 详情页会单独 `GET /api-keys/{id}` 刷新，确保显示最新数据（含 balance）。
- 编辑提交前会 `cloneDeep` 并剔除 `id`、`create_time`、`update_time` 等只读字段。
- 限流禁用时提交清空 rules（`tpm: [], rpm: [], max_concurrency: -1`）但保留结构。
- `fetchData` 获取列表后对每项做扁平化：添加 `rate_limit_policy_enabled`、`quota_plan_unlimited`、`quota_plan_used`、`entity_name` 等扁平字段，便于表格搜索/排序。

## 7. OpenAPI 消费映射

| 组件 | 方法 | 相对 URL | 说明 |
| ------ | ------ | ---------- | ------ |
| `ApiKeyList.vue` | `GET` | `api-keys` | 列表。 |
| `ApiKeyList.vue` | `POST` | `api-keys` | 创建。 |
| `ApiKeyList.vue` | `PATCH` | `api-keys/{id}` | 部分更新。 |
| `ApiKeyList.vue` | `DELETE` | `api-keys/{id}` | 删除。 |
| `ApiKeyView.vue` | `GET` | `api-keys/{id}` | 详情（含 balance）。 |
| `ApiKeyView.vue` | `POST` | `api-keys/{id}/quota-plan/reset` | 重置配额，body: `{ quota, reason? }`。 |
| `Upsert.vue` | `GET` | `entities` | 挂载 Entity 下拉。 |
| `Upsert.vue` | `GET` | `clusters` | 获取集群列表，筛选含 `llm_config.models` 的集群，通过 `getModelGroupsFromServices` 按集群分组生成模型下拉。 |

> 注：实际代码使用 `PATCH` 更新 API Key，与 `OpenAPI消费接口映射.md` 中标注的 `PUT` 不一致，以代码实现为准。模型列表来源于 `clusters` 接口而非 `global-models`。

## 8. 边界情况

- Key 列表默认脱敏（前 8 位 + `****` + 后 4 位），完整 Key 通过 Modal 弹窗展示，支持 `$copyText` 复制。
- `expired_time`：`-1` 表示永不过期，`null` 也视为永不过期。DatePicker 禁止选择今天之前的日期。提交时 Date 对象转 Unix 秒（`Math.floor(getTime()/1000)`）。
- 编辑提交前会剔除 `id`、`create_time`、`update_time` 等只读字段。
- 限流禁用时提交清空 rules 但保留 `{ tpm: [], rpm: [], max_concurrency: -1 }` 结构。
- 配额重置：前端校验 `newQuota` 非空、整数、≥0、≤INT64_MAX，POST 成功后 emit `submit` 通知父组件刷新列表和详情。
- 数字格式化：列表中 `formatNumber`（≥1M 显示 `x.xM`，≥1K 显示 `x.xK`），详情中 `formatNumber`（`toLocaleString` 千分位），表单中 `formatNumberInput`/`parseNumberInput` 实现千分位显示与解析。
- 模型列表 Modal 已实现（`showModelsModal`），但当前未在列渲染中调用，后续可按需接入。
- 「管理路由规则」按钮跳转 `AdvanceRouteRule.list`，携带 query `{ type: 'apikey', owner: row.id }`。
