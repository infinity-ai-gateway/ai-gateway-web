# design-docs 使用说明

本目录用于集中管理 `ai-gateway-web` 的设计文档与代码变更流程。所有代码变更都应遵循以下方法，确保设计文档与代码实现保持一致。

---

## 目录结构

```
design-docs/
├── README.md                              # 本文件：变更方法论与目录索引
├── api-define/                            # 前端消费接口约定
│   └── OpenAPI接口定义/                   # 按模块拆分的 OpenAPI 约定（含 certificates、operation-logs、model-prices 等）
├── prototype-design/                      # 原型设计资产（可选参考）
├── modifications/                         # 复杂变更的临时说明目录（按需创建，如 2026-09-03-ui-optimize/）
└── sys-design/                            # 系统设计文档
    ├── summary.md                         # 系统设计文档索引（本目录导读）
    ├── 总体设计文档.md                     # 定位、技术栈、分层与数据流
    ├── 模块设计文档.md                     # 业务模块组织与职责
    ├── 路由与导航设计文档.md               # 路由、菜单、权限
    ├── 状态管理设计文档.md                 # store、鉴权、会话
    ├── 国际化设计文档.md                   # i18n 设计
    ├── 组件与复用设计文档.md               # 通用组件、业务组件规范
    ├── OpenAPI消费接口映射.md              # 页面/组件 ↔ OpenAPI 端点映射
    ├── 构建与部署设计文档.md               # webpack、proxy、build
    └── 各模块实现细节设计/                 # 模块细节设计（按 UI 模块展开）
        ├── 认证与用户.md
        ├── AI业务实例池.md
        ├── 模型服务商.md
        ├── AI业务集群.md
        ├── 模型定价.md
        ├── 路由规则.md
        ├── APIKey管理.md
        ├── Entity管理.md
        ├── 证书管理.md
        └── 操作日志.md
```

---

## 代码变更流程

### Step 1：创建变更说明

在 `design-docs/modifications/` 下创建本次变更的说明目录：

```
YYYYMMDD-<变更目的简述>
```

目录内建议包含：

| 文件 | 说明 |
|------|------|
| `ui-code-changes.md` | **常用**：UI 变更说明，含对照接口、需改文件、验收清单（如 `2026-09-03-ui-optimize/`、`2026-09-02-ui-optimize/`）。 |
| `change-summary.md` | 变更摘要：背景、目标、影响范围、关键决策。 |
| `api-dependencies.md` | OpenAPI 依赖说明：引用 `ai-gateway-api` 相关端点。 |
| `design-changes.md` | 设计变更说明：页面交互、组件接口、路由、状态变化。 |

复杂 UI 变更至少应包含 `ui-code-changes.md`，并在 Step 3 同步更新 `sys-design/` 对应文档。

### Step 2：更新 api-define

- 确认本次变更是否涉及新的 OpenAPI 依赖。
- 确认所需 OpenAPI 端点已在 `design-docs/api-define/OpenAPI接口定义/`（及上游 `ai-gateway-api`）中定义。
- 若引用方式/路径有变化，更新 `sys-design/OpenAPI消费接口映射.md`。

### Step 3：更新 sys-design

根据变更范围更新对应文档：

| 变更范围 | 更新文档 |
|----------|----------|
| 架构或数据流 | `sys-design/总体设计文档.md` |
| 新增/修改业务模块 | `sys-design/模块设计文档.md` + `sys-design/各模块实现细节设计/<模块>.md` |
| 路由或菜单权限 | `sys-design/路由与导航设计文档.md` |
| 状态或鉴权 | `sys-design/状态管理设计文档.md` |
| 文案或多语言 | `sys-design/国际化设计文档.md` |
| 通用/业务组件接口 | `sys-design/组件与复用设计文档.md` |
| 页面/组件接口映射 | `sys-design/OpenAPI消费接口映射.md` |
| 构建或部署流程 | `sys-design/构建与部署设计文档.md` |

### Step 4：基于设计文档修改代码

基于 `design-docs/` 中的最终设计，对 `ai-gateway-web/` 代码进行修改：

1. 按 api-define → 模块/组件 → 路由 → 状态 → 国际化的顺序实现；
2. 新增或修改页面、组件、路由、store、i18n 文案；
3. 补充或更新单元测试、组件测试；
4. 本地运行 `npm run lint`，确保通过。

代码修改应始终与设计文档保持一致。若实现过程中发现设计需要调整，应**回到 Step 2/Step 3 更新设计文档**，而不是直接偏离设计。

### Step 5：总结并沉淀到 details

代码变更完成后，请大模型基于以下内容进行总结：

- 本次变更的修改说明（Step 1）；
- api-define 的变更（Step 2）；
- sys-design 的变更（Step 3）；
- 实际代码变更（Step 4）。

判断是否有**可复用、可沉淀的设计知识**，值得放入 `sys-design/各模块实现细节设计/` 中供后续使用。适合沉淀的内容包括：

- 新的页面交互模式或复杂表单逻辑；
- 可复用的业务组件或通用组件设计；
- 复杂状态管理或跨组件通信方案；
- 重要的边界情况、设计权衡与踩坑经验。

若决定沉淀，应：

1. 在 `sys-design/各模块实现细节设计/` 下新建或更新细节文档；
2. 在 `sys-design/summary.md` 中补充索引；
3. 确保细节文档基于实际代码，而非仅参考旧版设计文档。

### Step 6：检查清单

每次变更完成后，建议对照以下清单确认流程完整：

- [ ] 已在 `modifications/` 下创建本次变更目录。
- [ ] 变更说明文件已填写并审核。
- [ ] `api-define/` 已更新并 review：
  - [ ] 新依赖的 OpenAPI 端点已在 `ai-gateway-api` 中定义；
  - [ ] 引用方式/路径变化已同步到 `sys-design/OpenAPI消费接口映射.md`。
- [ ] `sys-design/` 已更新并 review：
  - [ ] 设计与 api-define 一致；
  - [ ] 页面、组件、路由、状态、i18n 描述准确；
  - [ ] 新增的细节文档已加入 `summary.md`。
- [ ] `sys-design/summary.md` 索引已同步（新增模块时补充「各模块实现细节设计」条目）。
- [ ] `sys-design/各模块实现细节设计/<模块>.md` 已同步（如新增/调整模块）。
- [ ] `sys-design/OpenAPI消费接口映射.md` 中的接口映射准确。
- [ ] 代码已按设计文档实现并通过 `npm run lint`。
- [ ] 已评估是否需要沉淀新的 `各模块实现细节设计/` 文档。

---

## 重要约定

1. **OpenAPI 只消费不定义**：前端不重复定义 OpenAPI 接口，所有接口依赖引用 `ai-gateway-api` 的设计文档；本地约定见 `api-define/OpenAPI接口定义/`（含 `certificates.md`、`operation-logs.md` 等）。
2. **语言包集中管理**：界面文案全部走 i18n，不允许硬编码中文或英文。
3. **模块自治**：每个业务模块独立目录，内部组件、逻辑不外泄。
4. **单向数据流**：父子组件通过 `props` 和 `$emit` 通信，避免直接修改 props。
5. **状态轻量**：不使用 Vuex，复杂状态提升到模块容器或 `store`。
6. **索引同步**：`sys-design/各模块实现细节设计/` 与 `sys-design/summary.md`、本文件目录树三者保持一致。
