# UI 代码变更文档

> **对照**：接口定义 `design-docs/api-define/OpenAPI接口定义/`
> **原型**：`design-docs/prototype-design/`（`pages/providers.html`、`assets/js/provider-upsert.js`、`assets/js/cluster-upsert.js`、`pages/cluster-list.html`）
> **接口变更日期**：2026-08-24
> **状态**：基本完成（1 项待补，见 §9）

本次核心变化：新增独立对象 `/providers`（模型服务商）。实例池、模型协议、模型发现端点、Key 明文从 Cluster 迁到 Provider；Cluster 只保留转发策略，通过 `llm_config.provider` 引用服务商。

---

## 1. 变更优先级总览

| 优先级 | 变更点 | 影响模块 | 状态 | 备注 |
| ------ | ------ | -------- | ---- | ---- |
| P0 | 新增模型服务商 `/providers` 管理模块 | 新模块 · 列表/创建/编辑/详情/删除 | **已完成** | 菜单放在「资源管理」下，位于 AI 网关实例池与 AI 业务集群之间 |
| P0 | Cluster 去掉实例池步骤，改为引用 Provider | 集群 · 向导/复查/详情 | **部分完成** | 向导 5 步、提交体已对齐；复查/详情**待补**服务商实例池只读展示（§9.1） |
| P0 | Cluster LLM 改为引用 Provider | 集群 · 大模型配置/复查 | **已完成** | 删除 `provider_type`、`model_endpoint`、Key 明文；`keys` 仅 `name`+`weight` |
| P1 | `sticky_sessions.hash_strategy` 默认 `CLIENT_IP_ONLY` | 集群 · 基本配置 | **已完成** | 与 `clusters.md` / 原型一致 |
| P1 | model-prices `prices` 键补齐 | 模型定价 · 创建/编辑 | **已完成** | 文档多出 4 个键 |
| P1 | 导航 / i18n / 接口映射同步 | 布局、文案、设计文档 | **已完成** | 路由 `Provider.list`；下线 `model-provider-types`、`tools/get-models-from-provider` |

---

## 2. P0：新增模型服务商 `/providers` 模块

### 2.1 需求

接口新增 `/providers` 资源。Provider 持有后端实例、鉴权 Key、模型协议与模型发现能力；Cluster 只引用它。

**接口参考**：`providers.md`  
**原型参考**：`pages/providers.html`、`assets/js/provider-upsert.js`、`assets/js/layout.js`（`Provider.list`）

```json
{
  "name": "deepseek",
  "description": "DeepSeek 官方 API",
  "model_endpoint": { "schema": "https", "uri": "/v1/models" },
  "models": ["deepseek-chat", "deepseek-coder"],
  "keys": [{ "name": "key-primary", "key": "sk-aaaaaaaaaaaa" }],
  "instance_pool": [
    { "name": "backend-1", "addr": "api.deepseek.com", "weight": 100, "port": 443 }
  ],
  "model_protocols": ["openai"]
}
```

### 2.2 接口校验规则

