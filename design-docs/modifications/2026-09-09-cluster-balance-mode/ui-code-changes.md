# UI 代码变更文档

> **对照接口**：`clusters.md` §1、`epp-pool.md`、`epp-assignments.md`
> **对照原型**：`layout.js`（菜单）、`epp.html`（EPP页面）、`cluster-upsert.js`（均衡模式配置卡片）

---

## 1. 变更总览

| 页面 / 模块 | 变更要点 | 状态 |
| ----------- | -------- | ---- |
| 新增菜单「EPP调度」 | 路由 + 图标 + 模块入口 | 待实现 |
| 新增「EPP 实例池」页面 | 树形表格查看/编辑实例组与实例 | 待实现 |
| 新增「EPP 调度分配」页面 | 分配视图表格 + 手动覆写抽屉 | 待实现 |
| 集群创建/编辑 · 均衡模式配置 | 新增卡片：balance_mode 选择器 + 条件渲染 EPP 配置 | 待实现 |
| 集群创建/编辑 · 数据提交 | 补充 balance_mode、epp_config 字段 | 待实现 |
| 集群编辑 · 数据回填 | 补充 balance_mode、epp_config 读取 | 待实现 |
| 集群复查 | 展示 balance_mode 与 epp_config | 待实现 |
| i18n | 新增 EPP 模块 + 均衡模式配置相关文案 | 待实现 |

---

## 2. 新增菜单「EPP调度」

**原型**：`layout.js` 在「AI业务集群」下方新增 `{ id: 'EppPool.list', page: 'epp.html', text: 'EPP调度' }`

**变更**：

| 项 | 说明 |
| -- | ---- |
| 路由 | `router.js` 新增 `EppPool.list` 路由，指向 EPP 模块 |
| 图标 | `navItem.vue` 新增 `EppPool.list` 图标映射 |
| 菜单 | 菜单由后端 meta 下发，前端无需改动菜单结构 |

**涉及文件**：

| 文件 | 说明 |
| ---- | ---- |
| `src/router/router.js` | 新增 `EppPool.list` 路由 |
| `src/layout/sidebar/navItem.vue` | 新增 `EppPool.list` 图标 |

---

## 3. 新增「EPP 实例池」页面

**原型**：`epp.html` Tab1，树形表格按组展开查看实例，支持编辑模式（编辑/保存/取消，含组名/实例字段输入、添加组/添加实例/删除组/删除实例）

**对照接口**：`epp-pool.md` — GET `/epp-pool` 查看、PATCH `/epp-pool` 全量替换

**变更**：新建 `src/modules/EppPool/` 模块，作为「EPP调度」页面的 Tab1

| 功能 | 说明 |
| ---- | ---- |
| 查看模式 | 树形表格展示组列表，展开行显示组内实例（id/host/port）；顶部显示池名称、组数、实例数统计 |
| 编辑模式 | 点击「编辑」进入行内编辑：组名、实例 id/host/port 可输入；支持添加组、添加实例、删除组、删除实例 |
| 保存/取消 | 保存调用 PATCH `/epp-pool` 全量替换；取消还原原始数据 |

**涉及文件**：

| 文件 | 说明 |
| ---- | ---- |
| `src/modules/EppPool/index.vue` | 新模块入口，含 Tab 切换 |
| `src/modules/EppPool/components/Pool.vue` | 实例池查看/编辑：树形表格 + 统计 + 编辑模式 |
| `src/utils/api.js` | 新增 `getEppPool`、`patchEppPool` 接口 |

---

## 4. 新增「EPP 调度分配」页面

**原型**：`epp.html` Tab2，分配视图表格（集群名称/实例组/主实例/备实例/状态）+ 手动覆写抽屉

**对照接口**：`epp-assignments.md` — GET `/epp-assignments` 分配全量视图、PATCH `/epp-assignments/{cluster}` 手工覆写

**变更**：作为「EPP调度」页面的 Tab2

| 功能 | 说明 |
| ---- | ---- |
| 分配视图表格 | 列：集群名称（可搜索）、实例组、主实例、备实例、状态（正常/降级）；支持排序、分页 |
| 统计汇总 | 已分配集群数、未分配集群数（红色告警）、空闲实例组数 |
| 未分配集群区域 | 以卡片列出未分配集群名，提示降级为 WRR |
| 空闲实例组区域 | 以卡片列出空闲实例组名 |
| 手动覆写 | 点击「编辑」打开抽屉：选择实例组 + 主实例 ID，确认后 PATCH |

