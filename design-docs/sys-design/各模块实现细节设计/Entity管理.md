# Entity 模块细节设计

## 1. 模块定位

`Entity` 管理服务实体（Entity）与实体类型（Entity Type），用于构建 API Key 的组织层级与模型/配额/限流继承关系。

## 2. 路由与入口

| 路由 | name | 组件 | 说明 |
|------|------|------|------|
| `/Entity` | `Entity.list` | `modules/Entity/index.vue` | 双 Tab 容器：组织管理 / 类型管理。 |

> 注意：路由路径首字母大写（`/Entity`），与其他模块如 `/api-key`、`/cluster` 的小写不同。

内部视图：

- `EntityList.vue` / `EntityUpsert.vue` / `EntityView.vue`：Entity CRUD 与详情。
- `EntityTypeList.vue` / `EntityTypeUpsert.vue`：Entity Type CRUD。

## 3. 页面结构

### 3.1 组织管理（Entity）

- 使用 `pageTable` 展示 `id`（可搜索、可排序）、`name`（可搜索、可排序）、`type`（可搜索、可排序）、`parent_id`（解析为父名，可搜索、可排序）、配额用量（`quota_plan_used`，无限配额显示 `-`，否则 `used / quota` 千分位）、限流状态（`rate_limit_policy_enabled`，Tag）、操作。
- 操作列：管理路由规则（success）、编辑（primary）、删除（error）。
- 顶部「创建 Entity」按钮打开抽屉。
- 行点击可进入详情。
- 「管理路由规则」按钮跳转 `AdvanceRouteRule.list`，携带 query `{ type: 'entity', owner: row.id }`。

### 3.2 类型管理（Entity Type）

- 使用 `pageTable` 展示 `type_name`（可搜索、可排序）、`description`（可排序）、`level`（1–5，可搜索，Select 过滤）、`create_time`（格式化）、操作。
- 顶部「创建类型」按钮打开抽屉。

## 4. 组件清单

| 组件 | 职责 | 关键 Props | 事件 |
|------|------|------------|------|
| `index.vue` | Tab 容器 | — | — |
| `EntityList.vue` | Entity 列表 | — | — |
| `EntityUpsert.vue` | Entity 新建/编辑 | `currentData`、`isAdd`、`entityList` | `submit`、`cancel` |
| `EntityView.vue` | Entity 详情 + 配额重置 | `currentData`、`entityList` | `cancel`、`submit` |
| `EntityTypeList.vue` | 类型列表 | — | — |
| `EntityTypeUpsert.vue` | 类型新建/编辑 | `currentData`、`isAdd` | `submit`、`cancel` |

## 5. 表单字段与校验

### 5.1 EntityUpsert

| 字段 | 校验 | 说明 |
|------|------|------|
| `name` | 必填；非空 trim；≤64 字符；无控制字符 `[\x00-\x1F\x7F]`；新建可编辑，编辑 disabled | Entity 名称。 |
| `type` | 必填；编辑 disabled | 关联的 Entity Type（el-select filterable）。 |
| `parent_id` | 可选；选项为类型 level 严格小于当前类型的 Entity，排除自身 | 父级实体。`parent_id` 初始化时 `String()` 以适配 Select。 |
| `allow_models` | el-select multiple；`*` 与具体模型互斥 | 模型白名单。watch 实现互斥。 |
| `block_models` | el-select multiple；初始化时 `['*']` → `[]`；提交时空数组 → `['*']` | 模型黑名单。 |
| `quota_plan` | 与 API Key 类似（unlimited、pass_when_no_enough_quota、quota ≤INT64_MAX、unit 固定 `total_token`、reset_period） | 配额。 |
| `rate_limit_policy` | 与 API Key 类似（enabled、TPM/RPM 规则各最多 3 条、max_concurrency 三态） | 限流。 |

### 5.2 EntityTypeUpsert

| 字段 | 校验 | 说明 |
|------|------|------|
| `type_name` | 必填；`/^[a-z0-9]([a-z0-9_-]{0,30}[a-z0-9])?$/`（1-32 字符，小写字母/数字/下划线/连字符，不可下划线/连字符开头或结尾）；新建可编辑，编辑 disabled | 类型名称。 |
| `description` | 最长 1024 | 描述。 |
| `level` | 1–5 必选 | 层级，用于限制父子关系。 |

## 6. 数据流

