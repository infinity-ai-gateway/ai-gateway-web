# /tools

## 1. 接口清单

### 1.1 从指定提供商获取AI模型列表

**基本信息**

| 项目 | 值 | 说明 |
| - | - | - |
| 含义 | 根据提供商信息代理拉取AI模型列表 | 用于集群创建前预览可用模型 |
| 端点 | /tools/get-models-from-provider | - |
| 版本 | v1 | - |
| method | POST | - |

**输入参数（Body）**

| 参数名 | 类型 | 参数含义 | 必填 | 补充描述 | 合法性条件 |
| - | - | - | - | - | - |
| schema | string | 请求协议 | Y | 取值为 http、https | 必填；枚举值：`http`、`https` |
| uri | string | 请求URI | N | 路径前面可以有/，也可以无/。例如：/models 或者 models | 为空时默认使用 `/v1/models` |
| hosts | []string | 请求的IP、Port组合或域名 | Y | 支持ipv4、ipv6。ipv4："1.1.1.1:8080"；ipv6："[2001:db8::1]:8080" | 必填；数组长度≥1 |
| headers | map[string]string | 请求的Header参数列表 | N | - | 无 |
| provider_type | string | AI模型提供商类型 | N | 取值如：deepseek、openai、qwen | 为空或不支持时按默认解析逻辑处理；`huoshancodeplan`、`bailiantokenplan` 走静态模型列表 |

**HTTP BODY参数示例**

```json
{
    "schema": "http",
    "uri": "/models",
    "hosts": ["1.1.1.1:8080", "[2001:db8::1]:8080", "www.a.com", "www.b.com:8080"],
    "headers": {
        "Content-type": "application/json"
    },
    "provider_type": "deepseek"
}
```

**返回数据（Data内容）**

Data为数组，每个元素包含模型ID和名称。

| 参数名 | 类型 | 参数含义 |
| - | - | - |
| id | string | 模型ID |
| name | string | 模型名称 |

**成功返回示例**

```json
{
    "ErrNum": 200,
    "ErrMsg": "success",
    "Data": [
        {
            "id": "model1",
            "name": "Model 1"
        }
    ]
}
```

---

