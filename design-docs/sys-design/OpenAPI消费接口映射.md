# AI Gateway Web OpenAPI 消费接口映射

## 1. 设计目标

- 明确前端页面/组件与后端 `ai-gateway-api` OpenAPI 端点的消费关系。
- 避免前端重复定义 OpenAPI，仅做引用和映射。
- 作为前后端联调、接口变更影响分析的入口文档。

## 2. 映射原则

1. **前端只消费，不定义**：所有 OpenAPI 定义以 `ai-gateway-api/design-docs/api-define/` 为准。
2. **统一前缀**：前端请求统一访问 `${window.location.protocol}//${window.location.host}/open-api/v1/`。
3. **路径参数使用 `urlFormat`**：REST 路径参数通过 `utils/tool.js` 中的 `urlFormat` 处理。
4. **鉴权由 request.js 统一注入**：`Authorization: Session <sessionKey>`。

## 3. 全局接口

| 前端使用位置 | 请求方法 | 相对 URL | 说明 |
|--------------|----------|----------|------|
| `utils/authorize.js` | `GET` | `meta` | 获取导航元数据与权限。 |
| `utils/authorize.js` | `GET` | `meta` | 首次路由守卫时拉取。 |
| `request.js` 拦截器 | - | 所有请求 | 自动注入鉴权、语言、TraceId。 |

## 4. 登录与会话

| 前端使用位置 | 请求方法 | 相对 URL | 说明 |
|--------------|----------|----------|------|
| `modules/Login/loginPassword.vue` | `POST` | `auth/session-keys` | 用户登录，创建会话。 |
| `utils/request.js` | - | 所有请求 | 自动携带 `Authorization: Session <sessionKey>`。 |
| `utils/request.js` | - | 401 响应 | 清除会话，跳转登录页。 |

## 5. 用户管理（`modules/User`）

| 前端组件 | 请求方法 | 相对 URL | 说明 |
|----------|----------|----------|------|
| `User/components/User.vue` | `GET` | `auth/users` | 查询用户列表。 |
| `User/components/User.vue` | `POST` | `auth/users` | 创建用户。 |
| `User/components/User.vue` | `PUT` | `auth/users/{user_name}` | 更新用户。 |
| `User/components/User.vue` | `PUT` | `auth/users/{user_name}/passwd` | 修改密码。 |
| `User/components/User.vue` | `DELETE` | `auth/users/{user_name}` | 删除用户。 |
| `User/components/Token.vue` | `GET` | `auth/tokens` | 查询 Token 列表。 |
| `User/components/Token.vue` | `POST` | `auth/tokens` | 创建 Token。 |
| `User/components/Token.vue` | `DELETE` | `auth/tokens/{token_name}` | 删除 Token。 |
| `User/components/Token.vue` | `GET` | `products` | 查询产品线（Token 关联）。 |

## 6. AI 实例池（`modules/AIInstancePool`）

| 前端组件 | 请求方法 | 相对 URL | 说明 |
|----------|----------|----------|------|
| `AIInstancePool/index.vue` | `GET` | `alb-pool` | 查询 AI 实例池列表。 |
| `AIInstancePool/index.vue` | `POST` | `alb-pool` | 创建/更新实例池。 |

## 7. 模型服务商（`modules/Providers`）

| 前端组件 | 请求方法 | 相对 URL | 说明 |
|----------|----------|----------|------|
| `Providers/index.vue` | `GET` | `providers` | 分页查询服务商列表（`page` / `page_size`，可带 `model_protocol`）；`Data` 为 `{ list, pagination }`。 |
| `Providers/index.vue` | `GET` | `providers/{provider_name}` | 查询单个服务商详情。 |
| `Providers/index.vue` | `DELETE` | `providers/{provider_name}` | 删除服务商；被 cluster 引用时 `409`。 |
| `Providers/components/ProviderUpsert.vue` | `POST` | `providers` | 新建服务商。 |
| `Providers/components/ProviderUpsert.vue` | `PATCH` | `providers/{provider_name}` | 更新服务商；`keys`、`instance_pool` 全量替换。 |
| `Providers/components/ProviderUpsert.vue` | `POST` | `providers/{provider_name}/discover-models` | 触发模型发现并回填 `models`。 |