```
Entity/index.vue (Tab 容器)
    ├── EntityList.vue
    │     ├── EntityUpsert.vue (Drawer) → $emit('submit') → 父组件 POST/PATCH
    │     └── EntityView.vue (Drawer) → $emit('submit') → 重置配额
    └── EntityTypeList.vue
          └── EntityTypeUpsert.vue (Drawer) → $emit('submit') → 父组件 POST/PATCH
```

- `entityList`（即 `tableData`）作为 prop 传入 Upsert/View，用于父级名称解析与下拉选择。
- 父子关系选择受 Entity Type 的 `level` 层级约束：子 Entity 的类型 `level` 必须严格大于父级类型 `level`。`parentEntityList` computed 过滤 `entityList` 中类型 level 严格小于当前类型的实体，并排除自身。
- `EntityView` 双数据源：优先使用 `fetchDetail` 拉取的 `detailData`（含 balance），回退到列表行 `currentData`。
- 配额重置：`confirmResetQuota` 校验 `newQuota` 非空、整数、≥0、≤INT64_MAX，POST `entities/{id}/quota-plan/reset` 携带 `{quota, reason?}`，成功后 emit `submit`。

## 7. OpenAPI 消费映射

| 组件 | 方法 | 相对 URL | 说明 |
|------|------|----------|------|
| `EntityList.vue` | `GET` | `entities` | 列表。 |
| `EntityList.vue` | `POST` | `entities` | 创建。 |
| `EntityList.vue` | `PATCH` | `entities/{id}` | 更新。 |
| `EntityList.vue` | `DELETE` | `entities/{id}` | 删除。 |
| `EntityView.vue` | `GET` | `entities/{id}` | 详情。 |
| `EntityView.vue` | `POST` | `entities/{id}/quota-plan/reset` | 重置配额，body: `{quota, reason?}`。 |
| `EntityUpsert.vue` | `GET` | `entity-types` | 类型下拉。 |
| `EntityUpsert.vue` | `GET` | `clusters` | 获取集群列表，筛选含 `llm_config.models` 的集群，通过 `getModelGroupsFromServices` 按集群分组生成模型下拉。 |
| `EntityTypeList.vue` | `GET` | `entity-types` | 类型列表。 |
| `EntityTypeList.vue` | `POST` | `entity-types` | 创建类型。 |
| `EntityTypeList.vue` | `PATCH` | `entity-types/{type_name}` | 更新类型。 |
| `EntityTypeList.vue` | `DELETE` | `entity-types/{type_name}` | 删除类型。 |

> 注：实际代码使用 `PATCH` 更新，与 `OpenAPI消费接口映射.md` 中标注的 `PUT` 不一致，以代码实现为准。模型列表来源于 `clusters` 接口而非 `global-models`。Entity 用 `id`（数字），EntityType 用 `type_name`（字符串）作 URL 主键。

## 8. 边界情况

- `parent_id` 在初始化时被 `String()` 以适配 Select 组件。`parentEntityName` 由父组件传入的 `entityList` 按 `parent_id` 查名字，找不到显示 `-`。
- Entity 删除前应校验是否被 API Key 挂载，但当前由后端返回错误提示，前端只展示。
- Entity Type 的 `level` 决定可挂载的父级范围，修改类型 `level` 可能影响现有父子关系，后端需保证一致性。
- 编辑时禁用关键字段：`name`、`type` 在 `!isAdd` 时 disabled；EntityTypeUpsert 的 `type_name` 在 `!isAdd` 时 disabled。
- `max_concurrency` 三态映射（`syncMaxConcurrencyMode`/`onMaxConcurrencyModeChange`）：`0` → `banned`；`>0` → `limited`；其他（含 `-1`）→ `unlimited`，值规整为 `-1`。
- 限流启用时至少需有一条有效规则（TPM 或 RPM 或有效的 max_concurrency），`max_concurrency='unlimited'` 单独不算有效规则。
- TPM 组合去重键：`model|window_minutes|max_tokens|step_minutes`；RPM 组合去重键：`model|window_minutes|max_requests`。
- 限流未启用时提交清空 rules（`{tpm:[], rpm:[], max_concurrency:-1}`）但保留结构。
- 布尔字符串化：表单 Select 用 `'true'/'false'` 字符串，提交时转真布尔，编辑回填时把后端布尔转字符串。`EntityView` 的 computed 均做 `true`/`'true'` 双兼容。
- `pageTable` 搜索清空：外部 `tableData` 变化时，watch 清空所有 `searchValue` 并重置分页到第 1 页。
