# UI 代码变更文档

> **对照**：接口定义 `design-docs/api-define/OpenAPI接口定义/`
> **接口变更日期**：2026-08-16
> **状态**：已完成

---

## 1. 变更优先级总览

| 优先级 | 变更点 | 影响模块 | 状态 | 备注 |
| ------ | ------ | -------- | ---- | ---- |
| P0 | RouteRule 字段命名规范改为 snake_case | 路由表 · 规则表单/查看/管理 | **已完成** | `Cond`/`ClusterName`/`Model`/`Weight` 改为 `cond`/`cluster_name`/`model`/`weight` |
| P0 | Cluster LLM 新增 `match_prefix` / `strip_prefix` 字段 | 集群 · 大模型配置/复查 | **已完成** | 用于 OpenRouter 等聚合 provider 场景；`match_prefix` 默认隐藏，开启 `strip_prefix` 后显示且必填 |
| P0 | RMB 配额上限 9000 万元 | API-Key / Entity · 创建/编辑/查看 | **已完成** | `unit=RMB` 时 quota 取值范围 0 ~ 90,000,000.00 |
| P1 | model-prices 时间字段名对齐为 `create_time` / `update_time` | 模型定价 · 详情/列表 | **已对齐** | 代码已使用 `create_time`/`update_time` |

---

## 2. P0：RouteRule 字段命名规范改为 snake_case

### 2.1 需求

接口定义 `00-common.md` 新增字段命名规范：OpenAPI 请求/响应字段统一使用 `snake_case`，禁止大写开头或驼峰命名。当前 `RouteRule` 及相关类型中的字段已从大驼峰改为小写下划线：

| 旧字段名 | 新字段名 |
| -------- | -------- |
| `Cond` | `cond` |
| `ClusterName` | `cluster_name` |
| `Model` | `model` |
| `Weight` | `weight` |

已将前端代码中的字段名统一改为 snake_case，与接口定义保持一致。

**接口参考**：`00-common.md` §6 路由规则（RouteRule）

```json
{
  "name": "apikey-default",
  "cond": "default_t()",
  "targets": [
    { "cluster_name": "cluster_apikey", "model": "", "weight": 100 }
  ],
  "fallbacks": []
}
```

### 2.2 接口校验规则

| 字段 | 校验规则 |
| -------- | -------- |
| `cond` | 必填、非空；须为合法 BFE 条件表达式 |
| `cluster_name` | 必填；须为 `/clusters` 中已存在的集群名称 |
| `model` | 非空时，须为对应集群 `llm_config.models` 中已配置的模型名称；空字符串表示透传原始模型 |
| `weight` | 取值范围 `[0,100]`；同一规则内所有 `weight` 之和必须等于 `100` |

**跨元素约束**：同一 `targets` / `fallbacks` 数组内，`(cluster_name, model)` 组合不能重复；且 `targets` 与 `fallbacks` 之间也不能重复。

### 2.3 实现

**影响文件**：

- `src/modules/RouteTable/components/RuleForm.vue`
- `src/modules/RouteTable/components/RuleView.vue`
- `src/modules/RouteTable/components/RouteRules.vue`
- `src/modules/RouteTable/index.vue`
- `src/modules/APIKey/components/ApiKeyView.vue`（若展示 route_rules）
- `src/modules/Entity/components/EntityView.vue`（若展示 route_rules）

**具体修改**：

1. **RuleForm.vue**
   - 表单数据结构 `formData.targets` / `formData.fallbacks` 字段名从 `ClusterName`/`Model`/`Weight` 改为 `cluster_name`/`model`/`weight`
   - 校验规则 `prop` 路径同步调整（如 `targets.${index}.cluster_name`）
   - 重复校验逻辑中的 key 构建从 `${ClusterName}|${Model}` 改为 `${cluster_name}|${model}`
   - 模板中 v-model 绑定和展示字段同步调整

