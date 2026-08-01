# /route-tables

## 1. 数据模型

```json
{
  "type": "global",
  "owner": "global",
  "enabled": true
}
```

**字段说明**

| 字段 | 类型 | 说明 | 可能取值 |
|------|------|------|----------|
| `type` | string | 路由表类型 | `global`（全局路由表）、`entity`（Entity路由表）、`api_key`（API-Key路由表） |
| `owner` | string | 所有者标识 | `global` 类型固定为 `global`；`entity` 类型为 `entity_id`；`api_key` 类型为 `apikey_id` |
| `enabled` | bool | 是否启用该路由表 | `true`（启用）、`false`（停用） |

---

## 2. 接口清单

### 2.1 查询路由表列表

**基本信息**

| 项目 | 值 | 说明 |
| - | - | - |
| 含义 | 查询路由表列表 | - |
| 端点 | /route-tables | - |
| 版本 | v1 | - |
| method | GET | - |

**输入参数（Query）**

| 参数名 | 类型 | 参数含义 | 必填 | 补充描述 | 合法性条件 |
| - | - | - | - | - | - |
| page | int | 页码 | N | 默认1 | 非必填；必须 >0，≤0 时使用默认值1 |
| page_size | int | 每页条数 | N | 默认20，最大100 | 非必填；必须 >0，>100 时截断为100 |
| sort_by | string | 排序字段 | N | - | 非必填 |
| sort_order | string | 排序方向 | N | asc/desc，默认desc | 非必填；仅 `asc`/`desc` 有效，其他值被忽略 |
| type | string | 按路由表类型过滤 | N | 可选值：`global`、`entity`、`api_key` | 非必填；空字符串会被忽略；有效值 `global`、`entity`、`api_key` |
| owner | string | 按所有者标识过滤 | N | 支持精确匹配 | 非必填；空字符串会被忽略 |
| enabled | bool | 按启用状态过滤 | N | - | 非必填 |

**返回数据（Data内容）**

Data为数组，元素字段同第1节数据模型。

**成功返回示例**

```json
{
    "ErrNum": 200,
    "ErrMsg": "success",
    "Data": {
        "list": [
            {
                "type": "global",
                "owner": "global",
                "enabled": true
            },
            {
                "type": "entity",
                "owner": "ent-001",
                "enabled": false
            },
            {
                "type": "api_key",
                "owner": "apikey-001",
                "enabled": true
            }
        ],
        "pagination": {
            "page": 1,
            "page_size": 20,
            "total": 3
        }
    }
}
```

---


---

