# UI 代码变更文档

> **对照接口**：`operation-logs.md`（v0.0.9 新增）
> **前置**：[2026-08-28](../2026-08-28-patch-no-name/ui-code-changes.md)

## 变更总览

| 页面 | 变更要点 |
|------|----------|
| 操作日志列表页 | 新增页面：时间筛选 + 分页表格 + 详情弹框 |

## 需新增文件

| 文件 | 说明 |
|------|------|
| `src/modules/OperationLogs/index.vue` | 操作日志列表页 |

## 需修改文件

| 文件 | 说明 |
| ------ | ------ |
| `src/router/router.js` | 新增路由 `OperationLog.list`，path: `operation-logs` |
| `src/layout/sidebar/navItem.vue` | 新增图标 `OperationLog.list: 'ivu-icon-md-list-box'` |
| `src/i18n/zh.js` | 新增 `nav.OperationLogManage: '操作日志'` + `operationLogs` 条目 |
| `src/i18n/en.js` | 新增 `nav.OperationLogManage: 'Operation Logs'` + `operationLogs` 条目 |

## 页面设计

### 列表页

- 筛选栏：起始时间 + 结束时间（datetime 输入）+ 查询按钮
- 表格列：操作人 | 操作动作(Tag) | 资源类型 | 资源名称 | 结果(Tag) | 操作时间 | 操作(详情按钮)
- 表格搜索：操作人(模糊)、操作动作(下拉)、资源类型(下拉)、资源名称(模糊)、结果(下拉)

### 详情弹框（右侧滑出 720px）

- 标题：**日志详情**（不展示日志 id）

字段每行两项，按接口返回顺序排列（不展示 id/log_id/operator_id），操作时间在最后：

1. 操作者类型 | 操作人
2. 操作动作 | 资源类型
3. 资源ID | 资源名称
4. 父级资源ID | 结果
5. 错误信息（条件展示）
6. 变更摘要（条件展示）：变更前/变更后可折叠 + 差异字段
7. 请求路径 | 请求方式
8. 客户端IP | User-Agent
9. 操作时间

> 变更摘要的 before/after 使用 vue-json-viewer 插件实现可折叠 JSON 展示。

## 验收清单

- [ ] 列表页筛选、搜索、分页正常
- [ ] 详情弹框字段与原型一致
- [ ] 变更摘要可折叠展开
- [ ] 路由、导航、i18n 配置完整
- [ ] `npm run lint` 通过