| 字段 | 校验规则 |
| ---- | -------- |
| `name` | 必填；类型 [ProviderName](../../api-define/OpenAPI接口定义/00-common.md#17-provider-名称providername)：1-64 字符，字母或数字开头结尾，允许字母、数字、`_`、`-`、`.`；全局唯一 |
| `description` | 非必填；0-256 字符；不能包含控制字符 |
| `instance_pool` | 必填，至少 1 个；`addr` 必填（Hostname）；`port` 1-65535；`weight` 0-100；至少一个 `weight > 0`；表单不填 `name`（未传时服务端默认与 `addr` 相同）；前端按 `addr` 去重 |
| `model_protocols` | 必填，至少 1 个，元素不可重复；首期枚举仅 `openai`、`anthropic`（**不含 `gemini`**） |
| `model_endpoint.schema` | 非必填；默认 `https`；有效值 `http`、`https` |
| `model_endpoint.uri` | 非必填；默认 `/v1/models`；非空且须以 `/` 开头 |
| `models` | 非必填；元素非空且不可重复；可手动维护或调用发现接口回填 |
| `keys` | 非必填，默认 `[]`；`name` 1-128 且同 provider 内唯一；`key` 1-512；**无 weight** |

**接口清单**：

| 方法 | 端点 | 说明 |
| ---- | ---- | ---- |
| `POST` | `/providers` | 创建 |
| `GET` | `/providers` | 列表；Query 带 `page` / `page_size`（默认 50，最大 1000），可带 `model_protocol`；`Data` 为 `{ list, pagination }` |
| `GET` | `/providers/{provider_name}` | 详情 |
| `PATCH` | `/providers/{provider_name}` | 更新；`keys`、`instance_pool` 全量替换 |
| `DELETE` | `/providers/{provider_name}` | 删除；被 cluster 引用时返回 `409`；`/model-prices` 同名记录不阻塞 |
| `POST` | `/providers/{provider_name}/discover-models` | 触发模型发现，回填 `models`；`keys` 为空时 `422` |

### 2.3 实现

**新增文件**（对齐 `ModelPrices` 模块结构）：

- `src/modules/Providers/index.vue`
- `src/modules/Providers/components/ProviderUpsert.vue`
- `src/modules/Providers/components/ProviderView.vue`

**同步修改**：

- `src/router/router.js`：新增 `path: 'providers'`，`name: 'Provider.list'`
- `src/layout/sidebar/navItem.vue`：图标 `Provider.list` / `ProviderManage` → `ivu-icon-ios-cloud`
- `src/i18n/zh.js`、`src/i18n/en.js`：导航与表单文案
- `src/utils/const.js`：新增 `ProviderNameRegCheck`、`maskSecretKey`
- `design-docs/sys-design/OpenAPI消费接口映射.md`：补 `/providers` 映射，删除集群对 `model-provider-types`、`tools/get-models-from-provider` 的消费

**列表页（对照原型 `providers.html`）**：

- 顶部按钮：「添加服务商」
- 列：名称、描述、协议（`model_protocols` join）、模型（`models` join）、操作（详情 / 编辑 / 删除）
- 名称、描述、模型支持搜索；协议列为下拉筛选（选项仅 `openai`、`anthropic`）
- 删除前若被 cluster 引用，提示 409，不可删除

**创建/编辑抽屉（对照 `provider-upsert.js`）**：

1. **基本信息**
   - 名称（必填，创建后不可改）
   - 描述（可选）
2. **实例池**
   - 实例形态：`IP` / `服务商域名`（必填）
   - IP 模式表格列：**IP/域名、端口、权重、操作**（**不要名称列**）
   - 域名模式：只填服务商域名，提交为单实例 `port=443`、`weight=100`
   - 底部「+ 创建」；至少保留一行，删除按钮在仅一行时禁用
3. **模型服务配置**
   - 模型协议：多选下拉，必填，选项 `openai`、`anthropic`
   - 模型列表接口：`schema` 下拉 + 只读 `addr:port`（取首个实例）+ `uri` 输入
   - 模型列表：标签展示；「同步模型」调用 `discover-models`；支持手动添加
4. **服务鉴权 Keys**
   - 列：Key 名称、Key 值、操作
   - 无权重列；「+ 添加 Key」

**详情**（只读卡片，对照原型 `renderDetail`）：

- 基本信息、实例池、模型服务配置、服务鉴权 Keys（Key 值脱敏，如 `sk-a****aaaa`）、创建/更新时间
- 不渲染禁用输入框

**提交注意**：

- 不传 `create_time` / `update_time`
- `instance_pool[].name` 不传（服务端默认等于 `addr`）
- 不再配置 `headers.Authorization`；发现接口认证头由 `model_protocols` 决定

---

## 3. P0：Cluster 去掉实例池，改为引用 Provider

### 3.1 需求

`clusters.md`：创建集群时根据 `llm_config.provider` 自动创建实例池与子集群；OpenAPI **不再暴露** `instance_pool`。返回数据也不再包含实例池。

**原型参考**：`cluster-upsert.js` 步骤为 5 步（无「实例配置」）：

1. 基本配置
2. 超时和重传
3. 被动健康检查
4. 大模型配置
5. 复查&检查

复查页「所属服务商」只读展示该 provider 的实例池（地址 / 端口 / 权重）。

### 3.2 实现

**影响文件**：

- `src/modules/Clusters/components/index.vue`
- `src/modules/Clusters/components/InstancePool.vue`（集群向导内停用；仍被 Provider 模块复用）
- `src/modules/Clusters/components/Review.vue`
- `src/modules/Clusters/index.vue`
- `src/modules/Clusters/components/GatewayConfig.vue`

**具体修改**：

1. **向导去掉 InstancePool 步骤** ✅
   - 当前：BaseConfig → Timeout → PassiveHealthCheck → **InstancePool** → GatewayConfig → Review
   - 改为：BaseConfig → Timeout → PassiveHealthCheck → GatewayConfig → Review
   - 提交 `POST/PATCH /clusters` **不要**带 `instance_pool`
2. **GatewayConfig 不再依赖本集群实例池** ✅
   - 删除 `instancePoolData` 用于拼模型列表 URL、探测 hosts 的逻辑
   - 删除对 `POST tools/get-models-from-provider` 的调用
3. **复查 / 详情** ⚠️ 部分完成
   - 删除本集群「实例 IP 列表 / 服务商域名」编辑结果 ✅
   - 按 `llm_config.provider` 请求 `GET /providers/{name}`，只读展示服务商实例池 ❌ **待补**（原型 `cluster-upsert.js` → `renderReview` 已有，Vue `Review.vue` 尚未实现）
   - 健康检查 Host 为空时文案改为「使用所属服务商首个实例地址」 ✅
4. **详情回显** ✅
   - `Clusters/index.vue` 的 `onDetails` 不再调用 `getClusterInstancePool(tmpData)`
   - 不再读取 `llm_config.model_endpoint.headers`、`llm_config.key`

---

## 4. P0：Cluster LLM 改为引用 Provider

### 4.1 需求

`llm_config` 现为转发策略，不再描述服务商本体。

**接口参考**：`clusters.md` 表：LLM配置  
**原型参考**：`cluster-upsert.js` → `renderGatewayConfig()`

| 字段 | 现网源码 | 目标 |
| ---- | -------- | ---- |
| `provider` | 自由文本「价格关联提供商」 | **必填**下拉，引用已存在 `/providers` |
| `provider_type` | 下拉 `GET model-provider-types` | **删除** |
| `model_endpoint` | 本页配置 schema/uri/headers | **删除**（在 Provider 上） |
| `models` | 探测下游或手选 | 必填；多选；必须是所属 provider `models` 的子集 |
| `keys` | `{ name, key, weight }` 明文 | `{ name, weight }`，`name` 引用 provider.keys |
| `key_policy` | 已有 | 保持；`strategy` 仅 `weighted_random` |
| `match_prefix` / `strip_prefix` | 已有 | 保持；标签改为「匹配前缀」「裁剪前缀」 |

```json
{
  "llm_config": {
    "provider": "deepseek",
    "models": ["deepseek-chat"],
    "model_mappings": [{ "source_model": "gpt-4", "target_model": "deepseek-chat" }],
    "keys": [{ "name": "key-primary", "weight": 100 }],
    "key_policy": {
      "strategy": "weighted_random",
      "max_retries": 0,
      "retry_backoff_initial": 500,
      "retry_backoff_max": 5000
    },
    "match_prefix": "",
    "strip_prefix": false
  }
}
```

### 4.2 接口校验规则

| 字段 | 校验规则 |
| ---- | -------- |
| `provider` | 必填；必须是已存在的 provider |
| `models` | 必填，至少 1 个；每个值必须在该 provider 的 `models` 中 |
| `model_mappings` | 可选；`source_model` 同数组内不重复 |
| `keys` | 可选，默认 `[]`；`name` 必须在 provider.keys 中；同数组 `name` 唯一；`weight` ∈ `[0,100]`；非空时权重之和必须等于 100 |
| `strip_prefix=true` | `match_prefix` 必填且以 `/` 结尾 |

`GET /clusters` 与详情 **不返回 Key 明文**，只返回 `keys[].name` 与 `keys[].weight`。

### 4.3 实现

**影响文件**：

- `src/modules/Clusters/components/GatewayConfig.vue`
- `src/modules/Clusters/components/Review.vue`
- `src/i18n/zh.js`、`src/i18n/en.js`

**GatewayConfig 布局（对照原型「模型服务配置」Card）**：

1. **所属服务商**（必填下拉，`GET /providers`）
2. **转发模型**（多选；选项来自所选 provider 的 `models`；切换服务商时剔除已不存在的模型）
3. **裁剪前缀**开关；开启后显示 **匹配前缀**
4. **模型重定向**表格：保持
5. **Keys 配置**表格：列改为 **服务商 Key**（下拉 provider.keys 的 `name`）+ **权重** + 操作；去掉 Key 值输入
6. **Key 路由策略**：策略 / 最大重试次数 / 初始退避 / 最大退避；保持

**删除**：

- `provider_type` 表单项与 `GET model-provider-types`
- 模型列表接口（schema + host + uri + Header 增删）
- 「获取」探测 `tools/get-models-from-provider`
- Keys 表的「Key 值」列及 `${API_KEY}` / headers 占位逻辑
- 提交时的 `model_endpoint`、`provider_type`、`keys[].key`

**复查页文案**：

| 现网 | 目标 | 状态 |
| ---- | ---- | ---- |
| 模型服务商类型 + 价格关联提供商 | **所属服务商**（仅 `provider`） | ✅ |
| 模型列表接口 / header | 删除 | ✅ |
| 服务鉴权 Keys（含明文） | 仅 Key 名称 + 权重 | ✅ |
| 实例池（本集群） | **服务商实例池**（只读） | ❌ 待补 |

集群列表保持现网列：**名称 / 描述 / 操作**，**不要**增加 Provider 列或 Provider 筛选。`GET /clusters?provider=` 接口可保留，前端列表不消费。

---

## 5. P1：`hash_strategy` 默认值

### 5.1 需求

`clusters.md`：`sticky_sessions.hash_strategy` 默认 `CLIENT_IP_ONLY`。  
原型 `cluster-upsert.js` 已改为该默认。

### 5.2 实现

**影响文件**：`src/modules/Clusters/components/BaseConfig.vue`

- `formData.sticky_sessions.hash_strategy` 初始值由 `CLIENT_ID_ONLY` 改为 `CLIENT_IP_ONLY`
- 下拉选项顺序建议：`CLIENT_IP_ONLY`、`CLIENT_ID_ONLY`、`CLIENT_ID_PREFERED`

超时、健康检查默认值源码已与文档一致（`timeout_conn_serv=50000`、`failnum=3`、`uri=/`、`statuscode=0`），无需再改。

---

## 6. P1：model-prices `prices` 键补齐

### 6.1 需求

`model-prices.md` `prices` 键名枚举比当前前端多 4 项。

**原型**：`mock-data.js` → `modelPriceKeys`

### 6.2 实现

**影响文件**：`src/modules/ModelPrices/components/ModelPriceUpsert.vue` 的 `PRICE_KEY_OPTIONS`

在 `output_cost_per_pixel` 之后插入：

- `output_cost_per_image_low_quality`
- `output_cost_per_image_high_quality`
- `input_cost_per_audio_per_second`
- `input_cost_per_video_per_second`

其余 `mode` / `capabilities` / `supported_parameters` / `limits` 枚举已对齐，不必改。

---

## 7. 导航、文案与映射

### 7.1 路由与菜单

| 项 | 值 |
| -- | -- |
| path | `providers` |
| name | `Provider.list` |
| 菜单位置 | 资源管理：AI网关实例池 → **模型服务商** → AI业务集群 → 模型定价 |
| 导航 i18n | `nav.ProviderManage`：模型服务商 / Model Providers |

菜单树仍由 `GET meta` 下发；前端需保证 `node.id === 'Provider.list'` 能命中路由与图标。

### 7.2 建议新增/调整文案

| key | 中文 | 状态 |
| --- | --- | ---- |
| `nav.ProviderManage` | 模型服务商 | ✅ |
| `provider.name` | 服务商 | ✅ |
| `gatewayConfig.ownedProvider` | 所属服务商 | ✅ |
| `gatewayConfig.forwardModels` | 转发模型 | ✅ |
| `gatewayConfig.modelProtocol` | 模型协议 | ✅ |
| `cluster.healthCheckHostTip` | 为空时使用所属服务商首个实例地址 | ✅ |

`gatewayConfig.modelServiceProvider`、`gatewayConfig.providerTip` 在 i18n 中仍保留，但 `GatewayConfig.vue` 已不再引用；后续可清理。

### 7.3 下线接口

| 旧消费 | 新消费 | 状态 |
| ------ | ------ | ---- |
| `GET model-provider-types` | `GET /providers` | ✅ |
| `POST tools/get-models-from-provider` | `POST /providers/{name}/discover-models`（仅服务商页） | ✅ |

---

## 8. 验收清单

### 8.1 模型服务商

- [x] 菜单「资源管理 → 模型服务商」可进入
- [x] 列表展示名称 / 描述 / 协议 / 模型，协议筛选项仅 `openai`、`anthropic`
- [x] 创建：名称、实例池、模型协议必填；实例表无「名称」列
- [x] 域名模式提交单实例 `port=443`、`weight=100`
- [x] Keys 仅名称+值；「同步模型」调用 `discover-models` 回填模型
- [x] 详情只读、Key 脱敏；编辑回显正确
- [x] 删除被集群引用的 provider 得到 409

### 8.2 集群

- [x] 向导 5 步，无实例池步骤
- [x] 所属服务商下拉来自 `/providers`，必填
- [x] 转发模型为该服务商 models 子集；切换服务商后非法模型被剔除
- [x] Keys 下拉为服务商 key name，提交无明文；权重和为 100
- [x] 提交体无 `instance_pool`、`provider_type`、`model_endpoint`、`keys[].key`
- [ ] 复查展示所属服务商实例池（只读）及 Key 名称+权重（Key 名称+权重 ✅；实例池 ❌）
- [x] 列表保持名称 / 描述 / 操作，无 Provider 列、无 Provider 筛选
- [x] 新建会话保持默认 `CLIENT_IP_ONLY`

### 8.3 模型定价

- [x] 价格对象下拉含上述 4 个新键

---

## 9. 实施记录与待办

### 9.1 待补项

| 项 | 文件 | 说明 |
| -- | ---- | ---- |
| 集群复查/详情展示服务商实例池 | `src/modules/Clusters/components/Review.vue` | 按 `llm_config.provider` 调用 `GET /providers/{name}`，只读展示 `instance_pool`（地址/端口/权重）；对照原型 `cluster-upsert.js` → `renderReview` |

### 9.2 已变更文件清单

**新增**：

| 文件 | 说明 |
| ---- | ---- |
| `src/modules/Providers/index.vue` | 服务商列表 |
| `src/modules/Providers/components/ProviderUpsert.vue` | 创建/编辑 |
| `src/modules/Providers/components/ProviderView.vue` | 详情 |
| `design-docs/api-define/OpenAPI接口定义/providers.md` | 接口定义 |
| `design-docs/prototype-design/pages/providers.html` | 原型页 |
| `design-docs/prototype-design/assets/js/provider-upsert.js` | 原型脚本 |

**修改（前端）**：

| 文件 | 说明 |
| ---- | ---- |
| `src/router/router.js` | 注册 `Provider.list` |
| `src/layout/sidebar/navItem.vue` | 菜单图标 |
| `src/i18n/zh.js`、`src/i18n/en.js` | 文案 |
| `src/utils/const.js` | `ProviderNameRegCheck`、`maskSecretKey` |
| `src/modules/Clusters/components/index.vue` | 5 步向导、提交体格式化 |
| `src/modules/Clusters/components/GatewayConfig.vue` | 引用 Provider |
| `src/modules/Clusters/components/Review.vue` | 复查文案（实例池待补） |
| `src/modules/Clusters/components/BaseConfig.vue` | `CLIENT_IP_ONLY` 默认 |
| `src/modules/Clusters/components/InstancePool.vue` | 抽取为共享组件（Provider 复用） |
| `src/modules/Clusters/index.vue` | 详情不再读实例池 |
| `src/modules/ModelPrices/components/ModelPriceUpsert.vue` | 4 个 price 键 |

**修改（设计文档 / 原型）**：

| 文件 | 说明 |
| ---- | ---- |
| `design-docs/sys-design/OpenAPI消费接口映射.md` | 消费映射 |
| `design-docs/api-define/OpenAPI接口定义/clusters.md` 等 | 接口定义同步 |
| `design-docs/prototype-design/assets/js/cluster-upsert.js` 等 | 原型同步 |

**本地开发（非业务）**：

| 文件 | 说明 |
| ---- | ---- |
| `configs/config.js` | dev 端口 `8085` → `8180` |

### 9.3 关联文档

| 文档 | 说明 |
| ---- | ---- |
| `design-docs/api-define/OpenAPI接口定义/providers.md` | Provider 接口定义 |
| `design-docs/api-define/OpenAPI接口定义/clusters.md` | Cluster 接口变更 |
| 上一轮已完成 | `design-docs/modifications/2026-08-16-ui-optimize/ui-code-changes.md` |
