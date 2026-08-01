# 公共参数类型与 UI 校验对齐清单

> 对照文档：`design-docs/api-define/OpenAPI接口定义/00-common.md`  
> 核对范围：`ai-gateway-web/src/`  
> 核对日期：2026-07-31

## 总体结论

16 类公共参数类型中，**3 类已基本对齐**（IP Address、Port、CIDR），**5 类大体可用但存在局部缺口**（AIModel、QuotaPlan、RouteRules、TPMConfig、RPMConfig），**8 类需要重点对齐**（Hostname、RouteRule、RateLimitPolicy、UserName、Password、TokenName、ClusterName、EntityTypeName）。

| 对齐状态 | 类型 |
|---------|------|
| 已对齐 | IP Address、Port、CIDR |
| 部分对齐 | Hostname、AIModel、QuotaPlan、RouteRules、TPMConfig、RPMConfig、RateLimitPolicy |
| 需对齐 | RouteRule、UserName、Password、TokenName、ClusterName、EntityTypeName |

**共性问题**：校验逻辑分散在各 Vue 组件内，缺少统一的 `utils/commonTypes.js`（或类似）公共校验模块；命名类（UserName、TokenName、ClusterName、EntityTypeName）规则与 OpenAPI 定义差异较大。

**建议路径**：先在 `src/utils/` 抽取 16 类公共校验函数，再逐模块替换内联 validator，并同步更新 i18n 提示文案。

---

## 逐类型核对

### 1. Hostname

- **新版定义**：RFC 1123 主机名或有效 IPv4/IPv6；总长 ≤255；每标签 ≤63；标签仅字母/数字/`-`；标签不得以 `-` 开头或结尾；**长度 ≥2**。
- **UI 使用位置**：

| 文件 | 字段/场景 |
|------|----------|
| `src/modules/Clusters/components/InstancePool.vue` | 域名模式 `domainName`；IP 模式自动写入 `hostname` |
| `src/modules/AIInstancePool/index.vue` | 实例池展示/编辑（复用 InstancePool 逻辑） |
| `src/modules/Clusters/components/GatewayConfig.vue` | 间接引用实例 IP（非 Hostname 类型字段） |

- **当前 UI 校验**：

| 场景 | 实现 | 说明 |
|------|------|------|
| 域名模式 | `getDomainValidationError()` + `validator.isFQDN(require_tld: true)` | 拒绝纯 IP、纯数字、无 TLD 域名 |
| IP 模式 | `hostname = ip`（`applyHostnameFromIp`） | 主机名由 IP 派生，IPv4/IPv6 校验走 IP Address 规则 |

- **是否需要对齐**：**是**（域名模式）

- **具体修改建议**：

| 缺口 | 修改文件 | 建议 |
|------|----------|------|
| 未校验总长 ≤255、标签 ≤63 | `InstancePool.vue` 或新建 `utils/commonTypes.js` | 新增 `validateHostname()`，按 `.` 拆分标签逐项校验 |
| 未校验标签 `-` 开头/结尾 | 同上 | 正则：`/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/` 逐标签 |
| 未显式校验长度 ≥2 | 同上 | 域名/IP 均 `trim().length >= 2` |
| 域名模式不接受 IP 作为 Hostname | `InstancePool.vue` | 产品层面可保留「域名/IP 分模式」UI，但 API 提交前须保证 `Name`/`hostname` 符合 Hostname 类型 |
| 校验函数未复用 | `src/utils/const.js` | 导出 `isHostname()` 供 InstancePool 等调用 |

---

### 2. IP Address

- **新版定义**：RFC 791 IPv4 点分四段 0–255；RFC 8200 IPv6 八组十六进制，支持 `::` 压缩。
- **UI 使用位置**：

| 文件 | 字段 |
|------|------|
| `src/modules/Clusters/components/InstancePool.vue` | `instances[].ip` |
| `src/modules/AIInstancePool/index.vue` | 实例 IP |
| `src/utils/const.js` | `isIpv4Address()`、`expandIpv6()`（CIDR 辅助） |

- **当前 UI 校验**：`validateInstanceIp()` 使用 `validator.isIP(value, 4)` / `isIP(value, 6)`；非空、格式、IP:Port 重复检查。

- **是否需要对齐**：**否**

- **具体修改建议**：**已对齐**。`utils/const.js` 中 `isIpv4Address` 与 `validator.isIP` 逻辑一致，IPv6 支持压缩格式。后续可统一引用 `isIpv4Address`/`isIpv6Address` 以减少依赖分散。