**涉及文件**：

| 文件 | 说明 |
| ---- | ---- |
| `src/modules/EppPool/components/Assignments.vue` | 分配视图：表格 + 统计 + 未分配/空闲卡片 + 覆写抽屉 |
| `src/utils/api.js` | 新增 `getEppAssignments`、`patchEppAssignment` 接口 |

---

## 5. 集群创建/编辑 · 均衡模式配置

**原型**：`cluster-upsert.js` — `renderGatewayConfig` 中「均衡模式配置」卡片：顶部 balance_mode 选择器（WRR/EPP），下方 EPP 模式时展示配置项

**对照接口**：`clusters.md` §1 — `balance_mode`（集群顶层字段，WRR/EPP，默认 WRR）、`epp_config`（EPP 时条件必填）

**EPP 配置项详情**：

| 字段 | 类型 | 控件 | 说明 |
| ---- | ---- | ---- | ---- |
| `scheduling_profile` | string | Select | 调度策略：latency-first / balanced / throughput-first |
| `cache_affinity` | string | Select | 缓存亲和性：low / medium / high |
| `prefix_cache_affinity` | bool | Switch | 前缀缓存亲和性 |
| `session_affinity_enabled` | bool | Switch | 会话亲和性 |
| `session_affinity_header` | string | Input | 会话亲和性 Header（会话亲和性启用时展示） |
| `kv_cache_utilization_max` | float | InputNumber | KV 缓存利用率上限 |
| `flow_control` | object | 可折叠卡片 | 流控配置，内嵌：max_requests、queue_ttl、no_endpoint_queue_ttl、enable_eviction |

**变更**：

| 项 | 变更前 | 变更后 |
| -- | ------ | ------ |
| 步骤4 大模型配置 | 无均衡模式相关 UI | 在 Key 亲和性卡片后新增「均衡模式配置」卡片 |
| 卡片标题 | - | `gatewayConfig.balanceModeConfig` |
| 负载均衡模式选择器 | - | 卡片顶部，始终显示，WRR / EPP 两选项 |
| EPP 配置项 | - | 仅 EPP 模式时展示 |

**涉及文件**：

| 文件 | 说明 |
| ---- | ---- |
| `src/modules/Clusters/components/GatewayConfig.vue` | 新增「均衡模式配置」Card；新增 `balanceModeData` prop/data；emit 时附带 |
| `src/modules/Clusters/components/index.vue` | 新增 `balanceModeData` data；`handelData()` 追加 `balance_mode`、`epp_config`；`changeData()` 回填 |
| `src/modules/Clusters/components/Review.vue` | 新增 `balanceModeData` prop；展示 balance_mode 和 epp_config 详情 |
| `src/i18n/zh.js` | `gatewayConfig` 下新增：`balanceModeConfig`、`balanceMode`、`wrr`、`epp`、`schedulingProfile`、`cacheAffinity`、`prefixCacheAffinity`、`sessionAffinity`、`sessionAffinityHeader`、`kvCacheUtilizationMax`、`flowControl`、`maxRequests`、`queueTtl`、`noEndpointQueueTtl`、`enableEviction` |
| `src/i18n/en.js` | 同上，英文翻译 |

---

## 6. 验收清单

- [ ] 侧边栏显示「EPP调度」菜单，点击跳转 EPP 模块
- [ ] EPP 模块 Tab1「EPP 实例池」：查看模式显示组/实例树形表格 + 统计；编辑模式支持增删改组和实例；保存/取消正确
- [ ] EPP 模块 Tab2「EPP 调度分配」：表格展示分配视图、搜索/排序/分页正常；未分配/空闲区域正确显示；手动覆写抽屉可正常选组/选实例并确认
- [ ] 集群创建/编辑步骤4 展示「均衡模式配置」卡片，顶部 WRR/EPP 选择器默认 WRR
- [ ] WRR 模式下不展示 EPP 配置项
- [ ] EPP 模式下展示全部配置项，数据类型正确（select/switch/数字输入/可折叠卡片）
- [ ] 模式切换 WRR↔EPP 时 EPP 配置项正确显隐，切换不丢失已填配置
- [ ] 创建集群提交时 API payload 包含 `balance_mode` 和 `epp_config`
- [ ] 编辑集群回填时正确读取 `balance_mode` 和 `epp_config`
- [ ] Review 步骤正确展示 `balance_mode` 和 `epp_config` 值
- [ ] `npm run lint` 通过
