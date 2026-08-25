# UI 代码变更文档

> **前置**：[2026-08-24 Provider/Cluster 重构](../2026-08-24-ui-optimize/ui-code-changes.md)  
> **对照接口**：`providers.md`、`model-prices.md`、`expression-verify.md`、`00-common.md`、`api-keys.md`  
> **对照原型**：`prototype-design/`（`providers.html`、`model-prices.html`、`route.html` 等）  
> **状态**：**Part I 已完成** · **Part II 已实现** · **Part III 已实现**（原型 + Vue 正式页）

本文记录 2026-08-25 全部 UI 与交互变更。Part I 为 Provider/Cluster 增量优化；Part II 为同批次 API 扩展（分段计价、`tier_prices`、列表全量拉取、表达式源语）。

---

## 1. 变更总览

| 页面 / 模块 | 变更要点 | 状态 |
| ----------- | -------- | ---- |
| 服务商 · 列表 | 模型列 2 Tag + `+N`；「查询模型价格」 | ✅ Part I |
| 服务商 · 列表 | **全量拉取 + 前端筛选/分页**（不传 `page`/`page_size`） | ✅ Part II §14 |
| 服务商 · 列表 | 操作列 **「分段计价配置」** | ✅ Part II §15 |
| 服务商 · 创建/编辑 | 模型「获取」回填、实例 IP 底栏校验 | ✅ Part I |
| 服务商 · 分段计价 Drawer | `time_zone` + peak 时间段 → `PUT pricing-tiers` | ✅ Part II §15 |
| 服务商 · 详情 | **分段计价配置** Card | ✅ Part II §15 |
| 集群 · 大模型配置 | 所属服务商分步拉取、转发模型全选、Keys 校验 | ✅ Part I |
| 集群 · 复查 | 仅展示所属服务商名称 | ✅ Part I |
| 模型定价 | 从服务商跳转并自动打开详情 | ✅ Part I |
| 模型定价 · 创建/编辑/详情 | **价格** Card 合并 `prices` + `tier_prices.peak` | ✅ Part II §15 |
| 路由规则 · 表达式 | `body:` 增加 `req_body_larger_than` / `req_body_less_than` | ✅ Part II §16 |
| Entity / API Key | EntityName、限流规则 `name` 校验 | ✅ Part I |
| 模型定价 · 价格区 | **默认价格** / **分时段价格** 双配置块 + `?` Tooltip | ✅ Part III §20 |
| 服务商 · 分段计价 | 适用时段 Checkbox + 快捷链接；表头「适用时段」 | ✅ Part III §21 |
| 服务商 · 分段计价 · 时区 | 下拉 → **文本输入** + IANA 校验（`Intl`） | ✅ Part III §27 |
| 服务商 · 详情 | 创建/更新时间并入「基本信息」 | ✅ Part III §22 |
| 集群 · Keys | 非必填；空行不参与校验；提交时 filter | ✅ Part III §23 |
| 路由 · 表达式 | 错误仅 FormItem 展示，去掉组件内重复行 | ✅ Part III §24 |

---

# Part I · 已完成

## 2. 服务商 · 列表

**文件**：`src/modules/Providers/index.vue`

| 区域 | 变更后（Part I 已落地） |
| ---- | ---------------------- |
| 列 · 模型 | 最多 2 个 Tag；其余 `+N`，悬停看全部 |
| 操作列 | 增加 **「查询模型价格」** |
| 列表加载 | `mounted` 不额外全量拉取名称；创建时再拉名称列表 |

> **Part II 调整**：Part I 曾实现「协议 **后端** 筛选 + 名称/描述/模型 **当前页** 筛选」，见 §14 改为 **全量拉取 + 全字段前端筛选**。

**「查询模型价格」**：跳转 `ModelPrice.list?provider={name}&autoView=1`，自动打开第一条定价详情。

---

## 3. 服务商 · 创建/编辑

