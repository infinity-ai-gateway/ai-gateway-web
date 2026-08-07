# OpenAPI 优化 —— UI 代码变更文档

> 说明：本文档基于 `api-changes.md`（接口差异）与 `prototype-ui-compare.md`（原型与 UI 差异）整理，明确前端需要修改的具体位置、修改内容与预期效果。本文档是前端开发执行本次 OpenAPI 对齐与原型对齐的变更依据。

---

## 1. 变更背景

- 后端 OpenAPI 文档已更新，部分接口路径、字段与前端实际调用不一致。
- 产品原型设计已更新，路由管理模块变化较大，APIKey/Entity 模型数据源、Cluster 接口路径同步调整。
- 前端代码中存在已废弃接口调用、未注册路由、重复模块等问题，需要统一清理。

---

## 2. 变更范围总览

| 优先级 | 模块 | 变更类型 | 涉及文件 |
|--------|------|----------|----------|
| 高 | 路由管理 | 新增页面、重构组件、调整导航 | `src/router/router.js`、`src/layout/...`、新增 `src/modules/RouteTable/index.vue`、新增 `src/modules/RouteTable/components/RouteRules.vue`、新增 `src/modules/RouteTable/components/RuleView.vue`、清理 `src/modules/Routes/` 与 `src/modules/AIRouteRules/` |
| 高 | APIKey 模型选择 | 接口/数据源调整 | `src/modules/APIKey/components/Upsert.vue` |
| 中 | Entity 模型选择 | 接口/数据源调整 | `src/modules/Entity/components/EntityUpsert.vue` |
| 中 | Cluster 集群 | 接口路径调整 | `src/modules/Clusters/components/GatewayConfig.vue`、`src/modules/Clusters/components/Review.vue` |

---

## 3. 详细变更清单

### 3.1 路由管理模块（高优先级）

#### 3.1.1 新增「路由表列表页」

- **目标**：按原型 `route-tables.html` 实现。
- **新增文件**：`src/modules/RouteTable/index.vue`（或类似命名）。
- **新增路由**：在 `src/router/router.js` 中注册 `RouteTable.list`，路径建议 `/route-tables`。
- **侧栏入口**：替换现有 `/router` 和 `/ai-rule` 两个入口，统一为「路由管理 → 路由表」。
- **调用接口**：`GET /open-api/v1/route-tables`。
- **预期页面能力**：
  - 表格列：路由表类型（`global`/`entity`/`api_key`）、属主（`owner`）、状态、操作。
  - 操作：查看、启用/停用。
  - 查看交互：点击「查看」后，根据当前行 `type` 和 `owner` 在当前页面直接展示路由规则详情子组件，不通过 URL 参数传递，不使用弹框/抽屉。详情页没有独立的「返回」按钮，返回列表依赖全局面包屑；面包屑通过 `store.setBreadcrumbTitle` 显示为「路由规则 - 类型 / 属主」，同时通过 `store.setBreadcrumbTitle(title, routeName)` 注册返回路由名。面包屑只高亮「路由表」部分（蓝色可点击），点击后通过 `$router.push({ name: 'AdvanceRouteRule.list' })` 回到路由表列表，而不是简单的 `router.back()`。
    - `global` → props 传入 `type: 'global'`（`owner` 为空）。
    - `entity` → props 传入 `type: 'entity'`、`owner: entityId`（来自 `/route-tables` 返回的 `owner`）。
    - `api_key` → props 传入 `type: 'api_key'`、`owner: apiKeyId`（来自 `/route-tables` 返回的 `owner`）。

#### 3.1.2 重构「路由规则编辑页」

