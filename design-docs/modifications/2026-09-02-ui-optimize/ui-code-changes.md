# UI 代码变更文档

> **对照接口**：`00-common.md`（QuotaPlan）、`providers.md`、`clusters.md`  
> **前置**：[2026-09-01-certificates](../2026-09-01-certificates/ui-code-changes.md)  
> **接口变更**：无新 OpenAPI 端点；`quota` 合法性条件与库表 `DECIMAL(18,8)` 对齐  
> **状态**：已完成  
> **关联 Issue**：#93、#92、#91、#90

## 变更总览

| Issue | 页面 / 模块 | 变更要点 |
|------|-------------|----------|
| #93 | API Key / Entity 创建、编辑、配额重置 | `total_token` 配额总量上限改为 9,999,999,999（对齐 `DECIMAL(18,8)`）；提交时显式校验嵌套字段 |
| #92 | 集群 · 大模型配置 · 模型重定向 | 选择目标模型后，仅当原模型名为空时自动填入同名 |
| #91 | 模型服务商 · 模型列表 | 新增「批量添加」弹窗；下拉粘贴多 token 时合并进现有列表 |
| #90 | 集群 · 大模型配置 · Keys | 下拉过滤其他行已选 Key 名称，避免重复选择 |

无需改后端接口。RMB 上限仍为 90,000,000.00；TPM/RPM 仍为 int64，本次不改。

---

## 需修改文件

| 文件 | 说明 |
| ------ | ------ |
| `src/utils/const.js` | 新增 `TOKEN_QUOTA_MAX = 9999999999`、`RMB_QUOTA_MAX = 90000000` |
| `src/modules/APIKey/components/Upsert.vue` | InputNumber `:max`、校验、提交时 `validateField('quota_plan.quota')` |
| `src/modules/APIKey/components/ApiKeyView.vue` | 重置配额弹窗同样使用 `TOKEN_QUOTA_MAX` |
| `src/modules/Entity/components/EntityUpsert.vue` | 同上 |
| `src/modules/Entity/components/EntityView.vue` | 重置配额弹窗同上 |
| `src/modules/Clusters/components/GatewayConfig.vue` | `changeMappingTarget` 左右联动；`availableProviderKeys(index)` 过滤已选项 |
| `src/modules/Providers/components/ProviderUpsert.vue` | 「批量添加」Modal、`parseModelNames` / `mergeModels`、下拉 `@paste.native` |
| `src/i18n/zh.js` / `src/i18n/en.js` | `provider.batchAddModels` 等文案；更新 `modelsPlaceholder` / `modelsListTip` |
| `docs/zh-cn/08-entity.md` / `09-api-key.md` | 配额总量上限说明 |
| `docs/zh-cn/05-ai-business-cluster.md` | 模型重定向联动、Keys 下拉过滤 |
| `docs/zh-cn/04-model-provider.md` | §4.7 批量添加；首次接入最小配置提及批量添加 |
| `design-docs/prototype-design/assets/js/provider-upsert.js` | 「批量添加」弹窗、粘贴拆分、占位文案 |
| `design-docs/prototype-design/assets/js/cluster-upsert.js` | 模型重定向联动；Keys 下拉过滤已选项 |
| `design-docs/prototype-design/assets/js/api-key-upsert.js` | `TOKEN_QUOTA_MAX`；配额输入 / 重置上限 |
| `design-docs/prototype-design/assets/js/entity-upsert.js` | 同上 |
| `design-docs/prototype-design/pages/api-key.html` | 重置配额校验对齐上限 |
| `design-docs/prototype-design/pages/entity.html` | 重置配额校验对齐上限 |
| `design-docs/api-define/OpenAPI接口定义/00-common.md` | QuotaPlan `quota` 合法性条件 |
| `design-docs/sys-design/各模块实现细节设计/APIKey管理.md` | 已对齐 DECIMAL 上限 |
| `design-docs/sys-design/各模块实现细节设计/Entity管理.md` | 已对齐 DECIMAL 上限 |
| `design-docs/sys-design/各模块实现细节设计/模型服务商.md` | 模型列表支持手填 / 批量添加 |
| `design-docs/sys-design/各模块实现细节设计/AI业务集群.md` | 重定向联动、Keys 下拉过滤 |

原型已同步：`provider-upsert.js`（批量添加）、`cluster-upsert.js`（重定向联动 / Keys 过滤）、API Key / Entity 配额上限。

---

## 1. #93：配额总量上限对齐 DECIMAL(18,8)

### 需求