---

### 3. Port

- **新版定义**：整数，取值 1–65535。
- **UI 使用位置**：

| 文件 | 字段 |
|------|------|
| `src/modules/Clusters/components/InstancePool.vue` | `instances[].ports.Default`（InputNumber `:min="1"` `:max="65535"`） |
| `src/modules/AIInstancePool/index.vue` | 同上 |

- **当前 UI 校验**：`validateInstancePort()` 检查 `value < 1 || value > 65535`；模板层 InputNumber 限界。

- **是否需要对齐**：**否**

- **具体修改建议**：**已对齐**。

---

### 4. CIDR

- **新版定义**：有效 IPv4/IPv6 CIDR，或特殊值 `"*"`；IPv4 前缀 0–32，IPv6 前缀 0–128。
- **UI 使用位置**：

| 文件 | 字段 |
|------|------|
| `src/modules/APIKey/components/Upsert.vue` | `subnet`（多行 CIDR 输入） |
| `src/utils/const.js` | `isCidr()`、`isIpv4Cidr()`、`isIpv6Cidr()`、`isCidrEqual()`、`isCidrContained()` |

- **当前 UI 校验**：`validateSubnet()` 覆盖：非空、`*` 互斥、格式、重复、包含关系。

- **是否需要对齐**：**否**

- **具体修改建议**：**已对齐**，且超出基础格式要求（含网段冲突检测）。可将 `validateSubnet` 逻辑抽到公共模块供其他模块复用。

---

### 5. AIModel

- **新版定义**：字符串或 `"*"`；非 `"*"` 时须为某集群 `llm_config.models` 中已配置的模型名。
- **UI 使用位置**：

| 文件 | 字段 |
|------|------|
| `src/modules/APIKey/components/Upsert.vue` | `models` |
| `src/modules/Entity/components/EntityUpsert.vue` | `allow_models`、`block_models` |
| `src/modules/Entity/components/EntityUpsert.vue` | TPM/RPM 规则 `model` |
| `src/modules/APIKey/components/Upsert.vue` | TPM/RPM 规则 `model` |
| `src/modules/RouteTable/components/RuleForm.vue` | `targets[].Model`、`fallbacks[].Model` |
| `src/modules/Clusters/components/GatewayConfig.vue` | `models`（Tag 输入，非严格 AIModel 下拉） |

- **当前 UI 校验**：

| 场景 | 实现 |
|------|------|
| APIKey / Entity 模型选择 | 下拉/多选，数据源来自 `fetchModelServices()`；`*` 与其他模型互斥 |
| TPM/RPM `model` | `el-select` + `modelGroups`，默认 `"*"` |
| 路由规则 `Model` | 按集群过滤的下拉，允许空字符串（透传） |
| GatewayConfig `models` | 必填 Tag，无格式/存在性校验 |

- **是否需要对齐**：**部分**（GatewayConfig 自由输入场景）

- **具体修改建议**：

| 缺口 | 修改文件 | 建议 |
|------|----------|------|
| GatewayConfig 模型名自由输入 | `GatewayConfig.vue` | 改为从已知模型列表选择，或 blur 时校验模型名存在于 `modelsList` |
| 路由规则 Model 未校验存在性（非空时） | `RuleForm.vue` | 选集群后 Model 非空须在 `getModelsByCluster()` 返回列表内（下拉已基本保证） |
| 缺少统一 AIModel validator | `utils/commonTypes.js` | `validateAIModel(value, knownModels)`，供 TPM/RPM/APIKey 共用 |

---

### 6. RouteRule

- **新版定义**：`name` 必填非空、组内唯一；`Cond` 必填合法 BFE 表达式；`targets` ≥1；`targets[].ClusterName` 为 ClusterName 且集群存在；`Model` 非空时须为对应集群已配置模型；`Weight` ∈[0,100] 且同规则内权重和=100；`targets` 内 `(ClusterName, Model)` 不重复；`fallbacks` 结构类似。
- **UI 使用位置**：

| 文件 | 说明 |
|------|------|
| `src/modules/RouteTable/components/RuleForm.vue` | 单条规则编辑表单 |
| `src/modules/RouteTable/components/RouteRules.vue` | 规则列表增删改 |
| `src/modules/RouteTable/components/RuleView.vue` | 只读展示 |

- **当前 UI 校验**：

