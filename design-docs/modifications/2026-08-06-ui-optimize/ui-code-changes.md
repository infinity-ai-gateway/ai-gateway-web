# UI 代码变更文档

> **核对日期**：2026-08-06
> **状态**：已实施

---

## 1. 变更优先级总览

| 优先级 | 变更点 | 影响模块 | 状态 | 备注 |
| -------- | -------- | ---------- | ------ | ------ |
| P0 | 集群删除失败提示不明确 | 集群 · 列表 | 已修改 | 展示引用路由表/规则并提供跳转链接 |
| P0 | 域名形态实例校验失效 | 集群 · 实例配置 | 已修改 | 校验风格对齐 BaseConfig |
| P1 | 路由表 Entity 属主列展示 id | 路由表 · 列表 | 已修改 | 改为展示 Entity 名称 |
| P1 | 路由规则页无返回入口 | 路由表 · 规则 | 已修改 | 右上返回按钮 + query 直达 |
| P1 | 模型列表接口展示优化 | 集群 · 大模型配置 | 已修改 | 只读 host、组合 URL 样式 |
| P2 | 展示型 Tag 悬停小手 | 全局 | 已修改 | `.ivu-tag { cursor: default }` |
| P2 | API Key ID 列可搜索 | API Key · 列表 | 已修改 | `searchable: true` |
| P2 | Entity 列表新增 ID 列 | Entity · 列表 | 已修改 | 可排序、可搜索 |
| P2 | Entity/API-Key 列表新增「管理路由规则」按钮 | Entity · API Key · 列表 | 已修改 | 直达对应路由规则列表 |
| P2 | CHANGELOG v0.0.6 | 文档 | 已修改 | 记录 0.0.5 之后变更 |

---

## 2. P0：集群删除失败提示与跳转

### 2.1 需求

后台仅返回「集群被转发规则 123 引用」，用户无法知道是哪张路由表的哪条规则。要求展示完整引用信息（路由表类型/属主 + 规则名），并提供跳转链接直达对应路由表。

### 2.2 实现

**影响文件**：`src/modules/Clusters/index.vue`、`src/modules/RouteTable/index.vue`、i18n

1. 删除请求增加 `unneedTips: true`，抑制后台笼统报错，改由页面自行处理失败。
2. 失败后 `findClusterReferences`：拉取 `route-tables` 列表，逐表读取规则（`global-route-rules` / `entities/{owner}` / `api-keys/{owner}`），匹配 `targets` / `fallbacks` 中 `ClusterName` 等于被删集群的规则；同时拉取 Entity / API-Key 列表将属主 id 映射为名称。
3. 弹出 `$Modal.error`，每条引用展示：

> 集群 test 被路由表 Global / Global（路由表类型/路由表属主）的 123 路由规则引用，无法删除。可以点击链接前往对应路由表快速处理：[前往处理]

1. 链接点击后关闭弹框并 `$router.push({ name: 'AdvanceRouteRule.list', query: { type, owner } })`；`RouteTable/index.vue` 新增 `openFromQuery`，挂载时读取 query 自动打开对应路由表规则详情。
2. 未匹配到引用时回退展示后台原始错误信息。

### 2.3 iview `$Modal` 单例限制与规避

该版本 iview 的 `$Modal` 服务为**单例**，且 `remove()` 后 **300ms 延迟销毁**；`render` 仅在实例首次创建时生效。直接「remove 后立即 error」会被延迟销毁一并移除（弹框一闪而过），原地复用实例则 confirm 的 `buttonLoading` 无法重置（确定按钮一直转）。

**规避方案**：失败路径先 `remove()` 并记录时间，引用查询完成后补足剩余等待时间（≥350ms）再创建全新 `$Modal.error`；内容用 `content` HTML 字符串拼装（`render` 不生效），链接用内联 `onclick` 调 `window.__goToRouteTableFromDeleteError(index)`（`beforeDestroy` 清理）。

---

## 3. P0：实例配置校验重构

**影响文件**：`src/modules/Clusters/components/InstancePool.vue`

### 3.1 校验风格对齐 BaseConfig

- 统一使用 `<Form :rules>` + `<FormItem prop>` 标准 iview 校验
- 所有 validator 在 `data()` 内以 `const xxx = (rule, value, callback) => {...}` 箭头函数定义（与 `BaseConfig.vue` / `GatewayConfig.vue` 一致）
- 每行实例的 `addr` / `port` / `weight` 由各自 rules 校验；集合级校验（列表非空、IP 模式权重和 100、至少一个正权重）由 `validateInstanceList` 承担
- 删除旧的 `instanceErrorMessage` 手动错误汇总逻辑

### 3.2 域名形态校验修复

**问题**：切换实例形态为「域名」后，未填域名点击「下一步」不被拦截。

**修改**：`domainName` 规则 `trigger` 使用 `'blur,change'`；切换形态时主动触发字段校验，表单项下方即时显示红字；`handleSubmit` 提交前再次校验拦截。IP 形态校验保持不变。

