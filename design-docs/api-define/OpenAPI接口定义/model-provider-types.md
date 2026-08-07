# /model-provider-types

## 1. 接口清单

### 1.1 获取AI模型提供商类型列表

**基本信息**

| 项目 | 值 | 说明 |
| - | - | - |
| 含义 | 获取系统支持的AI模型提供商类型列表 | - |
| 端点 | /model-provider-types | - |
| 版本 | v1 | - |
| method | GET | - |

**输入参数（Query）**

无。

**返回数据（Data内容）**

字符串数组，元素为AI模型提供商标识。

**成功返回示例**

```json
{
    "ErrNum": 200,
    "ErrMsg": "success",
    "Data": [
        "deepseek",
        "qwen",
        "openai"
    ]
}
```

---

