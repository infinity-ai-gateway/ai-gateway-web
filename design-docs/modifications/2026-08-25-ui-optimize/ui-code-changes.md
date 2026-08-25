# UI 代码变更文档

> **前置**：[2026-08-24 Provider/Cluster 重构](../2026-08-24-ui-optimize/ui-code-changes.md)  
> **对照接口**：`providers.md`、`model-prices.md`、`00-common.md`、`api-keys.md`  
> **状态**：已完成

本文只记录**界面与交互**变更：用户看到什么、能点什么、校验怎么提示。实现文件列在各节末尾。

---

## 1. 变更一览（按页面）

| 页面 | 变更要点 |
| ---- | -------- |
| 服务商 · 列表 | 协议后端筛选；名称/描述/模型当前页筛选；模型列 2 Tag + `+N`；操作列「查询模型价格」 |
| 服务商 · 创建/编辑 | 模型列表仅「获取」回填、可删 tag 不可手填；实例 IP 底栏校验提示；提交 `name=addr` |
| 集群 · 大模型配置 | 所属服务商分步拉取；转发模型全选；Keys 表头「Key」；权重错误单行提示 |
| 集群 · 复查 | 仅展示所属服务商名称，**不**展示服务商实例池表格 |
| 模型定价 | 支持从服务商列表带 `provider` 跳转并自动打开定价详情 |
| Entity / API Key | EntityName、限流规则 `name` 校验（对齐 api-define） |
| 原型 | 服务商模型列表与 Vue 对齐（获取、置灰、`?`） |

---

## 2. 服务商 · 列表

**文件**：`src/modules/Providers/index.vue`

| 区域 | 变更前 / 问题 | 变更后 |
| ---- | ------------- | ------ |
| 筛选 · 协议 | — | 下拉筛选走接口 Query `model_protocol` |
| 筛选 · 名称 / 描述 / 模型 | — | 仅对**当前页**数据前端模糊匹配 |
| 列 · 模型 | 长列表占满行 | 最多 2 个 Tag；其余 `+N`，悬停看全部 |
| 操作列 | 详情 / 编辑 / 删除 | 增加 **「查询模型价格」** |
| 列表加载 | — | `mounted` 不额外全量拉取名称；创建时再拉名称列表 |

**「查询模型价格」**：跳转模型定价页，按该行服务商 `name` 筛选提供商，并自动打开第一条定价的详情抽屉（与手动筛选后点「查看」一致）。定价表 `provider` 须与服务商 `name` 一致。

---

## 3. 服务商 · 创建/编辑

**文件**：`src/modules/Providers/components/ProviderUpsert.vue`

### 3.1 模型列表

| 元素 | 行为 |
| ---- | ---- |
| 多选框 | `multiple`；**不可手填新增**；**可删除**已选 tag |
| 空列表 | 占位「暂无模型」 |
| 「获取」 | 文案「获取」；未选协议或无实例时 **置灰** |
| 点击「获取」 | 直接调 `POST /providers/tools/discover-models` 并回填；**无确认框、无成功 toast**；须点「提交」才保存 |
| `?` 说明 | 标题旁一段说明（协议、实例池、端点、密钥等前置条件） |

**获取可用条件**：已选 `model_protocols`；`instance_pool` 至少一条 `addr` 非空。

### 3.2 实例池（复用 InstancePool）

见 §4。服务商页嵌入同一组件。

---

## 4. 实例 IP 列表（InstancePool）

**文件**：`src/modules/Clusters/components/InstancePool.vue`（服务商创建/编辑、集群相关处复用）

| 区域 | 变更 |
| ---- | ---- |
| 重复 IP+端口 | 对应行红框；提示在表格与「+ 创建」**下方**统一展示（避免行内被下一行挡住） |
| 重复提示文案 | IP 模式：**「实例 IP 和端口不能重复」**（不写「域名」） |
| 提交数据 | 界面无 `name` 列；提交时 `name` 与 `addr` 相同 |
| 校验逻辑 | 用户 blur/change、增删行时刷新底栏提示；校验器之间不互相触发（防页面卡死） |

---

## 5. 集群 · 大模型配置（GatewayConfig）

**文件**：`src/modules/Clusters/components/GatewayConfig.vue`

### 5.1 所属服务商

| 步骤 | 界面行为 |
| ---- | -------- |
| 打开下拉 | `GET /providers/actions/get-provider-names` → 仅名称列表 |
| 选中 / 回显 | `GET /providers/{name}` → 填充「转发模型」「Keys」选项 |
| 加载中 | 转发模型、Key 下拉禁用 |

不再 `GET /providers` 拉全量再本地匹配。

### 5.2 转发模型

| 元素 | 行为 |
| ---- | ---- |
| 下拉首项 | **「全选」**；点击选中该服务商全部模型 |
| 已全部选中 | 「全选」项隐藏 |
| 清空 | 无「清空」项；可用选择框自带 `clearable` |

### 5.3 服务鉴权 Keys

| 区域 | 变更 |
| ---- | ---- |
| 表头 | 「Key」（非「服务商 Key」等长文案） |
| 权重校验 | 仅 **一行** 红色提示（在「+ 添加 Key」下方），不重复 |

---

## 6. 集群 · 复查（Review）

**文件**：`src/modules/Clusters/components/Review.vue`