| 约束 | 当前实现 | 是否满足 |
|------|----------|----------|
| `name` 必填 | `ruleValidate.name` required | ✅ |
| `name` 组内唯一 | 无 | ❌ |
| `Cond` 必填 + BFE 合法 | Expression 组件 + `validateCond` | ✅ |
| `targets` ≥1 | `handleSubmit` 检查 | ✅ |
| `ClusterName` 存在 | 下拉选集群列表 | ✅ |
| `Weight` 0–100 | `targetWeightRules` | ✅ |
| 权重和=100 | `validateWeight()` | ✅ |
| `(ClusterName, Model)` 不重复 | `validateDuplicate()` 仅检查 **ClusterName** 重复 | ❌ 过严且逻辑错误 |
| 同集群不同 Model | `getClusters()` 禁止重复选集群 | ❌ 与规范冲突（规范允许同集群不同 Model） |
| `fallbacks` ClusterName 重复 | `validateDuplicate()` 禁止 fallback 集群名重复 | ⚠️ 规范未禁止 |

- **是否需要对齐**：**是**

- **具体修改建议**：

| 修改文件 | 内容 |
|----------|------|
| `RuleForm.vue` | `validateDuplicate()` 改为检查 `(ClusterName, Model)` 元组重复（空 Model 视为 `""`） |
| `RuleForm.vue` | 移除 `getClusters()` 中对已选 ClusterName 的过滤，允许同集群多目标 |
| `RuleForm.vue` | `getModelsByCluster()` 中按 `(cluster, model)` 去重，而非仅 model |
| `RouteRules.vue` | `onRuleFormSubmit` / `submitRules` 前校验 `rules[].name` 组内唯一 |
| `i18n/zh.js`、`i18n/en.js` | 更新 `route.targetClusterDuplicate` 等文案，区分「集群重复」与「目标组合重复」 |

---

### 7. RouteRules

- **新版定义**：`enabled` 默认 false；`rules` 为 RouteRule 数组，可为空。
- **UI 使用位置**：

| 文件 | 说明 |
|------|------|
| `src/modules/RouteTable/components/RouteRules.vue` | 全局/Entity/APIKey 路由规则管理 |
| `src/modules/RouteTable/index.vue` | 路由表入口 |

- **当前 UI 校验**：开关 `enabled`；规则通过 `RuleForm` 逐条校验；提交时无容器级额外校验；允许 `rules` 为空数组。

- **是否需要对齐**：**部分**（依赖 RouteRule 子项修复）

- **具体修改建议**：

| 缺口 | 修改文件 | 建议 |
|------|----------|------|
| 提交前未汇总校验所有 rules | `RouteRules.vue` | `submitRules()` 前遍历 rules 调用公共 `validateRouteRule()` |
| `enabled=true` 且 rules 为空 | 规范允许 | ✅ 无需改 |
| 规则 name 跨条唯一 | `RouteRules.vue` | 见 RouteRule 建议 |

---

### 8. QuotaPlan

- **新版定义**：`unlimited` 默认 true；`pass_when_no_enough_quota` 默认 false；`quota` ≥0；`unit` 仅 `total_token`；`reset_period` ∈{`never`,`weekly`,`monthly`}；`balance` 只读。
- **UI 使用位置**：

| 文件 | 字段 |
|------|------|
| `src/modules/APIKey/components/Upsert.vue` | `quota_plan.*` |
| `src/modules/Entity/components/EntityUpsert.vue` | `quota_plan.*` |
| `src/modules/APIKey/components/ApiKeyView.vue` | 只读展示 |
| `src/modules/Entity/components/EntityView.vue` | 只读展示 |

- **当前 UI 校验**：

| 字段 | 实现 |
|------|------|
| `quota` | `validateQuota()`：limited 时必填、整数、≥0、≤ INT64_MAX |
| `unit` | 固定 `total_token`，不可改 |
| `reset_period` | Select 三选项 |
| `balance` | 不提交 |

- **是否需要对齐**：**否**（基本满足）

- **具体修改建议**：**已基本对齐**。可选优化：`pass_when_no_enough_quota` 增加显式 UI 开关（若产品需要）；抽取 `validateQuotaPlan()` 到公共模块。

---

### 9. RateLimitPolicy

- **新版定义**：`enabled` 默认 false；`enabled=true` 时 `rules` 必填且 tpm/rpm/max_concurrency(≥0) 至少配一项；tpm/rpm 各最多 3 条；TPM/RPM 组合字段不可重复；`max_concurrency` 为 -1 表示不限或 ≥0。
- **UI 使用位置**：

