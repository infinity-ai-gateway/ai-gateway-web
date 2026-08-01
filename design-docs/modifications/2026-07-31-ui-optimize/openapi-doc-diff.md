# OpenAPI 接口定义文档核对报告

> **对比范围**
>
> - **文档 A（新版）**：`/Users/apple/Desktop/workspaces/ai-gateway-api/design-docs/api-define/OpenAPI接口定义/`（按模块拆分，16 个文件）
> - **文档 B（旧版）**：`/Users/apple/Desktop/workspaces/ai-gateway-web/design-docs/api-define/OpenAPI接口定义.md`（单文件，3548 行）
>
> **核对日期**：2026-07-31

---

## 1. 结构差异

| 维度 | 新版（文档 A） | 旧版（文档 B） | 影响范围 |
|------|---------------|---------------|----------|
| 组织形式 | 按模块拆分为 16 个独立 Markdown 文件 + `README.md` 索引 | 单个 Markdown 文件，15 章线性排列 | 文档维护、引用、Review 流程 |
| 通用约定 | 抽取至 `00-common.md`，各模块通过链接引用公共类型 | 通用说明仅第 1 章；各模块内联定义嵌套结构 | 前端校验、后端参数校验需统一引用公共类型 |
| 模块索引 | `README.md` 提供模块→文件映射表 | 文内 TOC 锚点链接 | 无接口行为影响 |
| 章节编号 | 各模块文件内独立编号（如 api-keys 2.1~2.8） | 全局连续编号（如 2.2.1~2.2.8） | 纯文档结构，不影响 API |
| 新增文件 | `README.md` | 无 | — |

**新版文件清单**

| 模块 | 新版文件 | 旧版对应章节 |
|------|----------|-------------|
| 通用说明 | `00-common.md` | 第 1 章 |
| /api-keys | `api-keys.md` | 第 2 章 |
| /entity-types | `entity-types.md` | 第 3 章 |
| /entities | `entities.md` | 第 4 章 |
| /global-route-rules | `global-route-rules.md` | 第 5 章 |
| /route-tables | `route-tables.md` | 第 6 章 |
| /alb-pool | `alb-pool.md` | 第 7 章 |
| /auth | `auth.md` | 第 8 章 |
| /certificates | `certificates.md` | 第 9 章 |
| /clusters | `clusters.md` | 第 10 章 |
| /model-provider-types | `model-provider-types.md` | 第 11 章 |
| /tools | `tools.md` | 第 12 章 |
| /expression/verify | `expression-verify.md` | 第 13 章 |
| 关键业务流程 | `workflows.md` | 第 14 章 |
| 对象关系图 | `object-relations.md` | 第 15 章 |

---

## 2. 通用说明差异

### 2.1 基本信息 / 返回值格式 / Method 约定

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| 基本信息、返回值 ErrNum 码表、Method 含义 | 与旧版一致 | 与新版一致 | 无差异 |

### 2.2 通用 Query 参数

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| 参数合法性条件 | 新增「合法性条件」列：`page` 必须 >0 否则默认 1；`page_size` 范围 1-100，超出截断为 100；`sort_order` 仅 `asc`/`desc` 有效 | 仅描述默认值和范围，无边界处理说明 | 所有列表接口的分页行为 |
| sort_by | 无额外约束 | 无额外约束 | 无差异 |

### 2.3 公共参数类型（新版新增，旧版无对应章节）

旧版将嵌套结构（quota_plan、rate_limit_policy、route_rules 等）分散在各模块内联定义；新版在 `00-common.md` 集中定义 **16 类公共类型**，各模块改为引用。