- **目标**：按原型 `route.html` 实现为子组件，根据路由表类型分别读取/更新对应资源的路由规则。`entity`/`api_key` 通过资源自身的 `route_rules` 字段更新；`global` 通过独立接口 `/global-route-rules` 更新。替换旧 `Routes/index.vue` 的表达式转发模型。
- **涉及文件**：新建 `src/modules/RouteTable/components/RouteRules.vue`（子组件）、`src/modules/RouteTable/components/RuleView.vue`（只读规则展示）；父组件为 `src/modules/RouteTable/index.vue`。
- **组件进入方式**：由 `RouteTable/index.vue` 作为父组件，点击「查看」后通过 `v-if` 在当前页面直接渲染 `RouteRules` 子组件，不通过 URL 传参，不使用弹框/抽屉。
- **props 设计**：

| prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 路由表类型：`global` / `entity` / `api_key` |
| `owner` | string | 否 | 属主 ID，`entity` 或 `api_key` 类型必填 |
| `initialData` | object | 否 | 父组件已获取的初始路由规则数据，子组件可直接使用；未传入时子组件自行获取 |

- **三种类型处理逻辑**：

| 类型 | 父组件行为 | 子组件获取规则 | 子组件更新规则 | 说明 |
|------|-----------|----------------|----------------|------|
| `global` | 直接渲染子组件 | `GET /global-route-rules` | `PUT /global-route-rules`（body 传完整 `{enabled, rules}`） | 全局路由表，无属主；旧路径为 `/ai-route-rules` |
| `entity` | 直接渲染子组件（`owner` 来自 `/route-tables` 的 `owner`） | `GET /entities/{id}` 或读取父组件传入的 `initialData` | `PATCH /entities/{id}`（body 只传 `route_rules`） | 以 Entity 为属主 |
| `api_key` | 直接渲染子组件（`owner` 来自 `/route-tables` 的 `owner`） | `GET /api-keys/{id}` 或读取父组件传入的 `initialData` | `PATCH /api-keys/{id}`（body 只传 `route_rules`） | 以 API Key 为属主 |

- **主要变更**：
  - 子组件通过 `props` 接收 `type` 与 `owner`，据此判断调用哪个接口。
  - 增加「启用路由表」开关（使用 `Select` 下拉框选择启用/停用）。
  - 增加查看/编辑模式切换：
    - 进入详情页默认处于**查看模式**，显示「当前路由表：类型 / 属主」头部、「进入编辑模式」按钮、规则列表只读展示、操作列显示「查看」按钮。
    - 点击「进入编辑模式」后切换到**编辑模式**，显示「退出编辑模式」和「提交并生效」按钮，启用/停用下拉框可编辑，显示「添加规则」按钮，操作列显示「编辑」和「删除」按钮。
    - 查看模式下点击「查看」打开规则详情抽屉，使用 `RuleView.vue` 组件只读展示规则字段，底部只显示「关闭」按钮。
    - 编辑模式下点击「编辑」或「添加规则」打开规则表单抽屉 `RuleForm.vue`，可编辑并提交。
  - 批量提交（点击「提交并生效」后触发对应更新接口；`entity`/`api_key` 为 `PATCH` 只传 `route_rules`；`global` 为 `PUT` 传完整 `{enabled, rules}`）。
  - `RuleForm.vue` 保留 `readonly` prop，但当前查看模式使用 `RuleView.vue` 展示，编辑模式下 `RuleForm.vue` 以可编辑状态打开。
  - 规则模型改为：规则名称、Cond 表达式、多目标（集群 + 模型 + 权重，权重合计 100%）、多备用集群/模型。
  - 移除现有拖拽排序（原型无排序），改为按提交顺序或权重排序。
- **字段确认**：`route_rules` 与 `/global-route-rules` 返回的 `rules` 结构一致，均为：

```json
{
  "enabled": true,
  "rules": [
    {
      "name": "...",
      "Cond": "...",
      "targets": [{ "ClusterName": "...", "Model": "...", "Weight": 100 }],
      "fallbacks": [{ "ClusterName": "...", "Model": "..." }]
    }
  ]
}
```

  当前旧 `Routes/index.vue` 使用 `forward_rules`，`AIRouteRules/index.vue` 使用 `rules`；重构后统一按文档结构使用 `rules`。

#### 3.1.3 启用/停用路由表交互