服务商持有实例池、模型协议、模型发现端点与 Key 明文。集群通过 `llm_config.provider` 引用，不再消费 `model-provider-types` 与 `tools/get-models-from-provider`。

## 8. AI 业务集群（`modules/Clusters`）

| 前端组件 | 请求方法 | 相对 URL | 说明 |
|----------|----------|----------|------|
| `Clusters/index.vue` | `GET` | `clusters` | 查询集群列表。 |
| `Clusters/index.vue` | `GET` | `clusters/{cluster_name}` | 查询单个集群详情。 |
| `Clusters/index.vue` | `DELETE` | `clusters/{cluster_name}` | 删除集群。 |
| `Clusters/index.vue` | `GET` | `route-tables` / `entities` / `api-keys` | 删除被引用时解析引用方，用于提示跳转。 |
| `Clusters/components/index.vue` | `POST` | `clusters` | 新建集群。不提交 `instance_pool`。 |
| `Clusters/components/index.vue` | `PATCH` | `clusters/{cluster_name}` | 更新集群。 |
| `Clusters/components/GatewayConfig.vue` | `GET` | `providers` | 所属服务商下拉（`page=1&page_size=1000`，解析 `Data.list`）。 |

## 9. 路由表（`modules/RouteTable`）

| 前端组件 | 请求方法 | 相对 URL | 说明 |
|----------|----------|----------|------|
| `RouteTable/index.vue` | `GET` | `route-tables` | 分页查询路由表列表（`page` / `page_size` + 筛选）。 |
| `RouteTable/index.vue` | `GET` | `entities` | 解析 Entity 类型路由表的 owner 名称。 |
| `RouteTable/index.vue` | `GET` | `global-route-rules` | 加载 Global 表完整规则（启停切换）。 |
| `RouteTable/index.vue` | `GET` | `entities/{id}` / `api-keys/{id}` | 加载 Entity / API-Key 表完整规则。 |
| `RouteTable/index.vue` | `PUT` | `global-route-rules` | 切换 Global 表启用状态。 |
| `RouteTable/index.vue` | `PATCH` | `entities/{id}` / `api-keys/{id}` | 切换 Entity / API-Key 表启用状态。 |
| `RouteTable/components/RouteRules.vue` | `GET` | `clusters` | 规则目标/降级集群下拉。 |
| `RouteTable/components/RouteRules.vue` | `GET` | `global-route-rules` | 加载 Global 规则详情。 |
| `RouteTable/components/RouteRules.vue` | `PUT` | `global-route-rules` | 提交 Global 规则（`enabled` + `rules`）。 |
| `RouteTable/components/RouteRules.vue` | `PATCH` | `entities/{id}` / `api-keys/{id}` | 提交嵌套 `route_rules`。 |
| `RouteTable/components/RuleForm.vue` | `GET` | `clusters` | 规则表单选择目标集群与模型。 |

规则字段使用 snake_case：`cond`、`targets[].cluster_name/model/weight`、`fallbacks[].cluster_name/model`。同一规则内 `(cluster_name, model)` 在 `targets` 与 `fallbacks` 之间不可重复。

## 10. API Key 管理（`modules/APIKey`）

| 前端组件 | 请求方法 | 相对 URL | 说明 |
|----------|----------|----------|------|
| `APIKey/components/ApiKeyList.vue` | `GET` | `api-keys` | 查询 API Key 列表。 |
| `APIKey/components/ApiKeyList.vue` | `POST` | `api-keys` | 创建 API Key。 |
| `APIKey/components/ApiKeyList.vue` | `PATCH` | `api-keys/{id}` | 更新 API Key。 |
| `APIKey/components/ApiKeyList.vue` | `DELETE` | `api-keys/{id}` | 删除 API Key。 |
| `APIKey/components/ApiKeyView.vue` | `GET` | `api-keys/{id}` | 查询 API Key 详情。 |
| `APIKey/components/ApiKeyView.vue` | `POST` | `api-keys/{id}/quota-plan/reset` | 重置 API Key 配额（按 `unit` 限制精度与上限）。 |
| `APIKey/components/Upsert.vue` | `GET` | `entities` | 获取 Entity 列表用于关联。 |
| `APIKey/components/Upsert.vue` | `GET` | `clusters` | 获取集群模型列表用于模型绑定。 |

