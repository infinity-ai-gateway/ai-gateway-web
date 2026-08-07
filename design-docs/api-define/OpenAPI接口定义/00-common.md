# 通用说明

# 基本信息

| 项目 | 值 | 说明 |
| - | - | - |
| URL格式 | http://api_server:port/open-api/{ver}/{endpoint}?{arg=value} | 例：http://127.1:8086/open-api/v1/api-keys |
| 版本 | v1 | - |
| 鉴权方式 | Token | HTTP Authorization Header |

# 返回值格式

所有API的返回值格式：

```json
{
    "ErrNum": 200,
    "Data": json_object,
    "ErrMsg": "string message"
}
```

- **ErrNum**: 返回码
  - 200：调用成功
  - 401：鉴权失败
  - 402：没有调用权限造成的失败
  - 404：查询/修改/删除不存在的对象时
  - 409：资源依赖冲突时
  - 422：参数不合法造成的失败
  - 500：其他业务逻辑错误，一律返回500
  - 555：创建重复对象时
  - 556：数据重复时
- **Data**: 返回的数据结构，调用成功时返回json格式数据，失败时返回null
- **ErrMsg**: 文本消息，成功时为"success"或空串，失败时为错误信息

# Method约定

| Method | 含义 |
| - | - |
| GET | 获取一条或多条 |
| POST | 创建 |
| PUT | 全量更新 |
| PATCH | 部分更新 |
| DELETE | 删除 |

# 通用Query参数（列表接口）

| 参数名 | 类型 | 参数含义 | 必填 | 补充描述 | 合法性条件 |
| - | - | - | - | - | - |
| page | int | 页码 | N | 默认1 | 必须 >0，否则使用默认值 1 |
| page_size | int | 每页条数 | N | 默认20，最大100 | 取值范围 1-100，超出时截断为 100 |
| sort_by | string | 排序字段 | N | - | - |
| sort_order | string | 排序方向 | N | asc/desc，默认desc | 仅 `asc`/`desc` 有效，其他值被忽略 |

# 公共参数类型

以下公共类型在多个接口中复用，具体参数合法性条件中通过「类型名」引用即可。

## 1. 主机名（Hostname）

- 须为符合 RFC 1123 的主机名，或有效的 IPv4/IPv6 地址。
- 主机名总长度不超过 255 字符。
- 每个标签（`.` 分隔）长度不超过 63 字符。
- 标签仅允许大小写字母、数字、连字符（`-`）。
- 标签不得以连字符（`-`）开头或结尾。
- **长度须 ≥2 字符（本系统特殊要求，非 RFC 1123 强制）**。

## 2. IP 地址（IP Address）

- 须为符合 RFC 791 的 IPv4 地址，或符合 RFC 8200 的 IPv6 地址。
- **IPv4**：点分十进制，4 段，每段取值 0-255，如 `192.0.2.1`。
- **IPv6**：8 组 16 位十六进制，组间以 `:` 分隔，支持 `::` 压缩，如 `2001:0db8::1`。

## 3. 网络端口（Port）

- 类型为整数（int）。
- 取值范围为 1-65535（IANA 有效端口范围，RFC 793）。

## 4. CIDR 地址（CIDR）

- 须为有效的 IPv4/IPv6 CIDR 表示法，或特殊值 `"*"`（表示不限制）。
- **IPv4 CIDR**：`a.b.c.d/n`，其中 `a.b.c.d` 为有效 IPv4 地址，`n` 取值 0-32，如 `192.0.2.0/24`。
- **IPv6 CIDR**：`a:b:c:d:e:f:g:h/n`，其中 `a:b:c:d:e:f:g:h` 为有效 IPv6 地址，`n` 取值 0-128，如 `2001:0db8::/32`。

## 5. AI 模型名称（AIModel）

- 模型名称字符串，或特殊值 `"*"`（表示匹配所有模型）。
- 非 `"*"` 时，须为系统中某个集群（`/clusters` 的 `llm_config.models`）已配置的模型名称。

## 6. 路由规则（RouteRule）

单个路由规则元素。

| 字段 | 类型 | 必填 | 说明 | 合法性条件 |
|------|------|------|------|------------|
| `name` | string | Y | 规则名称，用于日志和监控 | 必填、非空；在同一组 `route_rules` 内唯一 |
| `Cond` | string | Y | BFE 条件表达式；命中则使用该规则 | 必填、非空；须为合法 BFE 条件表达式 |
| `targets` | array | Y | 转发目标列表 | 必填，至少 1 个元素；每个元素类型见下表 |