---

## 4. P1：路由表展示与导航

### 4.1 Entity 属主列展示名称

**影响文件**：`src/modules/RouteTable/index.vue`

路由表列表属主列：`entity` 类型通过 `fetchEntityNames` 映射展示 Entity 名称，不再展示 id。

### 4.2 返回按钮与 query 直达

**影响文件**：`RouteRules.vue`、`RouteTable/index.vue`

- 路由规则页头部右侧（编辑/提交按钮组左侧）新增「返回」按钮（`size="small"`），点击回到路由表列表
- `openFromQuery` 支持 `?type=&owner=` 自动打开详情，供集群删除提示等外部跳转使用

---

## 5. P1：大模型配置展示优化

**影响文件**：`src/modules/Clusters/components/GatewayConfig.vue`

| 项 | 修改 |
| ---- | ------ |
| 模型列表接口 host | 中间部分由 textarea 改为只读文本；IP 形态仅展示首个调用地址 |
| 组合 URL 样式 | 协议下拉显示 `http://` / `https://`（宽 110px）+ disabled 样式 host 文本 + uri 输入框，整体圆角边框组合 |
| 行宽 | 整行 `max-width: 680px`，不撑满弹框 |
| 添加 Header 按钮 | 增加 `margin-top: 14px; margin-bottom: 14px;` 上下间距 |
| 模型重定向回显 | 编辑时 `model_mappings` 为空也初始化一行，避免空表头 |

---

## 6. P2：其他

### 6.1 展示型 Tag 取消小手

**影响文件**：新增 `src/assets/css/theme/components/tag.less`，`src/assets/css/theme/components/index.less` 引入

iview 基础样式 `.ivu-tag { cursor: pointer }` 使纯展示 Tag（API-Key 详情「已启用/是」、Entity 详情、路由规则标签等）悬停显示小手，误导用户以为可点击。全局覆盖为 `cursor: default`。全项目 Tag 均为纯展示（无 checkable/closable），无副作用。

### 6.2 API Key ID 列可搜索

**影响文件**：`src/modules/APIKey/components/ApiKeyList.vue`

`id` 列增加 `searchable: true`。

### 6.3 Entity 列表新增 ID 列

**影响文件**：`src/modules/Entity/components/EntityList.vue`

列表首位新增 `ID` 列（`key: 'id'`，`minWidth: 120`，`sortable: 'custom'`，`searchable: true`），支持排序与搜索。

### 6.4 Entity / API-Key 列表新增「管理路由规则」按钮

**影响文件**：`src/modules/Entity/components/EntityList.vue`、`src/modules/APIKey/components/ApiKeyList.vue`、i18n

- 操作列首位新增绿色 `success`「管理路由规则」按钮（编辑/删除保持不变），列宽 250 → 300
- 点击跳转 `$router.push({ name: 'AdvanceRouteRule.list', query: { type, owner: row.id } })`：Entity 传 `type: 'entity'`，API-Key 传 `type: 'api_key'`
- 路由表页 `openFromQuery` 读取 query 后自动打开该条记录对应的路由规则列表，实现从列表行直达其规则管理界面

### 6.5 CHANGELOG

`CHANGELOG.md` 新增 `v0.0.6 - 2026-08-06` 条目及 release 链接。

---

## 7. i18n 新增

| Key | 中文 |
| ----- | ------ |
| `cluster.deleteBlockedByRule` | 集群 {cluster} 被路由表 {table}（路由表类型/路由表属主）的 {rule} 路由规则引用，无法删除。可以点击链接前往对应路由表快速处理： |
| `cluster.goToHandle` | 前往处理 |
| `route.manageRouteRules` | 管理路由规则 |

英文同步新增。

---

## 8. 测试计划

- [ ] 删除被引用集群：弹框展示完整路由表/规则引用信息与跳转链接；点击链接直达对应路由表规则详情；确定按钮正常关闭
- [ ] 删除未被引用但失败：回退展示后台错误信息
- [ ] 实例配置：IP 形态空地址拦截；切换域名形态空域名即时红字并拦截「下一步」；权重和/正权重集合校验生效
- [ ] 路由表列表：Entity 属主列展示名称；API-Key 属主列展示 id
- [ ] 路由规则页：右上返回按钮回到列表；`?type=&owner=` 直达详情
- [ ] 大模型配置：IP 形态 host 只读且仅首项；协议框宽度合适；编辑空模型映射初始化一行
- [ ] API-Key/Entity 详情 Tag 悬停不再显示小手
- [ ] Entity 列表：ID 列展示、排序、搜索正常
- [ ] Entity/API-Key 列表：点击「管理路由规则」跳转并自动打开该条记录的路由规则列表；按钮样式为绿色 success

---

## 9. 参考文档

| 文档 | 路径 |
| ------ | ------ |
| 上一轮 | `design-docs/modifications/2026-08-05-ui-optimize/ui-code-changes.md` |
| CHANGELOG | `CHANGELOG.md` |
