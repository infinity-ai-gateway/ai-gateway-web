# AIInstancePool 模块细节设计

## 1. 模块定位

`AIInstancePool` 管理 AI 网关的全局 ALB（Application Load Balancer）实例池。与其他模块不同，该页面采用**单页内联编辑**模式，而非传统的「列表 + 抽屉」模式。

## 2. 路由与入口

| 路由 | name | 组件 | 说明 |
|------|------|------|------|
| `/instance-pool-ai` | `AIGatewayInstancePool.list` | `modules/AIInstancePool/index.vue` | 实例池查看与编辑。 |

## 3. 页面结构

- 非 `pageTable`，使用自定义原生 HTML `<table>` 展示实例。
- 表格列：`hostname`、`ip/域名`、`Default 端口`、操作（仅编辑态显示）。
- 操作按钮随编辑状态切换：
  - 查看态：「编辑」（绑定 loading）
  - 编辑态：「+ 新增行」（表单底部）、「删除行」（行内）、「提交」、「取消」（底部 footer-actions）
- 全页使用 `Spin size=large fix` 控制加载状态（GET 与 PATCH 期间均置 `loading=true`）。
- 查看态且列表为空时渲染 `colspan=3` 的空数据行。

## 4. 表单字段与校验

每条实例包含以下字段：

| 字段 | 校验 | 说明 |
|------|------|------|
| `hostname` | 必填（非空字符串） | 实例标识。 |
| `ip` | 必填；需通过 `isIP(ip,4)`（IPv4）或 `isIP(ip,6)`（IPv6）或 `isFQDN(ip)` 校验 | 实例地址。 |
| `ports.Default` | 1–65535 整数 | 默认端口。 |
| `tags` | 无 UI 校验，默认 `{key:'value'}` | 隐藏字段，不展示。 |
| `weight` | 无 UI 校验，默认 `1` | 隐藏字段，不展示。 |

### 4.1 集合级校验

- 至少保留 1 条实例（`tmpData.instances.length < 1` 时 `$Message.warning` 提示）。
- `ip:port` 组合不可重复（遍历构造 `ip:port` 放入 Set 检测，命中重复则 `$Message.warning` 提示并 break）。
- 编辑态首次进入空列表时，自动插入一行空实例（`createEmptyInstance`：`hostname:''`，`ports:{Default:80}`，`tags:{key:'value'}`，`ip:''`，`weight:1`）。
- 提交前会删除后端返回的冗余字段（`name`、`epp_server`），仅保留 `{ instances }`。

### 4.2 校验方式

校验未使用 iView Form 的 rules + validate() 机制，而是手动判断 + `$Message`/`$Modal` 提示。

## 5. 数据流

```
mounted → GET /alb-pool → normalizeInstance → 渲染查看态
                                    ↓
                            点击「编辑」进入 isEditing=true
                                    ↓
                            本地增删改实例
                                    ↓
                            提交 → PATCH /alb-pool → 刷新列表
```

- 无 `props` / `$emit` 父子通信；所有状态集中在 `index.vue`。
- `data`：`formData.instances`（实例列表）、`loading`（加载态）、`isEditing`（编辑态开关）、`deleteAble`（删除按钮可用性，`instances.length > 1`）。

## 6. OpenAPI 消费映射

| 组件 | 方法 | 相对 URL | 说明 |
|------|------|----------|------|
| `index.vue` | `GET` | `alb-pool` | 拉取实例池，返回 `res.data.Data`。 |
| `index.vue` | `PATCH` | `alb-pool` | 全量提交实例列表更新，body: `{ instances: [...] }`。 |

> 注：实际代码使用 `PATCH` 更新，与 `OpenAPI消费接口映射.md` 中标注的 `POST` 不一致，以代码实现为准。

## 7. normalizeInstance 字段别名

`normalizeInstance(instance)` 将后端返回的各种大小写/别名形式统一为前端 camelCase 标准结构。先 `cloneDeep(instance || {})` 深拷贝，再逐步回填：

| 源字段（别名） | 目标字段 | 回填条件 |
|------|------|------|
| `instance.Name` | `hostname` | 当 `hostname` 为空时 |
| `instance.Addr` | `ip` | 当 `ip` 为空时 |
| `instance.Hostname`（大写首字母） | `hostname` | 当 `hostname` 仍为空时 |
| `instance.Ports`（对象） | `ports.Default` | 取 `Ports.Default`（大写 D），否则回退 `Ports.default`（小写） |
| `instance.Port`（单数数值） | `ports.Default` | 当 `ports` 不存在或 `Default` 为 null 时，整体置 `{Default: item.Port}` |
| `ports` 缺失/非对象 | `ports` | 兜底为 `{Default: 80}` |
| `ports.Default` 为 null/空 | `ports.Default` | 回退 `ports.default`，再兜底 `80` |
| `tags` 缺失 | `tags` | 设为 `{key:'value'}` |
| `weight` 为 null | `weight` | 设为 `1` |
| `hostname` 为 null | `hostname` | 设为 `''` |
| `ip` 为 null | `ip` | 设为 `''` |

调用点：GET 拉取后对每个 instance map 规范化（`syncFormData`）；提交前对每条规范化并回写（`handleSubmit`）。

## 8. 边界情况

- 后端字段别名兼容：代码中通过 `normalizeInstance` 处理 `Name/Addr/Hostname/Ports/Port` 等多种别名。
- 只有 1 行时，删除按钮被禁用（`deleteAble = instances.length > 1`）。在 `startEdit`、`syncFormData`、`handleRemove`、`handleAdd` 后均更新。
- 取消编辑时调用 `getAlbPool()` 重新拉取原始数据覆盖本地修改。
- 端口输入格式化：`handleNumber(item, key)` 在 `$nextTick` 内 `parseInt` 并 `$set` 回写，保证存数字而非字符串。
- 提交前 `delete tmpData.name; delete tmpData.epp_server`，最终提交 `{ instances: tmpData.instances }`。