| 公共类型 | 新版核心约束（旧版无或较弱） | 影响范围 |
|----------|---------------------------|----------|
| **Hostname** | RFC 1123 或 IPv4/IPv6；标签 ≥2 字符（系统特殊要求） | clusters、alb-pool 实例 hostname |
| **IP Address** | RFC 791 IPv4 / RFC 8200 IPv6 | clusters、alb-pool 实例 ip |
| **Port** | 整数 1-65535 | clusters、alb-pool 端口 |
| **CIDR** | IPv4/IPv6 CIDR 或 `"*"` | api-keys `subnet` |
| **AIModel** | 非 `"*"` 时须为某集群 `llm_config.models` 已配置模型 | api-keys `models`、entities `allow_models`、路由规则 Model |
| **RouteRule** | `Cond` 须合法 BFE 表达式；`ClusterName` 须已存在；`Model` 非空时须属于对应集群；`(ClusterName, Model)` 在 targets 内不可重复；Weight 之和 = 100 | api-keys/entities/global-route-rules 路由规则 |
| **RouteRules** | `enabled` 默认 false | 各路由规则集 |
| **QuotaPlan** | `quota` 非负；`unit` 仅 `total_token`；`reset_period` 默认 `never` | api-keys、entities 配额 |
| **RateLimitPolicy** | `enabled=true` 时 `tpm`/`rpm`/`max_concurrency(>=0)` 至少配一；TPM/RPM 组合不可重复；`max_concurrency` 为 `-1` 或 `>=0` | api-keys、entities 限流 |
| **TPMConfig** | `name` 长度 1-128；`max_tokens` 非负；`step_minutes` ≤ `window_minutes` | 限流 TPM 规则 |
| **RPMConfig** | `name` 长度 1-128；`max_requests` 非负 | 限流 RPM 规则 |
| **UserName** | 1-64 字符；禁止保留名 admin/root/system 等 | auth 用户 |
| **Password** | 8-128 字符；不能含空白；不能等于 user_name 或其逆序 | auth 密码 |
| **TokenName** | 1-64 字符；禁止保留名 admin/system/default 等 | auth Token |
| **ClusterName** | 1-64 字符；全局唯一 | clusters、路由规则 ClusterName |
| **EntityTypeName** | 1-32 小写字母/数字/`_`/`-`；不能以 `-`/`_` 开头或结尾 | entity-types、entities |

### 2.4 限流 `max_concurrency` 语义变化（跨模块）

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| max_concurrency 取值 | `-1` 不限制；否则 `>=0` 整数（0 视为已配置） | 最小值 1；默认 -1 不限制 | api-keys、entities 限流配置；`enabled=true` 时 0 是否满足「至少配置一项」 |

---

## 3. 逐模块接口差异

### 3.1 /api-keys

#### 接口清单

| 接口 | Method | 路径 | 差异 |
|------|--------|------|------|
| 创建 API-Key | POST | /api-keys | 无 |
| 查询列表 | GET | /api-keys | 无 |
| 查询单个 | GET | /api-keys/{id} | 无 |
| 全量更新 | PUT | /api-keys/{id} | 无 |
| 部分更新 | PATCH | /api-keys/{id} | 无 |
| 删除 | DELETE | /api-keys/{id} | 无 |
| 查询配额计划 | GET | /api-keys/{id}/quota-plan | 无 |
| 重置配额余额 | POST | /api-keys/{id}/quota-plan/reset | 无 |

**结论**：接口清单、Method、路径均无变化。