| 文件 | 说明 |
|------|------|
| `src/modules/APIKey/components/Upsert.vue` | APIKey 限流配置 |
| `src/modules/Entity/components/EntityUpsert.vue` | Entity 限流配置 |

- **当前 UI 校验**：

| 约束 | 实现 | 是否满足 |
|------|------|----------|
| enabled 时至少一项 | `validateRateLimitPolicy()` | ✅（「不限制并发」不算有效项，与 i18n 说明一致） |
| tpm/rpm 最多 3 条 | 添加按钮 `length >= 3` 禁用 | ✅ |
| max_concurrency -1/0/正整数 | 三模式：unlimited→-1、banned→0、limited→>0 | ✅ |
| TPM 组合不重复 | 无 | ❌ |
| RPM 组合不重复 | 无 | ❌ |
| enabled=false 时仍校验子字段 | 各 validator 首行判断 enabled | ✅ |

- **是否需要对齐**：**是**

- **具体修改建议**：

| 修改文件 | 内容 |
|----------|------|
| `Upsert.vue`、`EntityUpsert.vue` | 新增 `validateTpmDuplicate()` / `validateRpmDuplicate()`，检查 `(model, window_minutes, max_tokens, step_minutes)` / `(model, window_minutes, max_requests)` |
| `utils/commonTypes.js` | 抽取 `validateRateLimitPolicy()` 公共函数 |
| 两文件 `validateRateLimitPolicy` | 「不限制并发」(-1) 是否算「已配置」与后端确认；当前 UI 设计为不算，与 OpenAPI「≥0 至少配其一」语义略有差异但符合产品提示 |

---

### 10. TPMConfig

- **新版定义**：`name` 必填、1–128 字符、Policy 内唯一；`model` 默认 `"*"`（AIModel）；`window_minutes` 1–360；`max_tokens` ≥0；`step_minutes` 1–360 且 ≤ `window_minutes`。
- **UI 使用位置**：`EntityUpsert.vue`、`Upsert.vue` 中 `rate_limit_policy.rules.tpm[]`。

- **当前 UI 校验**：

| 字段 | 实现 | 差异 |
|------|------|------|
| `name` | 非空 + Policy 内重名 | 未限制 1–128 长度 |
| `model` | 下拉，含 `*` | ✅ |
| `window_minutes` | 1–360 | ✅ |
| `max_tokens` | **要求 ≥1**（`value < 1` 报错） | ❌ 规范为 ≥0 |
| `step_minutes` | 1–360 且 ≤ window | ✅ |

- **是否需要对齐**：**是**

- **具体修改建议**：

| 修改文件 | 内容 |
|----------|------|
| `EntityUpsert.vue` | `validateTpmMaxTokens`：`value < 0` 报错（允许 0）；InputNumber `:min="0"` |
| `Upsert.vue` | 同上 |
| 两文件 `validateTpmRuleName` | 增加 `trim().length` 1–128 检查 |
| `i18n` | 补充名称长度错误提示 |

---

### 11. RPMConfig

- **新版定义**：`name` 必填、1–128、Policy 内唯一；`model` AIModel；`window_minutes` 1–360；`max_requests` ≥0。
- **UI 使用位置**：同 TPMConfig。

- **当前 UI 校验**：与 TPM 类似；`max_requests` **要求 ≥1**；`name` 无长度上限。

- **是否需要对齐**：**是**

- **具体修改建议**：

| 修改文件 | 内容 |
|----------|------|
| `EntityUpsert.vue`、`Upsert.vue` | `validateRpmMaxRequests` 允许 0；InputNumber `:min="0"` |
| 两文件 `validateRpmRuleName` | 增加 1–128 长度校验 |

---

### 12. UserName

- **新版定义**：长度 1–64；仅字母、数字、`_`、`-`、`.`；不得以 `.`、`-`、`_` 开头或结尾；全局唯一（大小写不敏感）；保留名 `admin`/`root`/`system` 等不可用。
- **UI 使用位置**：

| 文件 | 字段 |
|------|------|
| `src/modules/User/components/CreateUser.vue` | `user_name` |
| `src/modules/User/components/UpdatePassword.vue` | `user_name`（disabled） |
| `src/modules/Login/loginPassword.vue` | `user`（登录，仅 required） |

- **当前 UI 校验**：

| 文件 | 实现 |
|------|------|
| `CreateUser.vue` | `UserNameRegCheck()` → `/^[a-zA-Z0-9\.@_-]*$/g` |
| `loginPassword.vue` | 仅非空 |
| `utils/const.js` | `UserNameRegCheck` 允许 `@`、无长度/首尾/保留名校验 |

