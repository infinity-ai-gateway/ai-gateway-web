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

---

