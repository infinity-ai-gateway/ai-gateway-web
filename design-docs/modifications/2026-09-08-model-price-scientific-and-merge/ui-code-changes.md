# UI 代码变更文档

> **对照接口**：`model-prices.md` §1 数据模型、§1.2 价格精度与 JSON 序列化、§3.7/§3.8 PUT 部分更新  
> **对照原型**：`prototype-design/pages/model-prices.html`、`assets/js/model-price-upsert.js`、`assets/js/mock-data.js`  
> **前置**：[2026-09-05-entity-name-allow-at](../2026-09-05-entity-name-allow-at/ui-code-changes.md)  
> **状态**：原型已 review 通过 · Vue / i18n / 用户文档 / sys-design **已实现**（`npm run lint` 通过，待 UI Review）  
> **关联 Issue**：[ai-gateway-api#140](https://github.com/rainway-ai-gateway/ai-gateway-api/issues/140)（PUT 键级合并）、科学计数法放开（api `2026-09-08-model-price-scientific-notation`）

本次跟随 `ai-gateway-api` v0.0.9 拉取（`ea5017f..9166052`）同步 UI。接口契约字段名不变，变更集中在价格**文本表示**与 PUT **合并粒度**。

**不改 UI**：issue #142 导出配置版本号同秒碰撞（InnerAPI `config_versions` UNIQUE + 单调 +1s），控制台无对应页面。

---

## 1. 变更总览

| 页面 / 模块 | 变更要点 | 状态 |
| ----------- | -------- | ---- |
| 模型定价 · 创建/编辑 | 右对齐文本输入 + **失焦按量级格式化**（业界 Excel/工程软件惯例）；去掉 8 位截断；`价格×1e8 < 2^53` | ✅ 已实现 |
| 模型定价 · 创建/编辑 | 编辑提示：`prices` / `tier_prices` **键级合并**（删行不会清除后端已有键） | ✅ 已实现 |
| 模型定价 · 详情 | `formatPrice` 不再把科学计数法展开成超长十进制，按 float64 自然字符串展示 | ✅ 已实现 |
| 原型 模型定价 | 已落地：文本输入、hint、键级合并 mock、科学计数法示例数据 | ✅ 已完成 |
| 用户文档 / sys-design | 去掉「最多 8 位小数」；补科学计数法与 PUT 合并语义 | ✅ 已实现 |

---

## 2. 价格科学计数法与精度

### 对照接口

`model-prices.md`：

- `prices` / `tier_prices`：科学计数法与十进制表示法等价合法（如 `1.5e-6` 与 `0.0000015`），按 `float64` 解析。
- 精度上限来自 `float64`（有效数字约 15 位）；单价格折算 `价格 × 1e8` 不得超过 `2^53`（约 `9e15`），超出拒绝写入。
- 响应体中极小值可能以科学计数法出现，属正常行为（不再强制十进制序列化）。

### 对照原型

| 元素 | 原型行为 |
| ---- | -------- |
| 价格输入 | 右对齐等宽文本框；键入保留原文；**失焦后按量级格式化**（`< 1e-4` 或 `≥ 1e6` → 科学计数法，否则十进制） |
| 限制对象 | 仍为 `type="number"` 非负整数，不变 |
| 详情展示 | 与输入失焦同一套规则（`7.6234102728e-8`、`0.04`） |
| 校验 | 非负；`\|price × 1e8\| ≥ 2^53` 时提示「价格 × 1e8 不得超过 2^53（约 9e15）」 |
| Hint | 「价格支持科学计数法与十进制……」 |
| Mock | DeepSeek 价格改为 `e-` 写法；新增 `Qwen3-8B`（`4.141631732e-6` / `7.6234102728e-8`） |

### 变更前后对比

| 项 | 变更前 | 变更后 |
| -- | ------ | ------ |
| 价格控件 | `el-input-number` `:precision="8"` | 右对齐文本框（非步进数字框）；失焦按量级格式化 |
| 详情展示 | 遇 `e`/`E` 则 `toFixed(20)` 强制十进制 | 与输入共用 `src/utils/price.js`：`< 1e-4` 或 `≥ 1e6` 科学计数法 |
| placeholder | 「请输入价格」 | 「如 1.5e-6 或 0.0000015」 |
| 前端校验 | 仅非负 | 非负 + `价格 × 1e8 < 2^53` |
| 文案 | 「最多 8 位小数」 | 科学计数法与十进制等价；不再限 8 位小数 |
| placeholder | 「请输入价格」 | 「如 1.5e-6 或 0.0000015」 |

### 涉及文件（待改）

| 文件 | 说明 |
| ---- | ---- |
| `src/utils/price.js` | 价格解析 / 量级格式化 / overflow 校验（详情与表单共用） |
| `src/modules/ModelPrices/components/ModelPriceUpsert.vue` | 文本输入、失焦格式化、hint、overflow |
| `src/modules/ModelPrices/components/ModelPriceView.vue` | 使用 `formatPriceDisplay` |
| `src/i18n/zh.js` / `en.js` | placeholder、hint、overflow 文案 |
| `docs/zh-cn/06-model-prices.md` | §6.2 / §6.5 去掉「最多 8 位小数」 |
| `design-docs/sys-design/各模块实现细节设计/模型定价.md` | 价格校验与展示说明 |

### 验收清单

- [ ] 输入 `0.0000015` 后失焦，显示为 `1.5e-6`；输入 `0.04` 失焦仍为 `0.04`
- [ ] 创建时可提交 `1.5e-6`、`0.0000015`，读回数值相等
- [ ] 可提交 `7.6234102728e-08`（超过 8 位小数），不被前端截成 0
- [ ] 详情页与失焦后输入框展示规则一致（极小值科学计数法）
- [ ] 输入负数：拦截，提示非负数
- [ ] 输入过大值（使 `价格 × 1e8 ≥ 2^53`）：拦截，提示上限文案
- [ ] 详情页极小价格以科学计数法或等价数值展示，不再被 `toFixed(20)` 拉成超长十进制
- [ ] `npm run lint` 通过

---

## 3. PUT 部分更新：prices / tier_prices 键级合并

### 对照接口

`model-prices.md` §3.7 / §3.8：

- `prices`、`tier_prices`：**键级合并**。请求中传入的键覆盖对应键，未传入的键保留原值；`tier_prices` 未传入的 tier 整档保留。
- `limits`、`metadata`、`capabilities`、`supported_parameters`：**整块替换**（传入即覆盖，未传入保持原值）。

### 对照原型

- 编辑提交对 `prices` / `tier_prices` 做 `mergePriceMap` / `mergeTierPriceMap`（与 api `mergeModelPrice` 同语义）。
- 编辑 Hint：「表单中的键覆盖原值，未出现的键保留（删除某行不会清除后端已有键）。」
- 创建（POST）仍整对象写入，无合并。

### 变更前后对比

| 项 | 变更前（后端整 map 替换） | 变更后（键级合并） |
| -- | ------------------------ | ------------------ |
| 编辑时删掉 `output_cost_per_token` 再提交 | 该键从记录中消失 | 该键**保留**原值 |
| 编辑只改 `input_cost_per_token` | 若前端只带这一键，其余价格被静默清空（#140） | 其余键保留 |
| UI 删除按钮 | 语义 = 从记录删除该键 | 仅从表单去掉；未提交的键后端仍在。须用 Hint 说清 |

> 当前 Vue `buildPayload` 仍会带上表单里剩余的全部 `prices` 键。用户**不删行、只改值**时，合并与整换结果相同。差异只出现在「编辑时删除已有价格行」。

### 涉及文件（待改）

| 文件 | 说明 |
| ---- | ---- |
| `src/modules/ModelPrices/components/ModelPriceUpsert.vue` | 编辑态展示 merge Hint（payload 结构不必为删键再造特殊请求，与合同一致即可） |
| `src/i18n/zh.js` / `en.js` | 键级合并说明文案 |
| `docs/zh-cn/06-model-prices.md` | 编辑语义：未出现的价格键保留 |

### 验收清单

- [ ] 编辑记录（含 `input` + `output`），只改 `input` 提交：`output` 仍在
- [ ] 编辑时删除 `output` 行再提交：详情仍能看到 `output`（键级合并），Hint 已说明此行为
- [ ] 创建仍要求至少一条默认价格；新建记录不含未填写的键
- [ ] `limits` / 能力 / 参数仍为整块提交（与合同「整块替换」一致）

---

## 4. 原型已改文件（本轮已落地）

| 文件 | 说明 |
| ---- | ---- |
| `design-docs/prototype-design/assets/js/model-price-upsert.js` | 文本价格输入、失焦量级格式化、overflow、PUT mock 键级合并、Hint |
| `design-docs/prototype-design/assets/js/mock-data.js` | 科学计数法示例（DeepSeek + Qwen3-8B） |
| `design-docs/prototype-design/assets/css/prototype-overrides.css` | `.proto-price-hint` |
| `design-docs/prototype-design/pages/model-prices.html` | 脚本 cache bust `?v=2026090801` |
| `design-docs/api-define/OpenAPI接口定义/model-prices.md` | 已从 api 仓库同步 |

---

## 5. 明确不改

| 范围 | 原因 |
| ---- | ---- |
| 操作日志 / 集群 / 服务商页面 | 无 OpenAPI 字段变更 |
| InnerAPI 版本号 UI | issue #142 仅影响导出 Version，控制台无版本号页面 |
| YAML 导入交互 | 导入仍走 `/model-prices/import`；科学计数法由后端 YAML 解析，前端不截断即可 |
