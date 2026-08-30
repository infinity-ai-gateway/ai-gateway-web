# UI 代码变更文档

> **前置**：[2026-08-26 Cluster Key 亲和性](../2026-08-26-cluster-key-affinity/ui-code-changes.md)
> **对照接口**：`providers.md`（`GET /providers/actions/get-provider-names` 返回 `Data.names`）
> **对照原型**：`prototype-design/`（`provider-upsert.js` 模型列表手动输入、`model-price-upsert.js` 提供商下拉候选）
> **状态**：**原型已实现** · **UI 代码已实现**（2026-08-27）

本文记录 2026-08-27 模型名/提供商选择交互增强：Part I 为服务商「模型列表」支持手动输入；Part II 为模型定价「提供商」支持手写 + 下拉候选（模型名保持手写）。

---

## 1. 变更总览

| 页面 / 模块 | 变更要点 | 状态 |
| ----------- | -------- | ---- |
| 服务商 · 创建/编辑 | 模型列表支持 `filterable + allow-create`，可手动输入模型名回车添加（保留「获取」） | ✅ 原型 / UI 代码 |
| 模型定价 · 创建/编辑 | 提供商改为 `AutoComplete`（候选来自 `get-provider-names`，可搜索 + 手写）；模型名保持手写 `Input`（不变） | ✅ 原型 / UI 代码 |
| i18n | 新增 `provider.modelsPlaceholder`、`modelPrices.providerPlaceholder` | UI 代码 |

---

# Part I · 服务商模型列表手动添加

## 2. 对照接口

无需新增接口：`models` 仍由 `POST/PUT /providers` 提交（字符串数组）。本次为 UI 交互变更，仅放开前端「手动输入」入口。

## 3. 变更前后对比

**对照原型**：`provider-upsert.js`（`renderModelListCard` 新增 `proto-model-input` 输入框，Enter / blur 加入模型列表）

| 区域 | 变更前 | 变更后 |
| ---- | ------ | ------ |
| 模型列表控件 | 只读多选（仅「获取」回填，不可手填/删除） | `el-select` 增加 `filterable allow-create default-first-option`，可输入模型名回车 / 点击添加；仍保留「获取」 |
| 占位文案 | `provider.modelsHintDiscoverOnly`「点击「获取」从上游拉取模型列表」 | `provider.modelsPlaceholder`「点击「获取」拉取上游模型列表，或输入模型名回车添加」 |
| `?` 说明 | 仅说明获取流程 | 追加「也可直接输入模型名称，按回车添加到列表」 |

## 4. 涉及文件

- `src/modules/Providers/components/ProviderUpsert.vue`
- `src/i18n/zh.js`、`src/i18n/en.js`
- 原型：`prototype-design/assets/js/provider-upsert.js`

## 5. 验收清单

- [x] 模型列表可手动输入模型名，回车 / 失焦后加入列表
- [x] 「获取」仍可用，仍以覆盖方式回填上游模型（需「提交」才保存）
- [x] 占位文案与 `?` 说明已更新

---

# Part II · 模型定价 provider 手写 + 下拉候选

## 6. 对照接口

- `GET /providers/actions/get-provider-names`：返回 `Data.names`（提供商名称列表）

## 7. 变更前后对比

**对照原型**：`model-price-upsert.js`（provider `proto-autocomplete`）

| 区域 | 变更前 | 变更后 |
| ---- | ------ | ------ |
| 提供商字段 | `Input` 纯文本 | `AutoComplete`（候选来自 `get-provider-names`，可搜索 + 手写），占位「输入或选择提供商名称」 |
| 模型名字段 | `Input` 纯文本 | 保持 `Input` 手写（不变） |
| 提供商校验触发 | `blur` | `change` |

> 说明：原型 `model-price-upsert.js` 中曾包含「模型名按提供商联动下拉」设计，本次已**裁剪**该联动，模型名保持手写 `Input`，仅保留提供商下拉候选。

## 8. 校验规则

- 提供商必填（`providerRequired`）、模型名必填（`modelRequired`）不变。
- 提供商 `AutoComplete` 可下拉选择，也可手动输入任意值。

## 9. 涉及文件

- `src/modules/ModelPrices/components/ModelPriceUpsert.vue`
- `src/i18n/zh.js`、`src/i18n/en.js`
- 原型：`prototype-design/assets/js/model-price-upsert.js`

## 10. 验收清单

- [x] 提供商下拉可搜索 / 选择，也可手动输入
- [x] 候选来自 `get-provider-names`（`Data.names`）
- [x] 模型名仍为手写 `Input`，无联动

---

## 11. 关联文档

| 文档 | 说明 |
| ---- | ---- |
| [2026-08-26 ui-code-changes](../2026-08-26-cluster-key-affinity/ui-code-changes.md) | Cluster Key 亲和性 |
| `api-define/OpenAPI接口定义/providers.md` | `get-provider-names` |
| `api-define/OpenAPI接口定义/model-prices.md` | 模型定价 |
| `prototype-design/assets/js/provider-upsert.js` | 模型列表手动输入 |
| `prototype-design/assets/js/model-price-upsert.js` | 提供商下拉候选 |