**文件**：`src/modules/Providers/components/ProviderUpsert.vue`

| 元素 | 行为 |
| ---- | ---- |
| 多选框 | **不可手填**；**可删除** tag |
| 「获取」 | 调 `POST /providers/tools/discover-models` 回填；无 toast；须提交才保存 |
| `?` 说明 | 协议、实例池、端点、密钥等前置条件 |

---

## 4. 实例 IP 列表（InstancePool）

**文件**：`src/modules/Clusters/components/InstancePool.vue`

重复 IP+端口：底栏单行提示「实例 IP 和端口不能重复」；提交时 `name=addr`。

---

## 5. 集群 · 大模型配置（GatewayConfig）

**文件**：`src/modules/Clusters/components/GatewayConfig.vue`

- 所属服务商：`get-provider-names` → `GET /providers/{name}`
- 转发模型：**「全选」**
- Keys 表头：**「Key」**；权重错误单行提示

---

## 6. 集群 · 复查（Review）

**文件**：`src/modules/Clusters/components/Review.vue` — 去掉服务商实例池复查面板。

---

## 7. 模型定价（从服务商跳转）

**文件**：`Providers/index.vue`、`ModelPrices/index.vue` — 带 `provider` + `autoView=1` 跳转并打开详情。

---

## 8. Entity / API Key（校验对齐）

**文件**：`EntityUpsert.vue`、`APIKey/components/Upsert.vue`、`utils/const.js`

---

## 9. 原型（Part I）

**文件**：`provider-upsert.js`、`providers.html`、`cluster-upsert.js`、`model-prices.html` 等 — 对齐 Part I Vue 行为。

---

## 10. 文案（i18n · Part I）

| key | 中文示例 | 场景 |
| --- | -------- | ---- |
| `provider.viewModelPrices` | 查询模型价格 | 列表操作列 |
| `gatewayConfig.selectAll` | 全选 | 转发模型 |
| `gatewayConfig.providerKey` | Key | Keys 表头 |
| `instancePool.tipDuplicateIpAndPort` | 实例 IP 和端口不能重复 | IP 列表 |
| `modelPrices.noPricingForProvider` | 未找到提供商 {provider} 的模型定价 | 跳转无数据 |

（完整 key 列表见 Git 历史或 Part I 初版文档。）

---

## 11. Part I 变更文件

`Providers/index.vue`、`ProviderUpsert.vue`、`GatewayConfig.vue`、`Review.vue`、`InstancePool.vue`、`ModelPrices/index.vue`、`EntityUpsert.vue`、`APIKey/Upsert.vue`、`i18n/*`、相关原型脚本。

---

## 12. Part I 验收清单

- [x] 服务商列表：模型 2 Tag + `+N`；「查询模型价格」跳转
- [x] 服务商表单：模型获取、实例 IP 底栏错误
- [x] 集群配置：所属服务商分步拉取、全选、Keys 单行权重提示
- [x] 集群复查：无实例池面板
- [x] Entity / API Key：名称规则校验

---

# Part II · 已实现

## 14. 服务商 · 列表全量拉取与前端筛选

**对照**：`providers.md` §2.2 · 原型 `providers.html`（`allRows` → `filterRows` → 前端分页）

| 区域 | 变更前（Vue） | 变更后 |
| ---- | ------------- | ------ |
| 列表请求 | `GET /providers?page=&page_size=&model_protocol=` | **`GET /providers` 不传分页/筛选 Query** |
| 分页 | `server-pagination`，翻页调接口 | **前端分页**，翻页不请求 |
| 筛选 | 协议后端筛；名称/描述/模型仅当前页 | **全量数据**上本地筛：name / description / model_protocols / models |
| 刷新 | 翻页、筛选也请求 | 仅挂载、增删改成功后全量刷新 |

**文件**：`src/modules/Providers/index.vue`