`quota_plans.quota` 列为 `DECIMAL(18,8)`，整数部分最多 10 位。`unit=total_token` 时配额为整数，前端曾按 int64 校验，超限值写入会触发数据库 `Out of range`。另：iView `Form.validate` 对嵌套 `quota_plan.quota` 可能漏跑。

### 实现

- 常量：`TOKEN_QUOTA_MAX = 9999999999`，`RMB_QUOTA_MAX = 90000000`（`src/utils/const.js`）。
- 创建/编辑与重置弹窗：`total_token` 的 InputNumber `:max` 与自定义校验均使用 `TOKEN_QUOTA_MAX`；RMB 仍 9000 万、最多 4 位小数。
- 提交：有限配额时先 `validateField('quota_plan.quota')`，再以 `isLimitedQuotaInvalid()` 兜底，拦截漏校验。
- OpenAPI `00-common.md` QuotaPlan：`unit=total_token` 取值范围 **0 ~ 9,999,999,999**。

### 验收

- [x] `total_token` 输入/注入超过 9,999,999,999 时拦截，提示「配额总量超出允许范围」
- [x] 边界值 9,999,999,999 可通过
- [x] RMB 上限仍为 90,000,000.00
- [x] API Key / Entity 的创建编辑与重置弹窗行为一致
- [x] 自动化：EM-K-28 / EM-E-24（创建超限）、EM-K-61 / EM-E-56（重置弹窗）

---

## 2. #92：集群「模型重定向」左右联动

### 需求

选择「转发的后端模型名称」后，若「原请求的模型名称」为空，自动填入同名；用户已填写则不覆盖，之后仍可改。

### 实现

`GatewayConfig.vue` → `changeMappingTarget(index, value)`：

- 始终写入 `target_model`。
- 仅当 `source_model` 为空（trim 后）且 `value` 有值时，写入同名 `source_model`。
- `$nextTick` 后 `validateField('model_mappings')`（原模型名不可重复等）。
- 左侧 Input 绑定 `v-model="model.source_model"`，保持可编辑。

### 验收

- [x] 左侧为空时选右侧，左侧带出同名
- [x] 左侧已有值时选右侧，不覆盖
- [x] 原模型名重复仍报错
- [x] 自动化：RM-BC-92

---

## 3. #91：模型服务商模型列表批量手写

### 需求

保留 Tag 多选与「获取」（覆盖回填）的同时，支持一次粘贴多个模型名并**合并**进现有列表（不去覆盖）。

### 实现

`ProviderUpsert.vue`：

- 「批量添加」打开 Modal（`class-name="batch-models-modal"`），textarea 粘贴。
- `parseModelNames`：按 `/[\s,，;；]+/` 切分、trim、`Set` 去重。
- `mergeModels`：只追加当前列表中不存在的名称；Toast「已添加 {count} 个模型」或「没有新增模型」；空输入警告「请输入至少一个模型名称」。
- 模型下拉 `@paste.native`：剪贴板拆出 **≥2** 个 token 时 `preventDefault` 并合并；单个 token 仍走原生输入/回车添加。
- 「获取」行为不变：覆盖回填，须点提交才持久化。

### i18n

| Key | 中文 |
| --- | --- |
| `provider.batchAddModels` | 批量添加 |
| `provider.batchModelsPlaceholder` | 每行一个模型名，也可用逗号、中文逗号、分号或空白分隔 |
| `provider.batchModelsAdded` | 已添加 {count} 个模型 |
| `provider.batchModelsNoNew` | 没有新增模型 |
| `provider.batchModelsEmpty` | 请输入至少一个模型名称 |
| `provider.modelsPlaceholder` | 点击「获取」拉取上游模型列表，输入模型名回车添加，或使用「批量添加」 |

### 验收

- [x] 批量添加合并去重，不覆盖已有项
- [x] 下拉粘贴多个名称时拆分合并
- [x] 「获取」仍覆盖回填
- [x] 自动化：PR-C-16

---

## 4. #90：集群 Keys 下拉过滤已选项

### 需求

同一 Key 不可选两次。已选名称从其他行的下拉中去掉，减少提交时才发现重复的成本。

### 实现

`GatewayConfig.vue` → `availableProviderKeys(index)`：

- 本行保留当前选中项（否则已选项会从本行下拉消失）。
- 其他行已选 `name` 从候选中过滤。
- 提交时 `keyNameDuplicate` 校验仍保留。

Keys 仍为非必填；空行不参与校验；有值的 `name` 须属于所选服务商；权重之和 = 100。

### 验收

- [x] 行 0 选 KEY_A1 后，行 1 下拉不再出现 KEY_A1
- [x] 本行仍能看到当前已选项
- [x] 提交重复校验仍生效
- [x] 自动化：RM-BC-76
