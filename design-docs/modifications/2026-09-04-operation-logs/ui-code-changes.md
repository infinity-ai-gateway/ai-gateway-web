# UI 代码变更文档

> **对照接口**：`operation-logs.md`（`resource_type` 枚举已移除 `domain` / `rate_limit_policy`）  
> **前置**：[2026-09-01-operation-logs](../2026-09-01-operation-logs/ui-code-changes.md)  
> **状态**：已完成  
> **关联 Issue**：[#97](https://github.com/rainway-ai-gateway/ai-gateway-web/issues/97)、[ai-gateway-api#125](https://github.com/rainway-ai-gateway/ai-gateway-api/issues/125)

操作日志「资源类型」筛选下拉与 OpenAPI 枚举对齐：移除控制台不再作为独立资源的 `domain`、`rate_limit_policy`。

无需改后端查询接口。`quota_plan` 仍保留。

---

## 变更总览

| Issue | 页面 / 模块 | 变更要点 |
|------|-------------|----------|
| #97 | 操作日志 · 列表 | 资源类型下拉去掉 `domain`、`rate_limit_policy` |

## 需修改文件

| 文件 | 说明 |
| ------ | ------ |
| `src/modules/OperationLogs/index.vue` | `RESOURCE_TYPE_OPTIONS` 移除两项 |
| `design-docs/api-define/OpenAPI接口定义/operation-logs.md` | `resource_type` 枚举与写入列表对齐 API |
| `docs/zh-cn/12-operation-logs.md` | §12.3 日志来源去掉域名、限流策略 |
| `design-docs/prototype-design/assets/js/mock-data.js` | 原型筛选选项与示例日志 |

自动化：`ai-gateway-web-test` 的 OL-L-05 断言下拉选项与上述枚举一致，且不含 `domain` / `rate_limit_policy`。

## 对齐后的资源类型

`entity` / `entity_type` / `api_key` / `provider` / `cluster` / `route` / `certificate` / `quota_plan` / `model_price` / `user` / `token`

## 验收

- [x] 操作日志资源类型下拉不再出现 `domain`、`rate_limit_policy`
- [x] 其余资源类型仍可选；选 `entity` 仍带 `resource_type=entity` 查询
- [x] 用户文档 / OpenAPI / 原型选项一致
- [x] 自动化：OL-L-05
