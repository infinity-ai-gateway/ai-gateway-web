# /alb-pool

## 1. 数据模型

```json
{
  "name": "BFE.aipool",
  "instances": [
    {
      "hostname": "127.0.0.1",
      "ip": "127.0.0.1",
      "weight": 1,
      "ports": {
        "Default": 8080
      }
    }
  ]
}
```

**字段说明**

| 字段 | 类型 | 说明 | 可能取值 | 合法性条件 |
|------|------|------|----------|----------|
| `name` | string | 实例池完整名称 | 如 `BFE.aipool` | 请求中无需传入，由配置项 `DefaultAIInstancePoolName` 提供 |
| `instances` | []Instance | 实例列表 | - | 必填；至少1个元素；元素须满足 Instance 结构约束 |

**Instance 结构**

| 字段 | 类型 | 说明 | 可能取值 | 合法性条件 |
|------|------|------|----------|----------|
| `hostname` | string | 实例所在主机名 | 无 DNS 时可填写 IP 地址 | 必填；类型为 [Hostname](./00-common.md#公共参数类型) |
| `ip` | string | 实例 IP 地址 | - | 必填；类型为 [IP Address](./00-common.md#公共参数类型) |
| `weight` | int | 实例权重 | 范围 [0,100] | 必填；取值范围 [0,100]；为0时后端按默认值1处理 |
| `ports` | map[string]int | 实例端口 | 至少包含 `Default` 端口 | 必填；map 至少1个元素；必须包含 `Default` 端口；每个端口值类型为 [Port](./00-common.md#公共参数类型) |

**约束**

- 实例池名称由配置项 `DefaultAIInstancePoolName` 提供，请求中无需传入 `name`。
- `instances` 至少包含1个元素。
- 每个实例的 `hostname` 必填，类型为 [Hostname](./00-common.md#公共参数类型)。
- 每个实例的 `ip` 必填，类型为 [IP Address](./00-common.md#公共参数类型)。
- 每个实例的 `weight` 取值范围 [0,100]；为0时后端按默认值1处理。
- 每个实例的 `ports` 必填，map 至少1个元素，必须包含 `Default` 端口；每个端口值类型为 [Port](./00-common.md#公共参数类型)。

## 2. 接口清单

### 2.1 获取默认 AI 网关实例池详情

**基本信息**

| 项目 | 值 | 说明 |
| - | - | - |
| 含义 | 获取默认 AI 网关实例池的详情 | - |
| 端点 | /alb-pool | - |
| 版本 | v1 | - |
| method | GET | - |

**输入参数（Query）**

无。

**执行逻辑**

1. 从配置文件 `RunTime` 中读取 `DefaultAIInstancePoolName`（默认值：`BFE.aipool`）。
2. 查询实例池，若不存在则返回错误。
3. 返回实例池详情（包含实例列表）。

**返回数据（Data内容）**

字段同 [1. 数据模型](#1-数据模型)。

**成功返回示例**

```json
{
    "ErrNum": 200,
    "ErrMsg": "success",
    "Data": {
        "name": "BFE.aipool",
        "instances": [
            {
                "hostname": "127.0.0.1",
                "ip": "127.0.0.1",
                "weight": 1,
                "ports": {
                    "Default": 8080
                }
            }
        ]
    }
}
```

### 2.2 更新默认 AI 网关实例池

**基本信息**

| 项目 | 值 | 说明 |
| - | - | - |
| 含义 | 全量更新默认 AI 网关实例池的实例列表 | 该更新是全量更新，不支持仅添加部分数据 |
| 端点 | /alb-pool | - |
| 版本 | v1 | - |
| method | PATCH | - |

**输入参数（Body）**

| 参数名 | 类型 | 参数含义 | 必填 | 补充描述 | 合法性条件 |
| - | - | - | - | - | - |
| instances | []Instance | 实例列表 | Y | 全量替换当前实例池中的实例 | 必填；数组至少1个元素 |
| instances[].hostname | string | 实例所在主机名 | Y | 无 DNS 时可填写 IP 地址 | 必填；类型为 [Hostname](./00-common.md#公共参数类型) |
| instances[].ip | string | 实例 IP 地址 | Y | - | 必填；类型为 [IP Address](./00-common.md#公共参数类型) |
| instances[].weight | int | 实例权重 | Y | 范围 [0,100] | 必填；取值范围 [0,100]；为0时后端按默认值1处理 |
| instances[].ports | map[string]int | 实例端口 | Y | 至少包含 `Default` 端口 | 必填；map 至少1个元素；必须包含 `Default` 端口；每个端口值类型为 [Port](./00-common.md#公共参数类型) |

**约束**

- 实例池名称由配置项 `DefaultAIInstancePoolName` 提供，请求中无需传入 `name`。
- `instances` 至少包含1个元素。
- 每个实例的 `hostname` 必填，类型为 [Hostname](./00-common.md#公共参数类型)。
- 每个实例的 `ip` 必填，类型为 [IP Address](./00-common.md#公共参数类型)。
- 每个实例的 `weight` 取值范围 [0,100]；为0时后端按默认值1处理。
- 每个实例的 `ports` 必填，map 至少1个元素，必须包含 `Default` 端口；每个端口值类型为 [Port](./00-common.md#公共参数类型)。

**HTTP BODY参数示例**

```json
{
    "instances": [
        {
            "hostname": "127.0.0.1",
            "ip": "127.0.0.1",
            "weight": 1,
            "ports": {
                "Default": 8080
            }
        }
    ]
}
```

**执行逻辑**

1. 校验请求参数合法性。
2. 使用配置项 `DefaultAIInstancePoolName` 定位默认 AI 网关实例池。
3. 全量替换实例池中的实例列表。
4. 返回更新后的实例池详情。

**返回数据（Data内容）**

同 [2.1 获取默认 AI 网关实例池详情](#21-获取默认-ai-网关实例池详情)。

**成功返回示例**

同 [2.1 获取默认 AI 网关实例池详情](#21-获取默认-ai-网关实例池详情)。

---
