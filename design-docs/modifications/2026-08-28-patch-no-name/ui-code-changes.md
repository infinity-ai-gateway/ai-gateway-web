# UI 代码变更文档

> **前置**：[2026-08-27 Model Select](../2026-08-27-model-select/ui-code-changes.md)
> **对照接口**：`providers.md`、`clusters.md`（PATCH 请求体禁止传递 name）
> **状态**：**UI 代码已完成**（2026-08-28）

本文记录 2026-08-28 PATCH 接口请求体规范变更：Provider 与 Cluster 的更新接口不再允许在请求体中传递 `name` 字段。

---

## 1. 变更总览

| 页面 / 模块 | 变更要点 | 状态 |
| ----------- | -------- | ---- |
| 集群 · 更新 | PATCH 请求体移除 `name` 字段，name 通过 URL 路径传递 | ✅ UI 代码 |
| 服务商 · 更新 | 已有相同逻辑，无需改动 | ✅ 已有 |

---

## 2. 对照接口

### providers.md 变更

> **输入参数（Body）**
> 可修改字段含义同创建接口，但**输入参数不包括 `name`，即不能修改 provider 的 name**（名称由 URI 中的 `provider_name` 指定）。若请求体中仍包含 `name`，返回 422。

### clusters.md 变更

> **输入参数（Body）**
> 可修改字段含义同创建接口，但**输入参数不包括 `name`，即不能修改 cluster 的 name**（名称由 URI 中的 `cluster_name` 指定）。若请求体中仍包含 `name`，返回 422。

---

## 3. 变更前后对比

| 场景 | 变更前 | 变更后 |
| ---- | ------ | ------ |
| 集群更新 | PATCH 请求体包含 `name` 字段 | PATCH 请求体移除 `name`，通过 URL 路径传递 |
| 服务商更新 | PATCH 请求体不包含 `name`（已有正确实现） | 无变化 |

---

## 4. 涉及文件

- `src/modules/Clusters/components/index.vue`（`submit` 方法修复）
- `src/modules/Providers/components/ProviderUpsert.vue`（已有正确实现，无需改动）

---

## 5. 验收清单

- [x] 集群更新时 PATCH 请求体不包含 `name`
- [x] 集群更新时 name 通过 URL 路径传递（如 `/clusters/my-cluster`）
- [x] 服务商更新已有正确实现（无需改动）

---

## 6. 关联文档

| 文档 | 说明 |
| ---- | ---- |
| [2026-08-27 ui-code-changes](../2026-08-27-model-select/ui-code-changes.md) | Model Select 增强 |
| `api-define/OpenAPI接口定义/providers.md` | PATCH /providers/{provider_name} |
| `api-define/OpenAPI接口定义/clusters.md` | PATCH /clusters/{cluster_name} |