- **是否需要对齐**：**是**

- **具体修改建议**：

| 修改文件 | 内容 |
|----------|------|
| `utils/const.js` | 重写 `UserNameRegCheck`：`/^(?!admin$|root$|system$)[a-zA-Z0-9]([a-zA-Z0-9._-]{0,62}[a-zA-Z0-9])?$/i`（注意保留名列表、长度 1–64、首尾限制） |
| `CreateUser.vue` | 调用新函数；可选前端保留名提示 |
| `loginPassword.vue` | 登录用户名增加格式校验（或仅后端 422） |
| `i18n/zh.js`、`i18n/en.js` | 更新 `user.tipNameRule` 文案 |

---

### 13. Password

- **新版定义**：长度 8–128；不含空白字符；不能等于 `user_name` 或其逆序。
- **UI 使用位置**：

| 文件 | 场景 |
|------|------|
| `src/modules/User/components/CreateUser.vue` | 创建用户密码 |
| `src/modules/User/components/UpdatePassword.vue` | 修改密码 |
| `src/modules/Login/loginPassword.vue` | 登录（仅 required） |

- **当前 UI 校验**：`PasswordRegCheck()` → 必须含字母+数字+特殊字符，最短约 3 字符（`/.{3,}/`），与新版规范**完全不符**；无空白/用户名/逆序检查。

- **是否需要对齐**：**是**

- **具体修改建议**：

| 修改文件 | 内容 |
|----------|------|
| `utils/const.js` | 重写 `PasswordRegCheck(value, userName)`：8–128、`!/\\s/`、不等于 userName、不等于 userName 逆序 |
| `CreateUser.vue` | `validatePass` 传入 `user_name` |
| `UpdatePassword.vue` | `validateNewPass` 传入 `user_name`；移除「必须含特殊字符」约束 |
| `i18n` | 更新 `user.tipPasswordRule` 为「8–128 字符，不含空格，不得与用户名相同或为其逆序」 |

---

### 14. TokenName

- **新版定义**：长度 1–64；仅字母、数字、`_`、`-`、`.`；不得以 `.`、`-`、`_` 开头或结尾；全局唯一；保留名 `admin`/`system`/`default`；不含空白。
- **UI 使用位置**：

| 文件 | 字段 |
|------|------|
| `src/modules/User/components/CreateToken.vue` | `name` |

- **当前 UI 校验**：仅 `required` + 非空。

- **是否需要对齐**：**是**

- **具体修改建议**：

| 修改文件 | 内容 |
|----------|------|
| `utils/const.js` | 新增 `TokenNameRegCheck()`（规则类似 UserName/ClusterName，保留名不同） |
| `CreateToken.vue` | `validateName` 调用 `TokenNameRegCheck`；增加 `maxlength="64"` |
| `i18n` | 新增 `user.tipTokenNameRule` |

---

### 15. ClusterName

- **新版定义**：长度 1–64；仅字母、数字、`_`、`-`、`.`；不得以 `.`、`-`、`_` 开头或结尾；全局唯一；不含空白。
- **UI 使用位置**：

| 文件 | 字段 |
|------|------|
| `src/modules/Clusters/components/BaseConfig.vue` | 集群 `name` |
| `src/modules/RouteTable/components/RuleForm.vue` | `targets[].ClusterName`、`fallbacks[].ClusterName`（下拉选取） |

- **当前 UI 校验**：`ClustersNameRegCheck()` → `/^[A-Za-z0-9][A-Za-z0-9-._]{1,}$/`（最短 2 字符）；新建时列表内重名检查；**无 max 64**；**允许以 `.`/`_`/`-` 结尾**。

- **是否需要对齐**：**是**

- **具体修改建议**：

| 修改文件 | 内容 |
|----------|------|
| `utils/const.js` | 新增/重写 `ClusterNameRegCheck`：`/^[a-zA-Z0-9]([a-zA-Z0-9._-]{0,62}[a-zA-Z0-9])?$/`，长度 1–64 |
| `BaseConfig.vue` | 替换 `ClustersNameRegCheck`；Input 增加 `maxlength="64"` |
| `i18n` | 更新 `cluster.tipClusterNameRule`（当前写「长度大于1」不准确） |

---

### 16. EntityTypeName

- **新版定义**：长度 1–32；仅**小写**字母、数字、`_`、`-`；不得以 `-`、`_` 开头或结尾；全局唯一；不含空白。
- **UI 使用位置**：

