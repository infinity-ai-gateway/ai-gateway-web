# UI 代码变更文档

> **前置**：[2026-08-25 Provider/Cluster 优化](../2026-08-25-ui-optimize/ui-code-changes.md)  
> **对照接口**：`clusters.md`（`llm_config.key_affinity`）、`providers.md`（GET 详情返回补全）  
> **对照原型**：`prototype-design/`（`cluster-upsert.js` 大模型配置「Key 亲和性」卡片 + 复查展示）  
> **状态**：**原型已 Review 通过**（2026-08-26）· UI 代码实现中

本文记录 2026-08-26 集群大模型配置新增 **Key 亲和性（`key_affinity`）** 的 UI 与交互变更：接口新增 `llm_config.key_affinity` 配置段，UI 在「大模型配置」新增独立卡片并在复查步骤展示。

---

## 1. 变更总览

| 页面 / 模块 | 变更要点 | 状态 |
| ----------- | -------- | ---- |
| 集群 · 大模型配置 | 新增 **「Key 亲和性」** Card（启用开关 + 条件展示 ttl / Redis 前缀 / Key 惩罚） | ✅ 原型 / UI 代码 |
| 集群 · 复查 | 新增 **Key 亲和性** 展示（启用状态 + 启用时明细） | ✅ 原型 / UI 代码 |
| 集群 · 提交 | `llm_config` 透传 `key_affinity`（布尔/数值规范化） | UI 代码 |
| i18n | 新增 `gatewayConfig.keyAffinity*` 中英文案 | UI 代码 |

---

## 2. 对照接口

**`clusters.md` 新增 `llm_config.key_affinity`（Key 亲和性配置）**

| 参数名 | 类型 | 参数含义 | 必填 | 补充描述 | 合法性条件 |
| - | - | - | - | - | - |
| enabled | bool | 是否开启会话级 Key 亲和性 | N | 默认 `false`；为 `true` 时开启基于 Redis + `ClientKeyId` 的 Key 绑定 | 非必填；必须为 bool |
| ttl | int | 绑定空闲超时时间 | N | 单位秒，默认 `600`；命中绑定后 BFE 会刷新 TTL，持续请求则绑定保持 | 非必填；若传入，须为 `>0` 的整数 |
| redis_prefix | string | Redis key 前缀 | N | 默认 `"bfe:ai:key_affinity"` | 非必填；若传入，必须非空 |
| penalty_enable | bool | 是否开启 Key 惩罚 | N | 默认 `true`；为 `true` 时，近期返回 429/401/403 的 Key 会被跳过 | 非必填；必须为 bool |

**`providers.md` 变更**：`GET /providers/{provider_name}` 返回数据补全 `time_zone`（默认 `Asia/Shanghai`）与 `tiers` 说明。该字段在 2026-08-25 分段计价已实现，本次仅文档补全，无 UI 改动。

---

## 3. 集群 · 大模型配置：「Key 亲和性」卡片

**对照接口**：`clusters.md` 表：Key 亲和性配置  
**对照原型**：`cluster-upsert.js`（`renderLlmConfigHtml` 新增 `keyAffinityHtml` 卡片；`syncFromDom` 支持 `key_affinity.*` 字段）

### 3.1 变更前后对比

| 区域 | 变更前（Vue） | 变更后 |
| ---- | ------------- | ------ |
| 大模型配置 | 仅「服务鉴权 Keys」+「Key 路由策略」两张卡片 | 其后新增 **「Key 亲和性」** 卡片 |
| 启用 | 无 | `Select`（关闭/开启），label 带 `?` Tooltip「开启后，同一会话的请求将绑定到同一 Key，避免会话内切换时 Key 漂移」 |
| 条件字段 | 无 | `enabled=true` 时展示：**绑定空闲超时(秒)**（InputNumber，min 1，默认 600）、**Key 惩罚**（Select 关闭/开启，默认开启，label 带 `?` Tooltip「开启后，失败的 Key 会被临时惩罚，降低再次被选中概率」）、**Redis Key 前缀**（Input，默认 `bfe:ai:key_affinity`） |
| 默认值 | 无 | `{ enabled: false, ttl: 600, redis_prefix: 'bfe:ai:key_affinity', penalty_enable: true }` |
| 提交 | 无 | `tmpData.key_affinity` 规范化：布尔转 bool、ttl 转 Number，随 `llm_config` 提交 |

### 3.2 校验规则

- `ttl`：`enabled=true` 时须为 `>0` 的整数（FormItem 级提示）。
- `redis_prefix`：`enabled=true` 时非空。
- `enabled` / `penalty_enable`：Select 二选一，无自由输入。

### 3.3 涉及文件

- `src/modules/Clusters/components/GatewayConfig.vue`
- `src/modules/Clusters/components/Review.vue`（复查展示，见 §4）
- `src/modules/Clusters/components/index.vue`（`formatLlmConfigForApi` 透传）
- `src/i18n/zh.js`、`src/i18n/en.js`
- 原型：`prototype-design/assets/js/cluster-upsert.js`、`prototype-design/assets/css/prototype-overrides.css`（switch/表单宽度修复，**已完成**）

### 3.4 验收清单

- [ ] 大模型配置页出现「Key 亲和性」卡片；默认「关闭」，不显示条件字段
- [ ] 切到「开启」后显示 ttl / Key 惩罚 / Redis Key 前缀；均带默认值
- [ ] `enabled=true` 时 ttl 为空或 ≤0、Redis 前缀为空 → 校验拦截
- [ ] 提交 `llm_config` 含 `key_affinity`（bool + number）

---

## 4. 集群 · 复查：Key 亲和性展示

**对照原型**：`cluster-upsert.js`（`renderReviewHtml` 新增 `keyAffinityHtml`）

| 区域 | 变更前 | 变更后 |
| ---- | ------ | ------ |
| 大模型配置复查 | 无 Key 亲和性 | 「Key 路由策略」行后新增 **Key 亲和性** 行：启用（开启/关闭）；开启时展示绑定空闲超时(秒)、Redis Key 前缀、Key 惩罚 |

**涉及文件**：`src/modules/Clusters/components/Review.vue`（新增 `displayKeyAffinity` computed + 模板行）

### 验收清单

- [ ] 复查页展示 Key 亲和性；未启用显示「关闭」
- [ ] 启用后展示 ttl / redis_prefix / penalty 明细

---

## 5. 关联文档

| 文档 | 说明 |
| ---- | ---- |
| [2026-08-25 ui-code-changes](../2026-08-25-ui-optimize/ui-code-changes.md) | Provider/Cluster 主体（Part III Keys 可选） |
| `api-define/OpenAPI接口定义/clusters.md` | `llm_config.key_affinity` |
| `api-define/OpenAPI接口定义/providers.md` | GET 详情返回 `time_zone` / `tiers` 补全 |
| `prototype-design/assets/js/cluster-upsert.js` | Key 亲和性卡片 + 复查原型 |