`quota_plan.unit` 支持 `total_token` 与 `RMB`；RMB 上限 90,000,000.00，展示 4 位小数。

## 11. Entity 管理（`modules/Entity`）

| 前端组件 | 请求方法 | 相对 URL | 说明 |
|----------|----------|----------|------|
| `Entity/components/EntityList.vue` | `GET` | `entities` | 查询 Entity 列表。 |
| `Entity/components/EntityList.vue` | `POST` | `entities` | 创建 Entity。 |
| `Entity/components/EntityList.vue` | `PATCH` | `entities/{id}` | 更新 Entity。 |
| `Entity/components/EntityList.vue` | `DELETE` | `entities/{id}` | 删除 Entity。 |
| `Entity/components/EntityView.vue` | `GET` | `entities/{id}` | 查询 Entity 详情。 |
| `Entity/components/EntityView.vue` | `POST` | `entities/{id}/quota-plan/reset` | 重置 Entity 配额。 |
| `Entity/components/EntityTypeList.vue` | `GET` | `entity-types` | 查询 Entity Type 列表。 |
| `Entity/components/EntityTypeList.vue` | `POST` | `entity-types` | 创建 Entity Type。 |
| `Entity/components/EntityTypeList.vue` | `PATCH` | `entity-types/{id}` | 更新 Entity Type。 |
| `Entity/components/EntityTypeList.vue` | `DELETE` | `entity-types/{id}` | 删除 Entity Type。 |
| `Entity/components/EntityUpsert.vue` | `GET` | `entity-types` | 获取 Entity Type 用于选择。 |
| `Entity/components/EntityUpsert.vue` | `GET` | `clusters` | 获取集群模型列表。 |

配额单位与 API Key 相同：`total_token` / `RMB`。

## 12. 模型定价（`modules/ModelPrices`）

| 前端组件 | 请求方法 | 相对 URL | 说明 |
|----------|----------|----------|------|
| `ModelPrices/index.vue` | `GET` | `model-prices` | 分页列表（`page` / `page_size` + 筛选）。 |
| `ModelPrices/index.vue` | `DELETE` | `model-prices/{id}` | 删除定价记录。 |
| `ModelPrices/components/ModelPriceUpsert.vue` | `GET` | `model-prices` | 校验 `(provider, model, mode)` 是否重复。 |
| `ModelPrices/components/ModelPriceUpsert.vue` | `POST` | `model-prices` | 新建定价。 |
| `ModelPrices/components/ModelPriceUpsert.vue` | `PUT` | `model-prices/{id}` | 更新定价。 |
| `ModelPrices/components/ModelPriceImport.vue` | `POST` | `model-prices/import` | YAML 导入（`mode=replace|merge`）。 |

时间字段为 `create_time` / `update_time`（Unix 秒）。

## 13. 证书管理（`modules/Cert`，未启用）

| 前端组件 | 请求方法 | 相对 URL | 说明 |
|----------|----------|----------|------|
| `Cert/index.vue` | `GET` | `certificates` | 查询证书列表。 |
| `Cert/index.vue` | `POST` | `certificates` | 上传证书。 |
| `Cert/index.vue` | `PUT` | `certificates/{cert_name}` | 更新证书。 |
| `Cert/index.vue` | `PUT` | `certificates/{cert_name}/default` | 设置默认证书。 |

## 14. 变更影响分析

当 `ai-gateway-api` 接口发生变更时，按以下顺序评估影响：

1. 查看本文档定位受影响的前端组件。
2. 检查对应模块的 `index.vue` 与 `components/*.vue`。
3. 若涉及表单字段变化，同步更新子表单组件与 `Review.vue`。
4. 若涉及 i18n 文案变化，同步更新 `en.js` 与 `zh.js`。
5. 若涉及路由/权限变化，同步更新 `路由与导航设计文档.md` 与 `状态管理设计文档.md`。

## 15. 引用规范

- 接口定义位置：`design-docs/api-define/OpenAPI接口定义/`（按模块拆分，见该目录 `README.md`）。
- 引用方式：在文档中直接写明相对路径或仓库链接，不复制接口定义内容。
- 上游权威定义：`ai-gateway-api` 仓库对应 OpenAPI 文档。