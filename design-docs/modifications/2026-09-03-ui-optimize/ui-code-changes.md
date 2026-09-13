# UI 代码变更文档

> **前置**：[2026-09-02-ui-optimize](../2026-09-02-ui-optimize/ui-code-changes.md)  
> **对照接口**：无新 OpenAPI 端点；列表「查询模型价格」仍为前端路由跳转  
> **对照原型**：`prototype-design/pages/providers.html`、`model-prices.html`  
> **状态**：已完成  
> **关联用例**：PR-L-11 / PR-LINK-06 / MP-LINK-02

本文记录 2026-09-03 服务商列表「查询模型价格」交互调整：跳转后只按服务商筛选定价列表，不再自动打开详情；无匹配记录时仍提示「未找到提供商 {provider} 的模型定价」。

---

## 1. 变更总览

| 页面 / 模块 | 变更要点 | 状态 |
| ----------- | -------- | ---- |
| 服务商 · 列表 | 「查询模型价格」跳转 `ModelPrice.list?provider={name}`，去掉 `autoView=1` | ✅ |
| 模型定价 · 列表 | 按 Query `provider` 筛选；有记录不打开详情；无记录 Toast 提示 | ✅ |

无需改后端接口。

---

## 2. 变更前后对比

| 场景 | 变更前 | 变更后 |
| ---- | ------ | ------ |
| 有定价记录 | 跳转 `?provider={name}&autoView=1`，自动打开第一条定价详情 | 跳转 `?provider={name}`，提供商筛选选中该服务商，列表只展示对应记录，**不打开**详情 |
| 无定价记录 | 提示「未找到提供商 {provider} 的模型定价」，不打开详情 | 行为不变：同样提示，不打开详情 |

---

## 3. 实现

**服务商列表** `src/modules/Providers/index.vue` → `onViewModelPrices`：

```js
this.$router.push({
  name: 'ModelPrice.list',
  query: { provider: row.name }
});
```

**模型定价列表** `src/modules/ModelPrices/index.vue`：

- `applyQueryFromRoute` 设置 `filterProvider` / `searchParams.provider` 后拉取列表。
- 从服务商深链进入时置 `notifyEmptyAfterFetch`；列表为空则 `$Message.warning(modelPrices.noPricingForProvider)`。
- 删除 `autoView` / `handleAutoViewAfterFetch`，不再自动 `onView` 第一条。

---

## 4. 需修改文件

| 文件 | 说明 |
| ------ | ------ |
| `src/modules/Providers/index.vue` | 跳转 Query 仅 `provider` |
| `src/modules/ModelPrices/index.vue` | 按服务商筛选；无匹配提示；不自动打开详情 |
| `docs/zh-cn/04-model-provider.md` | § 查询模型价格 |
| `docs/zh-cn/06-model-prices.md` | 从服务商跳转说明 |
| `design-docs/prototype-design/pages/providers.html` | 跳转去掉 `autoView=1` |
| `design-docs/prototype-design/pages/model-prices.html` | 按 `provider` 筛选；无匹配 Toast；不自动打开详情 |
| `design-docs/sys-design/各模块实现细节设计/模型服务商.md` | 查询模型价格深链 |
| `design-docs/sys-design/各模块实现细节设计/模型定价.md` | 深链入口；无匹配提示 |
| `design-docs/sys-design/OpenAPI消费接口映射.md` | `ModelPrice.list?provider={name}` |

测试仓库（`ai-gateway-web-test`）同步：PR-L-11 / PR-LINK-06 / MP-LINK-02 文档与 `test_01_provider_list.spec.js`。

---

## 5. 文案

| Key | 中文 | 场景 |
| --- | ---- | ---- |
| `modelPrices.noPricingForProvider` | 未找到提供商 {provider} 的模型定价 | 从服务商跳转且无定价记录（沿用，未改文案） |

---

## 6. 验收清单

- [x] 有定价记录：跳转 URL 仅携带 `provider={name}`，列表按该服务商筛选，不打开详情
- [x] 无定价记录：提示「未找到提供商 {provider} 的模型定价」，不打开详情、不报错
- [x] 用户手册第 04 / 06 章与原型已同步
- [x] 自动化：PR-L-11（无记录提示 / 有记录筛选且不打开详情）