| 文件 | 字段 |
|------|------|
| `src/modules/Entity/components/EntityTypeUpsert.vue` | `type_name` |

- **当前 UI 校验**：`pattern: /^[a-z0-9_-]{1,32}$/` + `maxlength="32"`；必填。

- **是否需要对齐**：**是**（部分）

- **具体修改建议**：

| 缺口 | 修改文件 | 建议 |
|------|----------|------|
| 允许以 `-`/`_` 开头或结尾（如 `-abc`、 `abc_`） | `EntityTypeUpsert.vue` | 改为 `/^[a-z0-9]([a-z0-9_-]{0,30}[a-z0-9])?$/` |
| 未校验空白字符 | 同上 | `trim()` 后与原文比较，或 `/\\s/` 拒绝 |
| 全局唯一 | 后端 555/409 | 前端可选：提交前调列表 API 查重 |
| 提示文案 | `i18n` | 补充「不得以 `-`/`_` 开头或结尾」 |

---

## 需要优先处理的差异

| 优先级 | 类型 | 影响文件 | 修改内容 |
|--------|------|----------|----------|
| P0 | UserName | `utils/const.js`、`User/components/CreateUser.vue`、`i18n/zh.js`、`i18n/en.js` | 重写校验：1–64 字符、字符集、首尾限制、保留用户名；移除 `@` |
| P0 | Password | `utils/const.js`、`CreateUser.vue`、`UpdatePassword.vue`、`i18n/*` | 重写为 8–128、禁空白、不等于用户名/逆序；移除「必须特殊字符」旧规则 |
| P0 | TokenName | `utils/const.js`、`User/components/CreateToken.vue`、`i18n/*` | 新增完整 TokenName 校验（当前仅非空） |
| P0 | ClusterName | `utils/const.js`、`Clusters/components/BaseConfig.vue`、`i18n/*` | 1–64 长度、首尾 `.`/`_`/`-` 限制；替换 `ClustersNameRegCheck` |
| P1 | RouteRule | `RouteTable/components/RuleForm.vue`、`RouteRules.vue`、`i18n/*` | `(ClusterName,Model)` 去重替代 ClusterName 去重；允许同集群多目标；rules 间 name 唯一 |
| P1 | RateLimitPolicy | `APIKey/components/Upsert.vue`、`Entity/components/EntityUpsert.vue` | TPM/RPM 组合字段重复检测 |
| P1 | TPMConfig | `EntityUpsert.vue`、`Upsert.vue` | `max_tokens` 允许 0；`name` 长度 1–128 |
| P1 | RPMConfig | `EntityUpsert.vue`、`Upsert.vue` | `max_requests` 允许 0；`name` 长度 1–128 |
| P1 | Hostname | `Clusters/components/InstancePool.vue`、`utils/const.js` | 域名模式补充 RFC 1123 标签/长度约束 |
| P2 | EntityTypeName | `Entity/components/EntityTypeUpsert.vue`、`i18n/*` | 首尾 `-`/`_` 限制、空白字符检查 |
| P2 | AIModel | `Clusters/components/GatewayConfig.vue` | 模型名 Tag 输入增加存在性/格式校验 |
| P2 | 公共模块 | 新建 `src/utils/commonTypes.js` | 集中导出 16 类校验函数，各表单统一引用 |

---

## 附录：建议公共校验模块结构

```javascript
// src/utils/commonTypes.js（建议新建）
export function validateHostname(value) { /* ... */ }
export function validateIpAddress(value) { /* 复用 isIpv4Address + expandIpv6 */ }
export function validatePort(value) { /* 1-65535 int */ }
export function validateCidr(value) { /* 复用 isCidr 或 '*' */ }
export function validateAIModel(value, knownModels) { /* ... */ }
export function validateRouteRule(rule, context) { /* ... */ }
export function validateRouteRules(routeRules) { /* ... */ }
export function validateQuotaPlan(plan) { /* ... */ }
export function validateRateLimitPolicy(policy) { /* ... */ }
export function validateTPMConfig(cfg, siblings) { /* ... */ }
export function validateRPMConfig(cfg, siblings) { /* ... */ }
export function validateUserName(value) { /* ... */ }
export function validatePassword(value, userName) { /* ... */ }
export function validateTokenName(value) { /* ... */ }
export function validateClusterName(value) { /* ... */ }
export function validateEntityTypeName(value) { /* ... */ }
```