2. **RuleView.vue**
   - 展示字段从 `rule.targets[].ClusterName` / `Model` 改为 `cluster_name` / `model`
   - fallback 展示同理

3. **RouteRules.vue**
   - `buildPayload` 中字段名转换同步调整
   - 默认初始化行 `{ cluster_name: '', model: '', weight: 100 }`

4. **RouteTable/index.vue**
   - 与后端交互的字段名同步调整

5. **API-Key / Entity 查看页**
   - 若展示 `route_rules`，展示字段从 `Cond` / `ClusterName` / `Model` / `Weight` 改为 `cond` / `cluster_name` / `model` / `weight`

---

## 3. P0：Cluster LLM 新增 `match_prefix` / `strip_prefix` 字段

### 3.1 需求

接口定义 `clusters.md` 在 `llm_config` 中新增两个字段：

- `match_prefix`：string，需要匹配的 provider/model 前缀，例如 `openrouter/`，必须以 `/` 结尾
- `strip_prefix`：bool，是否裁剪 `match_prefix` 指定前缀，默认 `false`

用于 OpenRouter 等聚合 provider 场景。

**接口参考**：`clusters.md` §1 数据模型

```json
{
  "llm_config": {
    "provider_type": "deepseek",
    "provider": "deepseek",
    "match_prefix": "deepseek/",
    "strip_prefix": true
  }
}
```

### 3.2 接口校验规则

| 字段 | 校验规则 |
| -------- | -------- |
| `match_prefix` | 非必填；若 `strip_prefix=true` 则必填且非空；若传入，必须以 `/` 结尾 |
| `strip_prefix` | 非必填；默认 `false`；bool |

### 3.3 实现

**影响文件**：

- `src/modules/Clusters/components/GatewayConfig.vue`
- `src/modules/Clusters/components/Review.vue`（可选，展示字段）

**具体修改**：

1. **GatewayConfig.vue**
   - 在「模型服务配置」Card 内，`provider` 输入框下方新增 `strip_prefix` 开关
   - 在 `strip_prefix` 开关下方新增 `match_prefix` 输入框，默认隐藏（`v-if="formData.strip_prefix"`）
   - 文案区分：
     - `match_prefix`：「模型前缀匹配」
     - `strip_prefix`：「裁剪前缀」
   - 表单初始值增加 `match_prefix: ''` 和 `strip_prefix: false`
   - 校验规则：
     - `strip_prefix=true` 时，`match_prefix` 必填且非空
     - `match_prefix` 若填写，必须以 `/` 结尾
   - 当 `strip_prefix` 从开启切换到关闭时，自动清空 `match_prefix`
   - 提交时携带 `match_prefix` 和 `strip_prefix` 字段；若为空则删除字段
   - 编辑回显时读取这两个字段

2. **Review.vue**（建议展示）
   - 在 LLM 配置详情区新增 `match_prefix` / `strip_prefix` 展示项

---

## 4. P0：RMB 配额上限 9000 万元

### 4.1 需求

接口定义 `00-common.md`、`api-keys.md`、`entities.md` 中，`quota_plan.quota` 在 `unit=RMB` 时新增取值范围上限：

- 取值范围：0 ~ 90,000,000.00（9000 万元）
- 内部最多保留 8 位小数，对外统一按 4 位小数展示

已将 RMB 模式下 quota 输入框 `max` 改为 `90000000`，并增加超出上限校验。

**接口参考**：`00-common.md` §8 配额计划（QuotaPlan）

### 4.2 接口校验规则

| 字段 | 校验规则 |
| -------- | -------- |
| `quota` | 非负数；`unit=total_token` 时必须为整数；`unit=RMB` 时取值范围 0 ~ 90,000,000.00，内部最多保留 8 位小数，对外统一按 4 位小数展示 |

### 4.3 实现

**影响文件**：

- `src/modules/APIKey/components/Upsert.vue`
- `src/modules/APIKey/components/ApiKeyView.vue`
- `src/modules/Entity/components/EntityUpsert.vue`
- `src/modules/Entity/components/EntityView.vue`