- **交互方式**：在列表页「操作」列放置两个独立按钮：
  - **启用**（绿色）：当前状态为 `enabled=false` 时可点击，`enabled=true` 时置灰禁用。
  - **停用**（橙色）：当前状态为 `enabled=true` 时可点击，`enabled=false` 时置灰禁用。
  - 点击按钮后直接按类型调用对应接口更新启用状态，无需二次确认。启用成功提示 `路由表已启用`，停用成功提示 `路由表已停用`。
- **状态来源**：`/route-tables` 返回的 `enabled` 字段。
- **接口调用**：
  - `global`：先调用 `GET /global-route-rules` 获取完整 `{enabled, rules}`，再调用 `PUT /global-route-rules`，body 传 `{enabled: newValue, rules: currentRules}`。
  - `entity`：先调用 `GET /entities/{id}` 获取完整资源，再调用 `PATCH /entities/{id}`，body 传 `{route_rules: {enabled: newValue, rules: currentRules}}`。
  - `api_key`：先调用 `GET /api-keys/{id}` 获取完整资源，再调用 `PATCH /api-keys/{id}`，body 传 `{route_rules: {enabled: newValue, rules: currentRules}}`。
- **注意事项**：`/route-tables` 列表仅返回 `type`、`owner`、`enabled`，不返回完整 `rules`。切换启用状态时必须先获取完整 `rules`，避免只传 `enabled` 导致原有规则被覆盖清空。

#### 3.1.4 调整导航菜单

- **涉及文件**：`src/router/router.js`、`src/layout/sidebar/navItem.vue`。
- **后端菜单数据（/meta 返回，不修改后端）**：

```json
{
    "id": "route.admin.list",
    "text": "RouteManage",
    "children": [
        {
            "id": "AdvanceRouteRule.list",
            "text": "AdvanceRouteRuleManage"
        }
    ]
}
```

- **前端变更内容**：
  - 删除 `/router`（默认路由规则）菜单项。
  - 删除 `/ai-rule`（AI 路由规则）菜单项。
  - 新增「路由管理 → 路由表」菜单项，指向新路由表列表页。
  - `src/router/router.js`：新增路由表列表页路由，路由 `name` 必须与后端菜单 `id` 一致，即 `AdvanceRouteRule.list`，路径为 `/route-tables`，组件为 `src/modules/RouteTable/index.vue`。
  - `src/layout/sidebar/navItem.vue`：在 `navIcon` 映射中为 `AdvanceRouteRule.list` 添加图标，例如 `'AdvanceRouteRule.list': 'iconfont icon-zhuanfa'`。
  - `src/i18n/zh.js` / `src/i18n/en.js`：补充 `nav.AdvanceRouteRuleManage` 翻译，中文显示为「路由表」。

#### 3.1.5 清理旧路由模块

- **涉及文件**：`src/modules/Routes/`、`src/modules/AIRouteRules/` 下所有文件。
- **变更内容**：新路由规则编辑页由新建的 `RouteTable/components/RouteRules.vue` 子组件实现，与旧 `Routes/index.vue` 和 `AIRouteRules/index.vue` 无关。删除旧目录下所有组件文件、样式、国际化文案（如有），确认没有遗漏引用。

---

### 3.2 APIKey 管理模块

#### 3.2.1 模型白名单数据源调整

- **涉及文件**：`src/modules/APIKey/components/Upsert.vue`。
- **当前代码**：调用 `GET /open-api/v1/global-models` 获取模型列表，读取 `data.data.Data.services`。
- **变更方向**：`/global-models` 已废弃，改为调用 `GET /open-api/v1/clusters`，按 cluster 构造 `{cluster_name, models}` 数组，保持与旧 `services` 数据结构一致，作为模型选择数据源。
- **示例**：

```javascript
this.$request({
    url: 'clusters',
    method: 'get',
    openapi: true
}).then((data) => {
    const clusters = data.data.Data || [];
    this.modelServices = clusters
        .filter(cluster => cluster.llm_config && cluster.llm_config.models && cluster.llm_config.models.length > 0)
        .map(cluster => ({
            cluster_name: cluster.name,
            models: cluster.llm_config.models
        }));
});
```