- `fetchList`：`params: {}`
- `:server-pagination="false"`
- `onPageChange` / 协议筛选 **不再** `fetchList`
- 对齐原型 `filterRows` + slice 分页

---

## 15. 分段计价（Provider + Model Prices）

**对照**：`providers.md` §2.8 `PUT .../pricing-tiers`、`model-prices.md` `tier_prices`  
**原型**：`provider-pricing-tiers.js`、`provider-upsert.js`、`model-price-upsert.js`（**已完成**）

### 15.1 接口背景

| 对象 | 字段 | 说明 |
| ---- | ---- | ---- |
| Provider | `time_zone`、`tiers[]` | 初期 tier 仅 `peak` |
| Model Price | `tier_prices` | 键为 tier name；值为价格对象；未命中 tier 时用 `prices` |

### 15.2 服务商 · 列表 + 分段计价 Drawer

| 区域 | 变更 |
| ---- | ---- |
| 操作列 | 增加 **「分段计价配置」**（`warning`） |
| Drawer | 标题固定「分段计价配置」；顶部只读服务商名 |
| 表单 | 时区**文本输入**（IANA，如 `Asia/Shanghai`）；计价时段只读 **忙时 + peak**；时间段表格（**适用时段** Checkbox + 快捷链接 + time 输入） |
| 提交 | `PUT /providers/{name}/pricing-tiers` |

**新增组件**：`Providers/components/ProviderPricingTiers.vue`

**时间段校验**：peak ≥1 段；`end > start`；同 tier 内不重叠。

### 15.3 服务商 · 详情

**ProviderView.vue** — 「基本信息」含创建/更新时间；Card「分段计价配置」：时区、忙时（peak）、时间段表（未配置则提示）。

### 15.4 模型定价 · 创建/编辑

**ModelPriceUpsert.vue**

| 区块 | 变更 |
| ---- | ---- |
| 基础信息 | 含模型能力、支持参数（不单独 Card） |
| **价格** | **一个 Card** 内两个同级 `.price-config-block`：① **默认价格** `prices`（必填）② **分时段价格** `tier_prices.peak`（可选） |
| 分时段块 | 标题旁 `?` Tooltip（说明 fallback 到默认价格）；**时段对象** + 橙色 Tag「忙时」；动态列表；按钮 **「+ 添加价格」** |
| 提交 | `tier_prices: { peak: {...} }` 可选；未命中 tier 时使用 `prices` |

### 15.5 模型定价 · 详情

**ModelPriceView.vue** — **默认价格** + **分时段价格**（按 tier 展示）。

### 15.6 Part II · 分段计价 i18n（建议）

| key | 中文 |
| --- | ---- |
| `provider.pricingTiers` | 分段计价配置 |
| `provider.pricingTierPeak` | 忙时（peak） |
| `provider.pricingPeakTag` | 忙时 |
| `provider.pricingWeekdays` | 适用时段 |
| `provider.pricingTimeZonePlaceholder` | 如 Asia/Shanghai |
| `modelPrices.priceSection` | 价格 |
| `modelPrices.priceObject` | 默认价格 |
| `modelPrices.tierPriceObject` | 分时段价格 |
| `modelPrices.tierObject` | 时段对象 |
| `modelPrices.tierPriceTip` | 分时段价格配置专属的价格；不在这些时段内时将使用默认价格，可选填。 |

---

## 16. 路由表达式 · 请求体大小条件源语

**对照**：`expression-verify.md` · 原型 `ivu-ui.js` `body:` 组

| 源语 | 含义 |
| ---- | ---- |
| `req_body_larger_than(bytes)` | 请求体 **大于** 阈值（字节，基于 `Content-Length`） |
| `req_body_less_than(bytes)` | 请求体 **小于** 阈值 |

无 `Content-Length` 时不匹配。校验仍走 `PATCH /expression/verify`。

