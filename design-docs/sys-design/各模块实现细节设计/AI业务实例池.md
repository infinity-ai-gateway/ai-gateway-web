# AIInstancePool 模块细节设计

## 1. 模块定位

`AIInstancePool` 管理 AI 网关的全局 ALB（Application Load Balancer）实例池。与其他模块不同，该页面采用**单页内联编辑**模式，而非传统的「列表 + 抽屉」模式。

## 2. 路由与入口

| 路由 | name | 组件 | 说明 |
|------|------|------|------|
| `/instance-pool-ai` | `AIGatewayInstancePool.list` | `modules/AIInstancePool/index.vue` | 实例池查看与编辑。 |

## 3. 页面结构

- 非 `pageTable`，使用自定义 HTML 表格展示实例。
- 表格列：`hostname`、`ip/域名`、`Default 端口`。
- 操作按钮随编辑状态切换：
  - 查看态：「编辑」
  - 编辑态：「新增行」、「删除行」、「提交」、「取消」
- 全页使用 `Spin` 控制加载状态。

## 4. 表单字段与校验

每条实例包含以下字段：

| 字段 | 校验 | 说明 |
|------|------|------|
| `hostname` | 必填 | 实例标识。 |
| `ip` | 必填，支持 IPv4 / IPv6 / FQDN | 实例地址。 |
| `ports.Default` | 1–65535 | 默认端口。 |

### 4.1 集合级校验

- 至少保留 1 条实例。
- `ip:port` 组合不可重复。
- 编辑态首次进入空列表时，自动插入一行空实例。
- 提交前会删除后端返回的冗余字段（如 `name`、`epp_server`），仅保留 `{ instances }`。

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

## 6. OpenAPI 消费映射

| 组件 | 方法 | 相对 URL | 说明 |
|------|------|----------|------|
| `index.vue` | `GET` | `alb-pool` | 拉取实例池。 |
| `index.vue` | `PATCH` | `alb-pool` | 提交实例列表更新。 |

> 注：实际代码使用 `PATCH` 更新，与 `OpenAPI消费接口映射.md` 中标注的 `POST` 不一致，以代码实现为准。

## 7. 边界情况

- 后端字段别名兼容：代码中通过 `normalizeInstance` 处理 `Name/Addr/Hostname/Ports/Port` 等多种别名。
- 只有 1 行时，删除按钮被禁用（`deleteAble`）。
- 取消编辑时恢复原始数据。