#### 数据模型 / 输入参数 / 约束

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| 嵌套结构定义位置 | 引用 `00-common.md` 公共类型 | 模块内联 quota_plan / rate_limit_policy / route_rules 结构 | 文档组织；校验规则以新版公共类型为准 |
| `key` | 1-128 字符；仅字母数字 `-`_`；全局唯一 | 可选导入；重复返回 422；无格式细则 | 创建/导入 API-Key |
| `description` | 必填；长度 ≤511（<512） | 必填；无长度约束 | 创建/更新 |
| `expired_time` | -1 或 ≥ 当前时间的 Unix 秒 | -1 或 Unix 秒；无下限 | 创建/更新 |
| `models` | 元素类型 AIModel | 白名单字符串；无集群存在性校验 | 模型访问控制 |
| `subnet` | 元素类型 CIDR | 子网字符串；无 CIDR 格式校验 | IP 访问控制 |
| `entity_id`（Query 过滤） | 长度 ≤64 | 无长度约束 | 列表过滤 |
| URI `id` | 长度 ≤255 | 无长度约束 | 所有 /api-keys/{id} 接口 |
| PUT/PATCH 限流约束 | 引用公共类型（含 max_concurrency>=0） | 显式写 tpm/rpm/max_concurrency 至少配一 | 更新限流策略 |
| 数据模型示例 `route_rules.enabled` | 示例为 `true` | 示例为 `false` | 仅示例差异，非规范差异 |

#### 返回数据 / 执行逻辑

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| 返回结构 | 一致（创建/更新不含 balance；列表/详情含 balance） | 一致 | 无 |
| 执行逻辑步骤 | 一致 | 一致 | 无 |

---

### 3.2 /entity-types

#### 接口清单

5 个接口（POST/GET 列表/GET 单个/PATCH/DELETE）均无变化。

#### 数据模型 / 输入参数 / 约束

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| `type_name` | 引用 EntityTypeName；不能以 `-`/`_` 开头或结尾 | 1-32 字符；小写字母/数字/`_`/`-` | 创建 Entity-Type |
| `description` | 0-255 字符；不含控制字符 | 自定义；无约束 | 创建/更新 |
| `page` / `page_size` | 明确边界处理（≤0 按 1；<1 按 20；>100 按 100） | 默认 1/20，最大 100 | 列表分页 |
| URI `type_name` | 须为已存在 Entity-Type | 无存在性说明 | 查询/更新/删除 |

---

### 3.3 /entities

#### 接口清单

8 个接口均无变化。

#### 数据模型 / 输入参数 / 约束

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| `name` | 1-64 字符；无控制字符；无前导/尾随空白；全局唯一 | 全局唯一；无格式细则 | 创建/更新 Entity |
| `type` | 引用 EntityTypeName | 须引用已定义 Entity-Type | 创建 |
| `allow_models` | 元素类型 AIModel | 字符串数组；无集群校验 | 模型白名单 |
| `block_models` | 非空字符串；**无需**为已配置 AIModel | 字符串数组；无 AIModel 说明 | 模型黑名单（运行时仍生效，配置更宽松） |
| 嵌套结构 | 引用公共类型 | 内联定义 | 配额/限流/路由 |
| PUT/PATCH 限流约束 | 引用公共类型 | 显式 tpm/rpm/max_concurrency 约束 | 更新 |
| URI `id` | 必填、非空 | 必填 | 无实质差异 |

#### 返回数据

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| 列表 `list` 字段 | 不含 `route_rules` | 不含 `route_rules` | 一致 |
| 详情/更新返回 | 不含 balance | 不含 balance | 一致 |

---

### 3.4 /global-route-rules

#### 接口清单

| 接口 | Method | 路径 | 差异 |
|------|--------|------|------|
| 更新 Global 路由表 | PUT | /global-route-rules | 无 |
| 查询 Global 路由表 | GET | /global-route-rules | **返回语义变化**（见下） |

#### 数据模型 / 约束

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| rules 结构定义 | 引用 RouteRule 公共类型（含 ClusterName 存在性、Model 集群校验、targets 去重） | 模块内联 rules/targets/fallbacks 结构 | 路由规则校验 |
| fallbacks ClusterName | 公共类型要求必填 | 旧版约束「不能为空」 | 一致意图，新版更细 |
| targets Weight | 公共类型：范围 [0,100]，总和=100 | 单个 100；多个总和 100 | 基本一致 |

#### 返回数据 / 执行逻辑

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| GET 空数据行为 | 系统初始化自动创建默认记录（`enabled=false`, `rules=[]`）；仅异常删除时 Data 为 null | 若不存在，Data 为 null | **前端初始化逻辑**；首次部署是否假定 null |
| PUT 执行逻辑 | 一致 | 一致 | 无 |

---

### 3.5 /route-tables

#### 接口清单

仅 `GET /route-tables` 列表，无变化。

#### 输入参数

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| Query 合法性 | 补充 page/page_size/sort_order/type/owner/enabled 边界与枚举说明 | 有参数表，无合法性条件列 | 列表过滤 |
| `type` 空字符串 | 会被忽略 | 未说明 | 过滤行为 |
| `owner` 空字符串 | 会被忽略 | 未说明 | 过滤行为 |

#### 返回数据

分页结构一致，无字段变化。

---

### 3.6 /alb-pool

#### 接口清单

`GET /alb-pool`、`PATCH /alb-pool` 无变化。

#### 数据模型 / 约束

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| 实例池角色 | 未提及 COMMON/EPP Server | 「AI 网关实例池角色固定为 COMMON，无需 EPP Server 配置」 | 文档说明；若实现仍依赖该角色需确认 |
| `instances` 最少元素 | 至少 1 个 | 未显式约束 | 更新实例池 |
| `hostname` / `ip` / `ports` | 引用 Hostname/IP/Port 公共类型 | 简单描述 | 实例校验 |
| `weight` 为 0 | 后端按默认值 1 处理 | 范围 [0,100]；未说明 0 的行为 | **与 clusters 不一致**（clusters 中 0 表示不接流量） |
| 数据模型 `name` | 明确只读，由配置项提供 | 同 | 无差异 |

---

### 3.7 /auth

#### 接口清单

13 个接口（含 `/meta`）均无变化。

#### 输入参数 / 约束

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| `user_name` | 引用 UserName（1-64、保留名、字符集等） | 必填；无格式细则 | 用户 CRUD |
| `password` | 引用 Password（8-128、禁空白、禁等于用户名/逆序） | 必填；无格式细则 | 创建用户/改密 |
| `is_admin` | 必须为 `true` | 固定 true；未传默认 true | 创建/权限设置 |
| 重置密码 `old_password` | 修改当前登录用户时必填且须一致 | 同语义 | 无差异 |
| session-keys `user_name`/`password` | 长度 ≥1；用户须存在；密码须一致 | 无细则 | 登录 |
| Token `name` | 引用 TokenName | name 全局唯一 | 创建 Token |
| Token `scope` | 枚举 System/Support | 同 | 无差异 |
| URI 参数 | 各接口补充「对应资源须存在」 | 执行逻辑中隐含 | 错误码 404 场景 |

#### 返回数据 / 执行逻辑

无结构变化。

---

### 3.8 /certificates ⚠️ 重大差异

#### 接口清单

5 个接口无变化（POST/GET 列表/GET 详情/PATCH default/DELETE）。

#### 数据模型字段

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| `cert_file_name` | **已删除** | 创建必填；返回包含 | **前端表单、API 客户端需移除该字段** |
| `key_file_name` | **已删除** | 创建必填；返回包含 | 同上 |
| `expired_date` | **只读**；服务端从 `cert_file_content` 解析；格式 `YYYY-MM-DD HH:MM:SS` | 创建/更新时**必填输入** | **创建证书请求体变更** |
| `cert_name` | 2-64 字符；字符集/首尾规则；全局唯一 | 必须唯一；无格式细则 | 证书命名 |
| `description` | 2-256 字符；不含控制字符 | 必填；无长度细则 | 创建证书 |
| `cert_file_content` / `key_file_content` | 须合法 PEM；须互相匹配 | 必填；匹配校验在执行逻辑中 | 证书上传 |

#### 输入参数（创建）

| 字段 | 新版必填 | 旧版必填 |
|------|----------|----------|
| cert_name | Y | Y |
| description | Y | Y |
| is_default | Y | Y |
| cert_file_content | Y | Y |
| key_file_content | Y | Y |
| cert_file_name | — | Y |
| key_file_name | — | Y |
| expired_date | —（只读） | Y |

#### 返回数据

| 差异内容 | 新版返回字段 | 旧版返回字段 |
|----------|-------------|-------------|
| 创建/列表/详情 | cert_name, description, is_default, expired_date | cert_name, description, is_default, cert_file_name, key_file_name, expired_date |

#### 约束 / 执行逻辑

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| 首个默认证书 | 若系统无默认证书，新证书必须 `is_default=true` | 全局必须有且只有一个默认证书 | 首次创建证书 |
| 敏感内容 | cert/key content 不返回 | 同 | 无差异 |

---

### 3.9 /clusters ⚠️ 重大差异

#### 接口清单

5 个接口无变化。

#### 数据模型字段

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| `model_mappings` 字段名 | `source_model` / `target_model` | `key` / `value` | **API 请求/响应字段重命名**；前端/客户端需迁移 |
| `description` | 0-256 字符；不含控制字符 | 无约束 | 创建/更新 |
| `instance_pool` | 至少 1 元素；`(hostname, ip)` 不可重复；至少一个 `weight > 0` | 必填；无重复/权重约束 | 集群实例配置 |
| Instance `weight` | 0 表示不接流量 | 范围 [0,100]；未说明 0 语义 | 流量分配 |
| Instance `ports` | key 非空；同实例端口值不可重复；须含 Default | 至少含 Default | 端口配置 |
| `llm_config.models` | 至少 1 个非空；不可重复 | 必填；无重复约束 | 模型列表 |
| `llm_config.service_name` / `group` | **删除** | 必填 | **UI 仍保留，待移除** |
| `llm_config.provider_type` | 若传入须存在于 `/model-provider-types` | 取值如 deepseek/openai/qwen | 提供商校验 |
| `llm_config.key` | 0-512 字符 | 无长度约束 | 密钥配置 |
| `passive_health_check.uri` | 非空；须以 `/` 开头 | 默认 `/` | 健康检查 |
| `passive_health_check.statuscode` | 0 或 100-599 | 0 表示忽略 | 健康检查 |
| `sticky_sessions.hash_strategy` | 枚举含 `CLIENT_ID_PREFERED`（修正拼写） | 描述中为 `CLIENT_ID_PERFERED`（拼写错误） | 枚举值需与实现对齐 |
| `basic.buffers.req_write_buffer_size` | 须 >0 | 未约束 | Basic 配置 |
| `basic.timeouts.*` | 须 >0 | 未约束 | 超时配置 |
| 嵌套结构 hostname/ip/port | 引用公共类型 | 简单描述 | 实例校验 |

#### 返回数据 / 执行逻辑

返回字段集合一致；执行逻辑（自动创建实例池/子集群、enable=true）一致。

---

### 3.10 /model-provider-types

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| 全部 | 无差异 | 无差异 | — |

---

### 3.11 /tools

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| `uri` 默认值 | 为空时默认 `/v1/models` | 可选；无默认值说明 | 拉取模型列表 |
| `provider_type` | 为空或不支持时走默认解析；`huoshancodeplan`、`bailiantokenplan` 走静态模型列表 | 取值如 deepseek/openai/qwen | 特定提供商集成 |
| `schema` | 必填枚举 http/https | 同 | 无差异 |
| `hosts` | 数组长度 ≥1 | 必填；无长度细则 | 请求目标 |

---

### 3.12 /expression/verify ⚠️ 行为差异

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| 接口状态 | **未标注废弃** | 标注「已废弃，无需鉴权」 | 是否继续调用、是否需登录 |
| 鉴权 | **`FeatureRoute + ActionRead`** | 无需鉴权 | 前端/测试脚本需带 Token |
| `expression` | 必填；长度 ≥1；须为合法 BFE 表达式 | 必填；无细则 | 表达式校验 |
| Method / 路径 / 返回结构 | PATCH /expression/verify；成功 null、失败 VerifyResult | 同 | 无差异 |

---

## 4. 关键业务流程差异（workflows.md vs 第 14 章）

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| 运行时执行顺序 | 模型访问控制 → 限流 → 配额扣减 | 同 | 无 |
| 14.1 / 创建 API-Key 流程 | 7 步；未单列 route_rules 默认值步骤 | 9 步；含 route_rules 默认值（步骤 3/4/7） | 新版 workflows 略简；api-keys 模块仍有完整步骤 |
| 14.2 / 创建 Entity 流程 | 7 步 | 7 步 | 无实质差异 |
| 14.3 模型访问控制 | 一致（API-Key models 白名单 + Entity 链 block/allow） | 一致 | 无 |
| 14.4 限流检查 | 一致（Set 去重、滑动/固定窗口、max_concurrency=-1 跳过） | 一致 | 无 |
| 14.5 配额扣减 | 一致（429002、原子回滚） | 一致 | 无 |
| 14.6 配置变更级联表 | 14 行，内容一致 | 同 | 无 |
| 章节交叉引用 | 正文仍写「14.4」「14.5」（旧章节号） | 同 | 文档编号笔误，不影响业务理解 |

**结论**：业务流程逻辑基本一致；主要差异为创建 API-Key 流程步骤粒度，以及章节编号引用未更新。

---

## 5. 对象关系图差异（object-relations.md vs 第 15 章）

| 差异内容 | 新版定义 | 旧版定义 | 影响范围 |
|----------|----------|----------|----------|
| Mermaid 类图 | 完全一致 | 完全一致 | 无 |
| 关系说明（14 条） | 完全一致 | 完全一致 | 无 |

**结论**：对象关系图无差异。

---

## 6. 总结

### 6.1 核心差异点（按影响优先级）

| 优先级 | 差异点 | 说明 |
|--------|--------|------|
| **P0** | **certificates 模型简化** | 移除 `cert_file_name`/`key_file_name`；`expired_date` 改为只读解析 |
| **P0** | **clusters.model_mappings 字段重命名** | `key`/`value` → `source_model`/`target_model` |
| **P0** | **expression/verify 鉴权变更** | 从「废弃、无需鉴权」变为需要 `FeatureRoute + ActionRead` |
| **P1** | **公共参数类型体系** | 新增 16 类公共类型，校验规则集中化（AIModel、CIDR、RouteRule 等） |
| **P1** | **global-route-rules GET 默认记录** | 不再假定 null；系统初始化创建 `enabled=false, rules=[]` 默认表 |
| **P1** | **max_concurrency 语义** | 旧版最小 1；新版允许 0，且 enabled=true 时 >=0 即可计入「至少配置一项」 |
| **P2** | **alb-pool weight=0** | 新版称后端按 1 处理，与 clusters 中 weight=0 不接流量不一致 |
| **P2** | **entities.block_models** | 新版明确无需为已配置 AIModel |
| **P2** | **tools.provider_type** | 新增 huoshancodeplan/bailiantokenplan 静态列表逻辑 |
| **P3** | **文档结构拆分** | 单文件 → 16 模块文件 + 公共类型文件 |
| **P3** | **各模块参数合法性条件** | 全面补充长度、格式、枚举、存在性校验 |

### 6.2 无差异项（接口层面）

以下模块 **接口清单（Method + 路径）与返回结构主干一致**，差异主要在约束细化：

- /api-keys（8 接口）
- /entity-types（5 接口）
- /entities（8 接口）
- /global-route-rules（2 接口）
- /route-tables（1 接口）
- /alb-pool（2 接口）
- /auth（13 接口）
- /model-provider-types（1 接口）

### 6.3 需要确认的事项

| # | 确认项 | 背景 |
|---|--------|------|
| 1 | **certificates 字段变更是否已落地后端** | 旧版前端若仍传 cert_file_name/key_file_name/expired_date 需同步改造 |
| 2 | **clusters.model_mappings 迁移方案** | 存量数据与 OpenAPI 客户端是否仍用 key/value |
| 3 | **expression/verify 是否仍废弃** | 新版取消废弃标记且要求鉴权，与旧版矛盾 |
| 4 | **global-route-rules 初始化行为** | 前端是否仍处理 GET 返回 null 的场景 |
| 5 | **alb-pool vs clusters 的 weight=0 语义** | 两模块文档描述不一致，需对齐实现 |
| 6 | **max_concurrency=0 的业务含义** | 0 是否表示「禁止并发」还是「未配置」 |
| 7 | **AIModel 校验范围** | 配置 api-keys.models 时是否强制模型已在某集群注册 |
| 8 | **block_models 宽松校验** | 运行时黑名单是否接受任意字符串（含未注册模型名） |
| 9 | **tools 静态 provider 列表** | huoshancodeplan/bailiantokenplan 是否为新增支持的提供商 |
| 10 | **sticky_sessions 枚举拼写** | CLIENT_ID_PREFERED vs 旧版 PERFERED，需与代码枚举一致 |

---

*本报告由文档 A（ai-gateway-api 新版拆分文档）与文档 B（ai-gateway-web 旧版单文件）逐项核对生成。*