`targets` 元素结构：

| 字段 | 类型 | 必填 | 说明 | 合法性条件 |
|------|------|------|------|------------|
| `ClusterName` | string | Y | 后端集群名称 | 必填；类型为 [ClusterName](#15-集群名称clustername)；须为 `/clusters` 中已存在的集群名称 |
| `Model` | string | N | 模型名称；空字符串表示透传原始模型 | 非空时，须为对应集群 `llm_config.models` 中已配置的模型名称 |
| `Weight` | int | Y | 权重 | 取值范围 [0,100]；同一规则内所有 `Weight` 之和必须等于 100 |

`targets` 跨元素约束：

- 同一 `targets` 数组内，`(ClusterName, Model)` 组合不能重复。

示例：

```json
{
  "name": "apikey-default",
  "Cond": "default_t()",
  "targets": [
    {
      "ClusterName": "cluster_apikey",
      "Model": "",
      "Weight": 100
    }
  ]
}
```

## 7. 路由规则集（RouteRules）

一组路由规则配置，由 `enabled` 开关和 `rules` 数组组成。

| 字段 | 类型 | 必填 | 说明 | 合法性条件 |
|------|------|------|------|------------|
| `enabled` | bool | N | 是否启用该组路由规则 | 默认 `false` |
| `rules` | []RouteRule | N | 规则列表 | 每个元素类型为 [RouteRule](#6-路由规则route)；为空表示未配置任何规则 |

示例：

```json
{
  "enabled": true,
  "rules": [
    {
      "name": "apikey-default",
      "Cond": "default_t()",
      "targets": [
        {
          "ClusterName": "cluster_apikey",
          "Model": "",
          "Weight": 100
        }
      ]
    }
  ]
}
```

## 8. 配额计划（QuotaPlan，不含 balance）

配额计划配置。作为输入时无需传入 `balance`，`balance` 为系统返回的只读余额状态。

| 字段 | 类型 | 必填 | 说明 | 合法性条件 |
|------|------|------|------|------------|
| `unlimited` | bool | N | 是否无限配额 | 默认 `true` |
| `pass_when_no_enough_quota` | bool | N | 配额不足时是否放行 | 默认 `false` |
| `quota` | int64 | N | 配额总量 | 非负整数（>=0） |
| `unit` | string | N | 配额单位 | 默认 `total_token`，暂时只支持 `total_token` |
| `reset_period` | string | N | 配额重置周期 | 默认 `never`；可选值：`never`、`weekly`、`monthly` |
| `balance` | object | N | 余额状态（只读），包含 `used` 和 `remaining` | 作为输入时无需传入 |

示例：

```json
{
  "unlimited": false,
  "pass_when_no_enough_quota": false,
  "quota": 100000000,
  "unit": "total_token",
  "reset_period": "monthly",
  "balance": {
    "used": 50000000,
    "remaining": 50000000
  }
}
```

## 9. 限流规则配置（RateLimitPolicy）

限流策略配置，包含 TPM、RPM 和最大并发数限制。

| 字段 | 类型 | 必填 | 说明 | 合法性条件 |
|------|------|------|------|------------|
| `enabled` | bool | N | 是否启用 | 默认 `false` |
| `rules` | object | N | 限流规则详情 | `enabled=true` 时必填，且 `tpm`、`rpm`、`max_concurrency(>=0)` 三者至少配置其一 |

`rules` 结构：

| 字段 | 类型 | 必填 | 说明 | 合法性条件 |
|------|------|------|------|------------|
| `tpm` | []TPMConfig | N | Token 每分钟限制配置 | 最多 3 个；为空不做 tpm 限制；每个元素类型为 [TPMConfig](#10-tpm-限流配置tpmconfig) |
| `rpm` | []RPMConfig | N | 请求每分钟限制配置 | 最多 3 个；为空不做 rpm 限制；每个元素类型为 [RPMConfig](#11-rpm-限流配置rpmconfig) |
| `max_concurrency` | int | N | 最大并发数 | `-1` 表示不限制，否则须为 >=0 的整数 |

`rules` 跨元素约束：

- 同一 `RateLimitPolicy` 内，多条 `TPMConfig` 之间，`(model, window_minutes, max_tokens, step_minutes)` 组合不能重复；
- 同一 `RateLimitPolicy` 内，多条 `RPMConfig` 之间，`(model, window_minutes, max_requests)` 组合不能重复。

示例：

```json
{
  "enabled": true,
  "rules": {
    "tpm": [
      {"name": "1分钟窗口", "model": "*", "window_minutes": 1, "max_tokens": 10000, "step_minutes": 1}
    ],
    "rpm": [
      {"name": "1分钟请求", "model": "*", "window_minutes": 1, "max_requests": 100}
    ],
    "max_concurrency": 50
  }
}
```

## 10. TPM 限流配置（TPMConfig）

Token 每分钟限制配置。

| 字段 | 类型 | 必填 | 说明 | 合法性条件 |
|------|------|------|------|------------|
| `name` | string | Y | 规则名称 | 必填、非空；长度 1-128 字符；同一 `RateLimitPolicy` 内不能重复 |
| `model` | string | N | 适用模型 | 默认 `"*"`；类型为 [AIModel](#5-ai-模型名称aimodel) |
| `window_minutes` | int | Y | 统计时间窗口（分钟） | 取值范围 1-360 |
| `max_tokens` | int | Y | 最大 Token 数 | 非负整数（>=0） |
| `step_minutes` | int | Y | 滑动步长（分钟） | 取值范围 1-360，且必须 <= `window_minutes` |

示例：

```json
{
  "name": "1分钟窗口",
  "model": "*",
  "window_minutes": 1,
  "max_tokens": 10000,
  "step_minutes": 1
}
```

## 11. RPM 限流配置（RPMConfig）

请求每分钟限制配置。

| 字段 | 类型 | 必填 | 说明 | 合法性条件 |
|------|------|------|------|------------|
| `name` | string | Y | 规则名称 | 必填、非空；长度 1-128 字符；同一 `RateLimitPolicy` 内不能重复 |
| `model` | string | N | 适用模型 | 默认 `"*"`；类型为 [AIModel](#5-ai-模型名称aimodel) |
| `window_minutes` | int | Y | 统计时间窗口（分钟） | 取值范围 1-360 |
| `max_requests` | int | Y | 最大请求数 | 非负整数（>=0） |

示例：

```json
{
  "name": "1分钟请求",
  "model": "*",
  "window_minutes": 1,
  "max_requests": 100
}
```

## 12. 用户名（UserName）

用户名字符串，用于 `/auth` 相关接口。

| 字段 | 类型 | 必填 | 说明 | 合法性条件 |
|------|------|------|------|------------|
| - | string | - | 用户名 | 长度 1-64 字符；仅允许字母、数字、`_`、`-`、`.`；不能以 `.`、`-`、`_` 开头或结尾；全局唯一（大小写不敏感）；不能为 `admin`、`root`、`system` 等保留用户名 |

## 13. 用户密码（Password）

用户密码字符串，用于 `/auth` 相关接口。

| 字段 | 类型 | 必填 | 说明 | 合法性条件 |
|------|------|------|------|------------|
| - | string | - | 用户密码 | 长度 8-128 字符；不能包含空白字符；不能等于对应 `user_name` 或其逆序 |

## 14. Token 名称（TokenName）

Token 名称字符串，用于 `/auth/tokens` 相关接口。

| 字段 | 类型 | 必填 | 说明 | 合法性条件 |
|------|------|------|------|------------|
| - | string | - | Token 名称 | 长度 1-64 字符；仅允许字母、数字、`_`、`-`、`.`；不能以 `.`、`-`、`_` 开头或结尾；全局唯一；不能为 `admin`、`system`、`default` 等保留名称；不能包含空白字符 |

## 15. 集群名称（ClusterName）

集群名称字符串，用于 `/clusters` 及路由规则等引用集群的接口。

| 字段 | 类型 | 必填 | 说明 | 合法性条件 |
|------|------|------|------|------------|
| - | string | - | 集群名称 | 长度 1-64 字符；仅允许字母、数字、`_`、`-`、`.`；不能以 `.`、`-`、`_` 开头或结尾；全局唯一；不能包含空白字符 |

## 16. Entity-Type 名称（EntityTypeName）

Entity-Type 名称字符串，用于 `/entity-types` 相关接口。

| 字段 | 类型 | 必填 | 说明 | 合法性条件 |
|------|------|------|------|------------|
| - | string | - | Entity-Type 名称 | 长度 1-32 字符；仅允许小写字母、数字、`_`、`-`；不能以 `-`、`_` 开头或结尾；全局唯一；不能包含空白字符 |


---