**Vue**：`src/components/Expression/ExpressionConfig.js` — `body` 组追加两按钮，默认片段 `8192` / `2048`，Tooltip 说明 Content-Length 语义。

**原型**：`ivu-ui.js` 同步追加；涉及 `route.html`。

**使用处**：`RouteTable/components/RuleForm.vue`（Global / Entity / API-Key 路由规则）。

---

## 17. Part II 变更文件清单

| 文件 | 摘要 |
| ---- | ---- |
| `Providers/index.vue` | §14 全量筛选 + §15 分段计价按钮/Drawer |
| `Providers/components/ProviderPricingTiers.vue` | **新增** |
| `Providers/components/ProviderView.vue` | 分段计价 Card |
| `ModelPrices/components/ModelPriceUpsert.vue` | 合并价格 Card + `tier_prices` |
| `ModelPrices/components/ModelPriceView.vue` | 展示 `tier_prices` |
| `components/Expression/ExpressionConfig.js` | body 源语 +2 |
| `prototype-design/assets/js/ivu-ui.js` | 表达式按钮 +2 |
| `prototype-design/.../provider-pricing-tiers.js` 等 | 分段计价原型（已完成） |
| `i18n/zh.js`、`en.js` | §15 i18n |

---

## 18. Part II 验收清单

### Provider 列表（§14）

- [x] `GET /providers` 无 `page` / `page_size` / `model_protocol`
- [x] 翻页、筛选不触发列表请求；对全量数据筛选正确

### 分段计价（§15）

- [x] 列表「分段计价配置」→ 独立 Drawer → `PUT pricing-tiers`
- [x] 详情 Card；模型定价合并价格 Card + 只读 peak + `tier_prices` 提交/展示

### 路由表达式（§16）

- [x] `body:` 行有 `req_body_larger_than`、`req_body_less_than` 按钮；校验通过

---

---

# Part III · UI 文案与交互微调

## 20. 模型定价 · 价格区

**文件**：`ModelPriceUpsert.vue`、`ModelPriceView.vue`、`i18n/zh.js` / `en.js`

| 区域 | 变更 |
| ---- | ---- |
| 文案 | 「价格对象」→ **默认价格**；「分时段价格对象」→ **分时段价格** |
| 布局 | 「价格」Card 内 `.price-config-group`：两个 `.price-config-block` 同级并列 |
| 分时段说明 | 去掉正文 tip 段落；标题旁 `ios-help-circle-outline` + Tooltip |
| 时段对象 | 只读 Tag「忙时」（`provider.pricingPeakTag`），非下拉 |
| API | 字段仍为 `prices` / `tier_prices`；仅 UI 文案调整 |

**原型**：`prototype-design/assets/js/model-price-upsert.js` + `prototype-overrides.css`（`.proto-price-config-*`）同步。

## 21. 服务商 · 分段计价 · 适用时段

**文件**：`ProviderPricingTiers.vue`

| 区域 | 变更 |
| ---- | ---- |
| 表头 | 「适用日期」→ **适用时段** |
| 交互 | pill 预设 → **Checkbox** 周一～周日 + 右侧快捷（全选 / 工作日 / 周末） |
| 语义 | 全选或 7 日均为 `weekdays: []`（每天）；部分选中为具体数组 |

**原型**：`provider-pricing-tiers.js`、`provider-upsert.js` 详情表头同步。

## 22. 服务商 · 详情时间戳

**ProviderView.vue** — `create_time` / `update_time` 移入「基本信息」Card；移除独立「时间戳」Card。

## 23. 集群 · GatewayConfig Keys

**GatewayConfig.vue**

| 要点 | 说明 |
| ---- | ---- |
| 必填 | Keys 表格**非必填**；允许仅空行占位 |
| 校验 | 仅对 `name` 非空的行校验 name 归属与 weight；空行不拦截 |
| 提交 | `filter` 掉 `name` 为空的项后再提交 |
| 默认 | 新行 `weight: 0` |