- **说明**：保持与旧 `/global-models` 一致的 `services` 数组结构（每个元素含 `cluster_name` 和 `models`），分组与去重继续由 `getModelGroupsFromServices` 处理。

### 3.3 Entity 管理模块

#### 3.3.1 模型白名单数据源调整

- **涉及文件**：`src/modules/Entity/components/EntityUpsert.vue`。
- **当前代码**：调用 `GET /open-api/v1/global-models` 获取模型列表。
- **变更方向**：`/global-models` 已废弃，与 APIKey 一致，改为调用 `GET /open-api/v1/clusters`，按 cluster 构造 `{cluster_name, models}` 数组，保持与旧 `services` 数据结构一致；分组与去重继续由 `getModelGroupsFromServices` 处理。

---

### 3.4 Cluster 集群模块

#### 3.4.1 模型提供商类型接口路径调整

- **涉及文件**：`src/modules/Clusters/components/GatewayConfig.vue`、`src/modules/Clusters/components/Review.vue`。
- **当前代码**：调用 `GET /open-api/v1/model-providers`（旧路径）。
- **接口文档**：定义为 `GET /open-api/v1/model-provider-types`。
- **变更方向**：将前端调用路径改为 `GET /open-api/v1/model-provider-types`。

#### 3.4.2 获取模型列表接口路径调整

- **涉及文件**：`src/modules/Clusters/components/GatewayConfig.vue`。
- **当前代码**：调用 `POST /open-api/v1/models`（旧路径）。
- **接口文档**：定义为 `POST /open-api/v1/tools/get-models-from-provider`。
- **变更方向**：将前端调用路径改为 `POST /open-api/v1/tools/get-models-from-provider`，请求体保持不变。

---

## 4. 接口依赖与后端确认项

| 接口 | 当前 UI 调用 | 文档定义 | 需要确认的问题 |
|------|-------------|----------|----------------|
| `/route-tables` | 未使用 | 已定义 | 返回字段结构、查询参数、分页方式 |
| `/entities` + `route_rules` | 未使用 | 已定义 | `GET /entities` 返回含 `route_rules`；`PATCH /entities/{id}` 支持只更新 `route_rules` |
| `/api-keys` + `route_rules` | 未使用 | 已定义 | `GET /api-keys` 返回含 `route_rules`；`PATCH /api-keys/{id}` 支持只更新 `route_rules` |
| `/global-route-rules` | 旧 `Routes/index.vue` 使用 `/ai-route-rules`（旧路径） | 已定义 | 前端改为 `GET`/`PUT`；返回结构为 `{enabled, rules}`；与 `entity`/`api_key` 的 `route_rules` 字段结构一致 |
| `/clusters` | 使用 `ready` 字段；APIKey/Entity 模型选择也需要 | 未明确 | 文档是否补充 `ready` 字段；确认 `llm_config.models` 可作为模型数据源 |

---

## 5. 实施建议顺序

1. **先确认接口口径**：与后端确认上表中所有接口的实际生效路径与字段结构，避免前端改后再次返工。
2. **路由模块先行**：路由模块变更最大，涉及新增页面、重构组件、调整导航，建议优先完成。
3. **清理冗余代码**：在 `RouteTable` + `RouteRules` 新模块完成后，删除旧 `Routes/` 和 `AIRouteRules/` 模块。
4. **APIKey / Entity 模型数据源**：删除 `/global-models` 调用，改为从 `GET /clusters` 的 `llm_config.models` 中提取模型列表。

---

## 6. 参考文档

- `design-docs/modifications/2026-07-29-open-api-optimize/api-changes.md`
- `design-docs/modifications/2026-07-29-open-api-optimize/prototype-ui-compare.md`
- `design-docs/api-define/OpenAPI接口定义.md`
- `design-docs/prototype-design/` 原型文件
- `src/router/router.js`
- `src/modules/` 各模块源码
