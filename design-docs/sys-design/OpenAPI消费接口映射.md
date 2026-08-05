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

## 7. AI 业务集群（`modules/Clusters`）

| 前端组件 | 请求方法 | 相对 URL | 说明 |
|----------|----------|----------|------|
| `Clusters/index.vue` | `GET` | `clusters` | 查询集群列表。 |
| `Clusters/index.vue` | `GET` | `clusters/{cluster_name}` | 查询单个集群详情。 |
| `Clusters/index.vue` | `DELETE` | `clusters/{cluster_name}` | 删除集群。 |
| `Clusters/components/index.vue` | `POST` | `clusters` | 新建集群。 |
| `Clusters/components/index.vue` | `PUT` | `clusters/{cluster_name}` | 更新集群。 |
| `Clusters/components/GatewayConfig.vue` | `GET` | `models` | 查询模型列表。 |
| `Clusters/components/GatewayConfig.vue` | `GET` | `model-providers` | 查询模型提供商。 |
| `Clusters/components/Review.vue` | `GET` | `model-providers` | 查询模型提供商（详情展示）。 |

## 8. 路由规则

### 8.1 默认路由规则（`modules/Routes`）

| 前端组件 | 请求方法 | 相对 URL | 说明 |
|----------|----------|----------|------|
| `Routes/index.vue` | `GET` | `clusters` | 获取可用集群列表。 |
| `Routes/index.vue` | `GET` | `ai-route-rules` | 查询 AI 路由规则。 |
| `Routes/index.vue` | `PATCH` | `ai-route-rules` | 提交更新路由规则。 |

### 8.2 AI 高级路由规则（`modules/AIRouteRules`）

| 前端组件 | 请求方法 | 相对 URL | 说明 |
|----------|----------|----------|------|
| `AIRouteRules/index.vue` | `GET` | `ai-route-rules` | 查询 AI 高级路由规则。 |
| `AIRouteRules/index.vue` | `POST` | `ai-route-rules` | 创建/更新 AI 高级路由规则。 |
| `AIRouteRules/Rules/components/index.vue` | `GET` | `clusters` | 获取集群列表用于选择目标集群。 |

## 9. API Key 管理（`modules/APIKey`）

| 前端组件 | 请求方法 | 相对 URL | 说明 |
|----------|----------|----------|------|
| `APIKey/components/ApiKeyList.vue` | `GET` | `api-keys` | 查询 API Key 列表。 |
| `APIKey/components/ApiKeyList.vue` | `POST` | `api-keys` | 创建 API Key。 |
| `APIKey/components/ApiKeyList.vue` | `PUT` | `api-keys/{id}` | 更新 API Key。 |
| `APIKey/components/ApiKeyList.vue` | `DELETE` | `api-keys/{id}` | 删除 API Key。 |
| `APIKey/components/ApiKeyView.vue` | `GET` | `api-keys/{id}` | 查询 API Key 详情。 |
| `APIKey/components/ApiKeyView.vue` | `POST` | `api-keys/{id}/quota-plan/reset` | 重置 API Key 配额。 |
| `APIKey/components/Upsert.vue` | `GET` | `entities` | 获取 Entity 列表用于关联。 |
| `APIKey/components/Upsert.vue` | `GET` | `global-models` | 获取全局模型列表。 |

## 10. Entity 管理（`modules/Entity`）

| 前端组件 | 请求方法 | 相对 URL | 说明 |
|----------|----------|----------|------|
| `Entity/components/EntityList.vue` | `GET` | `entities` | 查询 Entity 列表。 |
| `Entity/components/EntityList.vue` | `POST` | `entities` | 创建 Entity。 |
| `Entity/components/EntityList.vue` | `PUT` | `entities/{id}` | 更新 Entity。 |
| `Entity/components/EntityList.vue` | `DELETE` | `entities/{id}` | 删除 Entity。 |
| `Entity/components/EntityView.vue` | `GET` | `entities/{id}` | 查询 Entity 详情。 |
| `Entity/components/EntityView.vue` | `POST` | `entities/{id}/quota-plan/reset` | 重置 Entity 配额。 |
| `Entity/components/EntityTypeList.vue` | `GET` | `entity-types` | 查询 Entity Type 列表。 |
| `Entity/components/EntityTypeList.vue` | `POST` | `entity-types` | 创建 Entity Type。 |
| `Entity/components/EntityTypeList.vue` | `PUT` | `entity-types/{id}` | 更新 Entity Type。 |
| `Entity/components/EntityTypeList.vue` | `DELETE` | `entity-types/{id}` | 删除 Entity Type。 |
| `Entity/components/EntityUpsert.vue` | `GET` | `entity-types` | 获取 Entity Type 用于选择。 |
| `Entity/components/EntityUpsert.vue` | `GET` | `global-models` | 获取全局模型列表。 |

## 11. 证书管理（`modules/Cert`，未启用）

| 前端组件 | 请求方法 | 相对 URL | 说明 |
|----------|----------|----------|------|
| `Cert/index.vue` | `GET` | `certificates` | 查询证书列表。 |
| `Cert/index.vue` | `POST` | `certificates` | 上传证书。 |
| `Cert/index.vue` | `PUT` | `certificates/{cert_name}` | 更新证书。 |
| `Cert/index.vue` | `PUT` | `certificates/{cert_name}/default` | 设置默认证书。 |

## 12. 变更影响分析

当 `ai-gateway-api` 接口发生变更时，按以下顺序评估影响：

1. 查看本文档定位受影响的前端组件。
2. 检查对应模块的 `index.vue` 与 `components/*.vue`。
3. 若涉及表单字段变化，同步更新子表单组件与 `Review.vue`。
4. 若涉及 i18n 文案变化，同步更新 `en.js` 与 `zh.js`。
5. 若涉及路由/权限变化，同步更新 `路由与导航设计文档.md` 与 `状态管理设计文档.md`。

## 13. 引用规范

- 接口定义位置：`ai-gateway-api/design-docs/api-define/OpenAPI接口定义.md`。
- 引用方式：在文档中直接写明相对路径或仓库链接，不复制接口定义内容。
- 接口依赖说明通用文档：`design-docs/api-define/OpenAPI接口依赖说明.md`。