## 24. 路由 · 表达式错误展示

**Expression/index.vue** — 移除组件内 `.error` 文本；校验失败仅由外层 `RuleForm` 的 FormItem `error` 展示，避免重复两行。

## 27. 服务商 · 分段计价 · 时区输入

**背景**：接口 `time_zone` 为任意合法 **IANA 时区名**（无枚举）；原 UI 使用 6 项固定下拉，与 OpenAPI 不一致。

**文件**：`ProviderPricingTiers.vue`、`utils/tool.js`、`i18n/zh.js` / `en.js`

| 区域 | 变更 |
| ---- | ---- |
| 控件 | `Select`（6 项硬编码）→ **`Input` 文本输入** |
| 占位 | `provider.pricingTimeZonePlaceholder`（如 `Asia/Shanghai`） |
| 校验 | `isValidIanaTimeZone()`：`Intl.DateTimeFormat(undefined, { timeZone })` 不抛错即合法 |
| 与 API | 对齐 `providers.md`「须为合法 IANA 时区名」；后端 `time.LoadLocation` |
| 边界 | 极少数时区可能因浏览器/Go 时区库版本差异前后端结果不一致，以 API 422 为准 |

**原型**：`provider-pricing-tiers.js` 同步为 `#pricing-tiers-time-zone` 文本框 + 相同 `Intl` 校验。

## 25. Part III 变更文件清单

| 文件 | 摘要 |
| ---- | ---- |
| `ModelPrices/components/ModelPriceUpsert.vue` | 双配置块 + Tooltip + 忙时 Tag |
| `ModelPrices/components/ModelPriceView.vue` | 默认价格 / 分时段价格文案 |
| `Providers/components/ProviderPricingTiers.vue` | Checkbox 适用时段 + 时区 Input + IANA 校验 |
| `Providers/components/ProviderView.vue` | 时间戳并入基本信息 |
| `Clusters/components/GatewayConfig.vue` | Keys 可选、空行 filter |
| `components/Expression/index.vue` | 去掉重复 error |
| `utils/tool.js` | 新增 `isValidIanaTimeZone` |
| `Providers/index.vue` | 模型列纯 Tag 展示（2 + `+N`） |
| `prototype-design/assets/js/model-price-upsert.js` | Part III 价格区 |
| `prototype-design/assets/js/provider-pricing-tiers.js` | 适用时段 Checkbox + 时区 Input |
| `prototype-design/assets/js/provider-upsert.js` | 详情时间戳位置 |
| `prototype-design/assets/css/prototype-overrides.css` | 价格区 / weekday Checkbox 样式 |
| `i18n/zh.js`、`en.js` | Part III 文案 |

## 26. Part III 验收清单

- [x] 模型定价创建页：默认价格 / 分时段价格双块；分时段标题 `?` Tooltip；忙时 Tag
- [x] 分段计价 Drawer：适用时段 Checkbox + 快捷；表头「适用时段」；时区文本输入 + IANA 校验
- [x] 服务商详情：基本信息含创建/更新时间
- [x] 集群 Keys：空行可提交；有 name 行权重之和 = 100
- [x] 路由表达式：条件错误单行展示
- [x] 原型 `model-prices.html` / `providers.html` 与 Vue 一致

---

## 19. 关联文档

| 文档 | 说明 |
| ---- | ---- |
| [2026-08-24 ui-code-changes](../2026-08-24-ui-optimize/ui-code-changes.md) | Provider/Cluster 主体 |
| `api-define/.../providers.md` | 列表全量、pricing-tiers |
| `api-define/.../model-prices.md` | `tier_prices` |
| `api-define/.../expression-verify.md` | 请求体大小源语 |
| `sys-design/各模块实现细节设计/` | 模块细节（Part III 同步） |
| `prototype-design/pages/providers.html` | Part II/III Provider 原型 |
| `prototype-design/pages/model-prices.html` | 模型定价原型 |
