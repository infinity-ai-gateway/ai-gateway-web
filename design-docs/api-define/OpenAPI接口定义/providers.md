# /providers

## 1. 数据模型

```json
{
    "name": "deepseek",
    "description": "DeepSeek 官方 API",
    "model_endpoint": {
        "schema": "https",
        "uri": "/v1/models"
    },
    "models": ["deepseek-chat", "deepseek-coder"],
    "keys": [
        {
            "name": "key-primary",
            "key": "sk-aaaaaaaaaaaa"
        },
        {
            "name": "key-secondary",
            "key": "sk-bbbbbbbbbbbb"
        }
    ],
    "instance_pool": [
        {
            "name": "backend-1",
            "addr": "api.deepseek.com",
            "weight": 100,
            "port": 443
        }
    ],
    "model_protocols": ["openai"],
    "create_time": 1716883200,
    "update_time": 1716883200
}
```

**字段说明**

| 字段 | 类型 | 说明 | 可能取值 | 合法性条件 |
|------|------|------|----------|----------|
| `name` | string | Provider 唯一标识 | 全局唯一 | 必填；类型为 [ProviderName](./00-common.md#17-provider-名称providername)；合法命名参考 [ClusterName](./00-common.md#15-集群名称clustername) |
| `description` | string | Provider 描述信息 | - | 非必填；若传入，长度 0-256 字符；不能包含控制字符 |
| `model_endpoint` | object | 模型发现端点 | 用于调用第三方 AI 模型提供商的模型列表接口 | 非必填；未设置时默认 `schema=https`、`uri=/v1/models`；具体字段见下方 表：Endpoint |
| `models` | []string | 该 provider 支持的模型列表 | - | 非必填；元素非空且不可重复；可通过模型发现接口自动填充 |
| `keys` | []ProviderKey | 该 provider 可用的 API Key 明文 | - | 非必填；默认空数组 `[]`；元素须满足 表：ProviderKey 结构 |
| `instance_pool` | []Instance | Provider 对应的后端实例池 | 系统自动据此创建实例池和子集群 | 必填；至少 1 个元素；同一 provider 内，对于 `name` 不为空的实例，`name` 不能重复；同一 provider 内 `(name, addr, port)` 组合不能重复；至少有一个实例 `weight > 0` |
| `model_protocols` | []string | 支持的模型访问协议 | 首期枚举：`openai`、`anthropic` | 必填；至少 1 个元素；元素不可重复；枚举值见下方 |
| `create_time` | int64 | 创建时间 | - | 系统生成 |
| `update_time` | int64 | 更新时间 | - | 系统生成 |

**表：Endpoint（`model_endpoint`）**

| 参数名 | 类型 |参数含义 | 必填 | 补充描述 | 合法性条件 |
| - | -  | - | - | - | - |
| schema| string |  请求协议 | N |  取值为 http、https；**默认值为 https** | 非必填；默认值为 `https`；有效值 `http`、`https` |
| uri| string |  请求URI | N |  **默认值为 `/v1/models`** | 非必填；默认值为 `/v1/models`；非空；须以 `/` 开头 |

> **说明**：不再允许配置 `headers.Authorization`。系统根据 `model_protocols` 自动决定调用模型发现接口时使用的认证头风格（如 `openai` 用 `Authorization: Bearer`，`anthropic` 用 `x-api-key`）。

**表：ProviderKey 结构（`keys` 元素）**

| 参数名 | 类型 |参数含义 | 必填 | 补充描述 | 合法性条件 |
| - | -  | - | - | - | - |
| name | string | Key 名称/标识 | Y | 用于日志、监控、运维识别；在 `/clusters` 中通过该 name 引用 | 必填；长度 1-128 字符；同一 provider 内唯一 |
| key | string | API-Key 值 | Y | 实际用于后端认证的密钥 | 必填；非空；长度 1-512 字符 |

**表：Instance 结构（`instance_pool` 元素）**

| 参数名 | 类型 |参数含义 | 必填 | 补充描述 | 合法性条件 |
| - | -  | - | - | - | - |
| name | string | 实例名称 | N | 未传入时默认与 `addr` 相同 | 选填；若传入，长度 1-128 字符 |
| addr | string | 实例地址 | Y | 无 DNS 时可填写 IP 地址 | 必填；类型为 [Hostname](./00-common.md#1-主机名hostname) |
| weight | int | 实例权重，范围 [0,100] | Y | | 必填；取值范围 [0,100]；`0` 表示该实例不接收流量 |
| port | int | 实例端口 | Y | | 必填；类型为 [Port](./00-common.md#3-网络端口port) |

**`model_protocols` 枚举（首期）**

| 枚举值 | 说明 |
|--------|------|
| `openai` | OpenAI 兼容协议（含大多数国产兼容平台） |
| `anthropic` | Anthropic Claude Messages API |

> 一个 provider 可同时支持多种协议（如聚合平台），但 `model_protocols` 至少包含一个。

## 2. 接口清单

### 2.1 创建 Provider

**基本信息**

| 项目 | 值 | 说明 |
| - | - | - |
| 含义 | 创建 Provider | - |
| 端点 | /providers | - |
| 版本 | v1 | - |
| method | POST | - |

**输入参数（Body）**

字段同 [1. 数据模型](#1-数据模型)，但请求体中无需传入 `create_time`、`update_time`。

**HTTP BODY 参数示例**

```json
{
    "name": "deepseek",
    "description": "DeepSeek 官方 API",
    "model_endpoint": {
        "schema": "https",
        "uri": "/v1/models"
    },
    "models": ["deepseek-chat", "deepseek-coder"],
    "keys": [
        {
            "name": "key-primary",
            "key": "sk-aaaaaaaaaaaa"
        },
        {
            "name": "key-secondary",
            "key": "sk-bbbbbbbbbbbb"
        }
    ],
    "instance_pool": [
        {
            "name": "backend-1",
            "addr": "api.deepseek.com",
            "weight": 100,
            "port": 443
        }
    ],
    "model_protocols": ["openai"]
}
```

**执行逻辑**

1. 校验 `name` 全局唯一、`instance_pool` 合法、`model_protocols` 合法。
2. 若未传 `model_endpoint`，使用默认值 `{schema: "https", uri: "/v1/models"}`。
3. 若未传 `keys`，默认空数组。
4. 若请求中携带 `models` 且非空，直接保存；否则可在创建后调用 `/providers/tools/discover-models` 接口探测模型列表，再回填到 provider。
5. 写入 provider 记录，返回完整对象。

**返回数据（Data内容）**

字段同 [1. 数据模型](#1-数据模型)，包含系统生成的 `create_time`、`update_time`。

**成功返回示例**

```json
{
    "ErrNum": 200,
    "ErrMsg": "success",
    "Data": {
        "name": "deepseek",
        "description": "DeepSeek 官方 API",
        "model_endpoint": {
            "schema": "https",
            "uri": "/v1/models"
        },
        "models": ["deepseek-chat", "deepseek-coder"],
        "keys": [
            {"name": "key-primary", "key": "sk-aaaaaaaaaaaa"},
            {"name": "key-secondary", "key": "sk-bbbbbbbbbbbb"}
        ],
        "instance_pool": [
            {"name": "backend-1", "addr": "api.deepseek.com", "weight": 100, "port": 443}
        ],
        "model_protocols": ["openai"],
        "create_time": 1716883200,
        "update_time": 1716883200
    }
}
```

### 2.2 Provider 列表

**基本信息**

| 项目 | 值 | 说明 |
| - | - | - |
| 含义 | 所有 Provider 列表 | - |
| 端点 | /providers | - |
| 版本 | v1 | - |
| method | GET | - |

**输入参数（Query）**

通用列表参数见 [00-common.md](./00-common.md#通用query参数列表接口)。

| 参数名 | 类型 | 参数含义 | 必填 | 补充描述 | 合法性条件 |
| - | - | - | - | - | - |
| model_protocol | string | 按协议过滤 | N | - | 须为 `model_protocols` 枚举值 |

**返回数据（Data内容）**

数组，单元素同创建接口。

### 2.3 Provider 详情

**基本信息**

| 项目 | 值 | 说明 |
| - | - | - |
| 含义 | 单个 Provider 详情 | - |
| 端点 | /providers/{provider_name} | - |
| 版本 | v1 | - |
| method | GET | - |

**输入参数（URI）**

| 参数名 | 类型 | 参数含义 | 必填 | 补充描述 | 合法性条件 |
| - | - | - | - | - | - |
| provider_name | string | Provider 名字 | Y | - | 必填；类型为 [ProviderName](./00-common.md#17-provider-名称providername)；必须引用已存在的 provider |

**返回数据（Data内容）**

同创建接口。

### 2.4 更新 Provider

**基本信息**

| 项目 | 值 | 说明 |
| - | - | - |
| 含义 | 更新 Provider 基本信息 | 可编辑描述信息、模型端点、模型列表、Key、实例池、协议等 |
| 端点 | /providers/{provider_name} | - |
| 版本 | v1 | - |
| method | PATCH | - |

**输入参数（URI）**

| 参数名 | 类型 | 参数含义 | 必填 | 补充描述 | 合法性条件 |
| - | - | - | - | - | - |
| provider_name | string | Provider 名字 | Y | - | 必填；类型为 [ProviderName](./00-common.md#17-provider-名称providername)；必须引用已存在的 provider |

**输入参数（Body）**

可修改字段含义同创建接口。若传入 `instance_pool` 字段，系统会自动同步更新被引用该 provider 的所有 cluster 所生成的实例池。

> **注意**：`keys` 作为数组，按**全量替换**处理，即调用方需传入完整的最新 Key 列表。Key 的 `name` 变更会影响所有引用该 provider 的 cluster。

**HTTP BODY 参数示例**

```json
{
    "description": "更新后的描述",
    "models": ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"],
    "keys": [
        {"name": "key-primary", "key": "sk-aaaaaaaaaaaa"},
        {"name": "key-secondary", "key": "sk-bbbbbbbbbbbb"},
        {"name": "key-tertiary", "key": "sk-cccccccccccc"}
    ],
    "instance_pool": [
        {"name": "backend-1", "addr": "api.deepseek.com", "weight": 100, "port": 443}
    ],
    "model_protocols": ["openai"]
}
```

**返回数据（Data内容）**

同创建接口。

### 2.5 删除 Provider

**基本信息**

| 项目 | 值 | 说明 |
| - | - | - |
| 含义 | 删除 Provider | - |
| 端点 | /providers/{provider_name} | - |
| 版本 | v1 | - |
| method | DELETE | - |

**输入参数（URI）**

| 参数名 | 类型 | 参数含义 | 必填 | 补充描述 | 合法性条件 |
| - | - | - | - | - | - |
| provider_name | string | Provider 名字 | Y | - | 必填；类型为 [ProviderName](./00-common.md#17-provider-名称providername)；必须引用已存在的 provider |

**执行逻辑**

1. 校验该 provider 未被任何 `/clusters` 引用；若被引用，返回 `409 Conflict`。
2. 删除 provider。 `/model-prices` 中的同名 `provider` 不再作为阻塞条件。

**返回数据（Data内容）**

Data 为 null。

### 2.6 触发模型发现

**基本信息**

| 项目 | 值 | 说明 |
| - | - | - |
| 含义 | 触发模型发现，返回模型名列表 | - |
| 端点 | /providers/tools/discover-models | - |
| 版本 | v1 | - |
| method | POST | - |

**输入参数（Body）**

| 参数名 | 类型 | 参数含义 | 必填 | 补充描述 | 合法性条件 |
| - | - | - | - | - | - |
| model_protocol | string | 模型访问协议 | Y | - | 必填；枚举值：`openai`、`anthropic` |
| schema | string | 请求协议 | Y | - | 必填；有效值 `http`、`https` |
| addr | string | 目标实例地址 | Y | - | 必填；类型为 [Hostname](./00-common.md#1-主机名hostname) |
| port | int | 目标实例端口 | Y | - | 必填；类型为 [Port](./00-common.md#3-网络端口port) |
| `uri` | string | 模型列表接口 URI | N | 为空时默认使用 `/v1/models` | 非空时须以 `/` 开头 |
| `apikey` | string | 调用模型列表接口的 API Key | N | - | 非空时长度 1-512 字符 |

**执行逻辑**

1. 若 `uri` 为空，默认使用 `/v1/models`；构造请求 URL：`{schema}://{addr}:{port}{uri}`。
2. 若 `apikey` 非空，根据 `model_protocol` 生成认证头：
   - `openai`：`Authorization: Bearer {apikey}`
   - `anthropic`：`x-api-key: {apikey}`
3. 携带认证头（若有）调用第三方模型列表接口。
4. 根据 `model_protocol` 选择对应的响应解析器（如 `openai`、`anthropic`），提取模型名列表。
5. 返回模型名列表。

> **说明**：本接口为无状态工具接口，不读写任何 Provider 资源；如需将发现结果回填到 Provider，调用方需再调用 `PATCH /providers/{provider_name}`。

**返回数据（Data内容）**

| 参数名 | 类型 | 参数含义 |
| - | -  | - |
| models | []string | 发现到的模型名列表 |

**成功返回示例**

```json
{
    "ErrNum": 200,
    "ErrMsg": "success",
    "Data": {
        "models": ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"]
    }
}
```

### 2.7 获取所有 Provider 名称列表

**基本信息**

| 项目 | 值 | 说明 |
| - | - | - |
| 含义 | 获取所有 Provider 名称列表 | 用于需要全量 provider 名称的场景，如下拉选择、自动补全 |
| 端点 | /providers/actions/get-provider-names | - |
| 版本 | v1 | - |
| method | GET | - |

**输入参数**

无。

**执行逻辑**

1. 查询所有 provider 的 `name` 字段。
2. 返回按字典序升序排列的名称列表。

> **说明**：本接口不返回 Provider 其他字段，仅用于获取全量名称；详细数据仍通过 `GET /providers` 分页查询。

**返回数据（Data内容）**

| 参数名 | 类型 | 参数含义 |
| - | -  | - |
| names | []string | 所有 Provider 名称列表 |

**成功返回示例**

```json
{
    "ErrNum": 200,
    "ErrMsg": "success",
    "Data": {
        "names": ["anthropic", "deepseek", "openai"]
    }
}
```

## 3. 校验规则

1. `name` 必填，类型为 [ProviderName](./00-common.md#17-provider-名称providername)，全局唯一。
2. `description` 可选；若传入，长度 0-256 字符，不能包含控制字符。
3. `instance_pool` 必填，至少包含 1 个实例；同一 provider 内，对于 `name` 不为空的实例，`name` 不能重复；同一 provider 内 `(name, addr, port)` 组合不能重复；至少有一个实例 `weight > 0`。
4. 每个实例的 `name` 选填，若传入长度须为 1-128 字符，未传入时默认与 `addr` 相同；`addr` 必填且类型为 [Hostname](./00-common.md#1-主机名hostname)；`weight` 取值范围 [0,100]；`port` 必填且类型为 [Port](./00-common.md#3-网络端口port)。
5. `model_endpoint.schema` 有效值为 `http`、`https`，未设置时默认 `https`；`uri` 非空且须以 `/` 开头。
6. `models` 元素非空且不可重复。
7. `keys` 非必填，默认空数组 `[]`；若非空：
   - 每个元素 `name` 必填，长度 1-128，同一 provider 内唯一；
   - 每个元素 `key` 必填且非空，长度 1-512。
8. `model_protocols` 必填，至少 1 个元素，元素不可重复，取值须为枚举值：`openai`、`anthropic`。
9. 删除 provider 前，须校验无 cluster 引用，否则返回 `409 Conflict`；`/model-prices` 记录不再作为阻塞条件。
10. 触发模型发现时，`model_protocol`、`schema`、`addr`、`port` 为必填，`uri` 和 `apikey` 为选填；各参数须满足对应合法性条件；`model_protocol` 不在枚举值范围内时返回 `422`。
