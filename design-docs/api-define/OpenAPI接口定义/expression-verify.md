# /expression/verify

## 1. 接口清单

### 1.1 校验路由表达式

**基本信息**

| 项目 | 值 | 说明 |
| - | - | - |
| 含义 | 校验BFE路由表达式合法性 | - |
| 端点 | /expression/verify | - |
| 版本 | v1 | - |
| method | PATCH | - |
| 鉴权 | `FeatureRoute + ActionRead` | - |

**输入参数（Body）**

| 参数名 | 类型 | 参数含义 | 必填 | 补充描述 | 合法性条件 |
| - | - | - | - | - | - |
| expression | string | 待校验的表达式 | Y | - | 必填；长度≥1；需为合法的BFE路由表达式 |

**返回数据（Data内容）**

- 校验成功：返回`null`；
- 校验失败：返回`VerifyResult`。

| 参数名 | 类型 | 参数含义 |
| - | - | - |
| code | int | 错误码，固定500 |
| message | string | 错误信息 |

**示例**

- 校验 `default_t()`：

```json
{
    "expression": "default_t()"
}
```

- 校验基于请求体大小的路由条件：

```json
{
    "expression": "req_body_larger_than(8192)"
}
```

```json
{
    "expression": "req_body_less_than(2048)"
}
```

```json
{
    "expression": "req_host_in(\"api.example.com\") && req_body_larger_than(8192)"
}
```

> 说明：`req_body_larger_than` / `req_body_less_than` 基于 HTTP `Content-Length` 头判断请求体字节数，单位：字节；无 `Content-Length` 时该条件不匹配。

---