**具体修改**：

1. **Upsert.vue / EntityUpsert.vue**
   - `quota` 输入框在 `unit=RMB` 时 `max` 从 `INT64_MAX` 改为 `90000000`
   - 校验提示中增加 RMB 上限说明（可复用 i18n 文案）

2. **ApiKeyView.vue / EntityView.vue**
   - 重置配额弹窗中，`unit=RMB` 时 `newQuota` 的 `max` 同样改为 `90000000`

---

## 5. P1：model-prices 时间字段名对齐

### 5.1 需求

接口定义 `model-prices.md` 中时间字段从 `created_at` / `updated_at` 改为 `create_time` / `update_time`。

当前前端代码 `ModelPriceView.vue` 和 `ModelPriceUpsert.vue` 已使用 `create_time` / `update_time`，代码已对齐。

### 5.2 实现

**影响文件**：

- `design-docs/modifications/2026-08-14-ui-optimize/ui-code-changes.md`

**具体修改**：

- 第 6.1 节和 9.5 节中关于时间字段的描述从 `created_at` / `updated_at` 改为 `create_time` / `update_time`

---

## 6. 实现差异与待修复清单

| 模块 | 问题 | 影响 | 建议修复 |
| -------- | -------- | -------- | -------- |
| 文档 | model-prices 时间字段描述仍为旧字段名 | 文档与代码不一致 | 按 5.2 节更新旧文档描述 |

---

## 7. 测试计划

### 7.1 RouteRule 字段命名

- [x] 路由规则表单：提交时请求体字段为 `cond`/`cluster_name`/`model`/`weight`
- [x] 路由规则表单：重复校验使用 `(cluster_name, model)` 组合
- [x] 路由规则详情页：展示 `cluster_name` / `model`
- [x] 编辑回显：正确读取 `cond`/`cluster_name`/`model`/`weight`
- [x] 全局/entity/api_key 路由规则提交字段名一致

### 7.2 Cluster match_prefix / strip_prefix

- [x] GatewayConfig：表单新增 `match_prefix` 输入框和 `strip_prefix` 开关
- [x] `match_prefix` 默认隐藏，开启 `strip_prefix` 后显示
- [x] `strip_prefix=true` 时，`match_prefix` 必填校验生效
- [x] `match_prefix` 填写时以 `/` 结尾校验生效
- [x] 提交时请求体包含 `match_prefix` 和 `strip_prefix`
- [x] 编辑回显：正确填充 `match_prefix` 和 `strip_prefix`
- [ ] Review 页：展示 `match_prefix` 和 `strip_prefix`（未实现）

### 7.3 RMB 配额上限

- [x] API-Key / Entity 创建/编辑表单：`unit=RMB` 时 quota 最大可输入 90,000,000.00
- [x] 超出 9000 万元时校验提示
- [x] 重置配额弹窗：`unit=RMB` 时同样限制 9000 万元

### 7.4 model-prices 时间字段

- [x] 详情页读取 `create_time` / `update_time`
- [x] 列表页读取 `create_time` / `update_time`

---

## 8. 参考文档

| 文档 | 路径 |
| -------- | -------- |
| 公共类型定义 | `design-docs/api-define/OpenAPI接口定义/00-common.md` |
| API-Key 接口 | `design-docs/api-define/OpenAPI接口定义/api-keys.md` |
| Entity 接口 | `design-docs/api-define/OpenAPI接口定义/entities.md` |
| Cluster 接口 | `design-docs/api-define/OpenAPI接口定义/clusters.md` |
| 模型定价接口 | `design-docs/api-define/OpenAPI接口定义/model-prices.md` |
| 全局路由规则 | `design-docs/api-define/OpenAPI接口定义/global-route-rules.md` |
| 上一轮已完成 | `design-docs/modifications/2026-08-14-ui-optimize/ui-code-changes.md` |