| 区域 | 变更 |
| ---- | ---- |
| 大模型配置 | 保留「所属服务商」**名称** |
| 服务商实例池 | **已移除** 独立复查面板（实例池只在服务商资源中维护） |

---

## 7. 模型定价（从服务商跳转）

**文件**：`src/modules/Providers/index.vue`、`src/modules/ModelPrices/index.vue`

| 步骤 | 行为 |
| ---- | ---- |
| 1 | 服务商列表点「查询模型价格」 |
| 2 | 进入模型定价页，提供商筛选 = 该服务商 `name` |
| 3 | 自动打开定价详情 Drawer（能力、参数、限制、价格等） |
| 无数据 | 提示「未找到提供商 xxx 的模型定价」 |

路由：`ModelPrice.list?provider={name}&autoView=1`（打开详情后去掉 `autoView` 参数）。

---

## 8. Entity / API Key（校验对齐）

| 模块 | 文件 | UI 变更 |
| ---- | ---- | ------- |
| Entity | `EntityUpsert.vue` | 名称符合 EntityName 规则；表单 tip + 校验 |
| API Key | `APIKey/components/Upsert.vue` | 限流规则 `name`：`[a-zA-Z0-9_-]`；编辑态已有规则 name **只读** |

**工具**：`src/utils/const.js` — `EntityNameRegCheck`、`RateLimitRuleNameRegCheck`

---

## 9. 原型（服务商）

**文件**：`design-docs/prototype-design/assets/js/provider-upsert.js`、`pages/providers.html`、`assets/js/cluster-upsert.js`、`pages/model-prices.html`

| 页面 | 对齐 Vue 的变更 |
| ---- | --------------- |
| 服务商列表 | 模型列 2 Tag + `+N`；操作列「查询模型价格」跳转定价页 |
| 服务商表单 | 模型可删 tag；获取直填无 toast；`?` 单段说明；IP 列表底栏错误；提交 `name=addr` |
| 集群大模型配置 | 转发模型「全选」；Keys 表头「Key」；权重错误在添加按钮下方单行 |
| 集群复查 | 去掉服务商实例池面板 |
| 模型定价 | URL `provider` + `autoView=1` 自动筛选并打开详情 |

Entity / API Key / mock 数据见对应 `entity-upsert.js`、`api-key-upsert.js`、`mock-data.js`。

---

## 10. 文案（i18n）

**文件**：`src/i18n/zh.js`、`src/i18n/en.js`

| key | 中文示例 | 场景 |
| --- | -------- | ---- |
| `provider.syncModels` | 获取 | 模型列表按钮 |
| `provider.modelsHintDiscoverOnly` | 暂无模型 | 空模型列表 |
| `provider.modelsListTip` | 须先填写模型协议、实例池… | 模型列表 `?` |
| `provider.viewModelPrices` | 查询模型价格 | 服务商列表操作列 |
| `gatewayConfig.selectAll` | 全选 | 转发模型下拉 |
| `gatewayConfig.providerKey` | Key | Keys 表头 |
| `instancePool.tipDuplicateIpAndPort` | 实例 IP 和端口不能重复 | IP 列表重复 |
| `modelPrices.noPricingForProvider` | 未找到提供商 {provider} 的模型定价 | 跳转无数据 |

---

## 11. 变更文件

| 文件 | 摘要 |
| ---- | ---- |
| `Providers/index.vue` | 列表筛选、模型 Tag、「查询模型价格」 |
| `Providers/components/ProviderUpsert.vue` | 模型列表交互 |
| `Providers/components/ProviderView.vue` | — |
| `Clusters/components/GatewayConfig.vue` | 所属服务商 API、全选、Keys 校验 |
| `Clusters/components/Review.vue` | 去掉实例池复查 |
| `Clusters/components/InstancePool.vue` | IP 列表校验展示、`name=addr` |
| `ModelPrices/index.vue` | 路由筛选 + 自动详情 |
| `Entity/components/EntityUpsert.vue` | EntityName |
| `APIKey/components/Upsert.vue` | 限流 name |
| `utils/const.js` | 校验函数 |
| `i18n/zh.js`、`i18n/en.js` | 上表文案 |
| `prototype-design/.../provider-upsert.js` 等 | 原型对齐 |

---

## 12. 验收清单

- [x] 服务商列表：协议后端筛；名称/描述/模型当前页筛；模型 2 Tag + `+N`
- [x] 服务商列表：「查询模型价格」→ 定价页筛选 + 自动详情
- [x] 服务商表单：模型不可手填、可删 tag；获取直填无确认；实例 IP 底栏错误提示
- [x] 实例池提交：`name` 与 `addr` 一致；重复提示不含「域名」
- [x] 集群配置：所属服务商分步拉取；转发模型全选；Keys 单行权重提示
- [x] 集群复查：仅服务商名称，无实例池面板
- [x] Entity / API Key：名称规则校验

---

## 13. 关联文档

| 文档 | 说明 |
| ---- | ---- |
| [2026-08-24 ui-code-changes](../2026-08-24-ui-optimize/ui-code-changes.md) | Provider/Cluster 主体 |
| `api-define/.../providers.md` | discover-models、instance_pool |
| `api-define/.../model-prices.md` | 定价列表 `provider` 筛选 |
| `prototype-design/pages/providers.html` | 服务商原型 |
