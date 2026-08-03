# OpenAPI 接口定义变更核对（UI 视角）

> **对照基准**
>
> | 角色 | 路径 |
> |------|------|
> | 现行接口定义 | `design-docs/api-define/OpenAPI接口定义/` |
> | UI 当前实现 | `src/modules/Clusters/`（2026-07-31-ui-optimize 已落地项） |
> | API 侧变更说明 | `ai-gateway-api/design-docs/modifications/2026-07-31-api-define-modification-and-bugfix/change-summary.md` |
>
> **核对日期**：2026-08-01

---

## 1. 变更概述

相较 UI 当前提交的字段（`hostname`/`ip`/`ports`），OpenAPI 已将 `instance_pool` 元素重设计为 `name`/`addr`/`port`/`weight`。

| 变更点 | 类型 | UI 影响 |
|--------|------|---------|
| `instance_pool` 字段重命名与结构简化 | Breaking | 高 |
| `basic.protocol` 默认值 `https` | 默认值 | 中 |
| `passive_health_check.host` 空值语义 | 文档补充 | 低 |
| `/api-keys` `key` 长度 1-128 | 约束明确 | 无（UI 不传自定义 key） |

---

## 2. `instance_pool` 字段对照

### 2.1 结构对比

| UI 当前提交（2026-07-31 已落地） | OpenAPI 现行 | 说明 |
|----------------------------------|--------------|------|
| `hostname`（域名模式） | — | 删除；语义合并至 `addr` |
| `ip`（IP 模式） | `addr` | 必填；Hostname 类型（域名或 IP） |
| — | `name` | 新增；选填；1-128 字符；默认与 `addr` 相同 |
| `ports.Default` | `port` | map → 单一整数 |
| `weight` | `weight` | 不变；[0,100] |

**UI 当前域名模式提交示例**

```json
{ "hostname": "api.example.com", "ports": { "Default": 443 }, "weight": 100 }
```

**UI 当前 IP 模式提交示例**

```json
{ "ip": "10.0.0.1", "ports": { "Default": 8080 }, "weight": 50 }
```

**OpenAPI 期望（两种场景统一结构）**

```json
{ "addr": "api.example.com", "port": 443, "weight": 100 }
```

```json
{ "addr": "10.0.0.1", "port": 8080, "weight": 50, "name": "backend-1" }
```

### 2.2 合法性约束

| 约束 | UI 当前 | OpenAPI 现行 |
|------|---------|--------------|
| 地址字段 | 域名模式只传 `hostname`；IP 模式只传 `ip` | 始终传 `addr`（必填） |
| `name` | 无 | 选填；非空时集群内不可重复 |
| 唯一性 | IP 不可重复 | `(name, addr)` 不可重复 |
| 权重 | 至少一个 > 0；IP 模式总和 100 | 至少一个 `weight > 0` |
| 端口 | `ports.Default` | `port` 整数 |

### 2.3 响应字段

后端 Issue #37 已修复：GET/PATCH 响应 `instance_pool[]` 仅含 `name`/`addr`/`port`/`weight`（小写），不含 `Name`/`Addr`/`Ports`/`Disable`。

UI 若仍有 PascalCase 回退逻辑，可在字段迁移完成后移除。

---

## 3. 其他 `/clusters` 变更

### 3.1 `basic.protocol`

| 项目 | UI 当前 | OpenAPI 现行 |
|------|---------|--------------|
| 新建默认值 | `http`（`index.vue` `BASIC_DEFAULTS`、`BaseConfig.vue`） | `https` |

### 3.2 `passive_health_check.host`

| 项目 | OpenAPI 现行 |
|------|--------------|
| 为空时 | 使用 `instance_pool` 首个实例的 `addr` |
| UI 当前 | 允许为空，提交 `""`；行为兼容 |

---

## 4. 不受影响项（2026-07-31-ui-optimize 已完成）

以下已在上一轮落地，**本次不重复变更**：

- `llm_config.model_mappings` → `source_model`/`target_model`
- `llm_config` 删除 `service_name`/`group`/`enable`
- `sticky_sessions` 删除 `session_sticky_type`、新增 `enabled`
- `basic.retries.max_retry_in_cluster`
- 公共类型校验（UserName、Password、ClusterName 等）

---

## 5. 参考

| 文档 | 路径 |
|------|------|
| clusters 接口定义 | `design-docs/api-define/OpenAPI接口定义/clusters.md` |
| API 变更总结 | `ai-gateway-api/design-docs/modifications/2026-07-31-api-define-modification-and-bugfix/change-summary.md` |
| 原型对比 | [prototype-ui-compare.md](./prototype-ui-compare.md) |
| UI 执行清单 | [ui-code-changes.md](./ui-code-changes.md) |
