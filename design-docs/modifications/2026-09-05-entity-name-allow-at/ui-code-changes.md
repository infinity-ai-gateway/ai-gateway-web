# UI 代码变更文档

> **对照接口**：`00-common.md` §17 EntityName  
> **对照原型**：`prototype-design/assets/js/entity-upsert.js`、`assets/js/mock-data.js`  
> **前置**：[2026-09-04-operation-logs](../2026-09-04-operation-logs/ui-code-changes.md)  
> **状态**：原型已 review 通过 · Vue / i18n / 用户文档 **已实现**（待 UI Review）  
> **关联 Issue**：[ai-gateway-api#135](https://github.com/rainway-ai-gateway/ai-gateway-api/issues/135)

Entity 名称字符集放开 `@`，支持 `用户名@项目名`。创建表单的前端校验、提示文案与 OpenAPI / 原型对齐。

---

## 1. 变更总览

| 页面 / 模块 | 变更要点 | 状态 |
| ----------- | -------- | ---- |
| Entity · 创建抽屉 | 名称允许中间出现 `@`；首尾不能为 `_`、`-`、`@`；提示 / placeholder / 校验文案同步 | ✅ 已实现 |
| 原型 Entity 页 | 正则、form-tip、placeholder、mock `alice@default` | ✅ 已完成 |

---

## 2. Entity 名称允许 `@`

### 对照接口

`00-common.md` §17 EntityName：长度 1–64；仅允许小写字母、数字、`_`、`-`、`@`；不能以 `-`、`_`、`@` 开头或结尾。

### 对照原型

| 元素 | 原型行为 |
| ---- | -------- |
| 正则 | `/^[a-z0-9](?:[a-z0-9_@-]{0,62}[a-z0-9])?$/` |
| form-tip | `1–64 字符；仅小写字母、数字、_、-、@（支持 用户名@项目名）；不能以 _、- 或 @ 开头/结尾` |
| placeholder | `user@project` |
| 校验失败文案 | `名称须为小写字母、数字、下划线、连字符或 @（如 user@project），且不能以 _、- 或 @ 开头/结尾` |
| mock 数据 | 新增组织 `alice@default` |

### 变更前后对比

| 项 | 变更前 | 变更后 |
| -- | ------ | ------ |
| `EntityNameRegCheck` | `/^[a-z0-9](?:[a-z0-9_-]{0,62}[a-z0-9])?$/` | `/^[a-z0-9](?:[a-z0-9_@-]{0,62}[a-z0-9])?$/` |
| `entity.nameRule` | 仅小写字母、数字、`_`、`-`；不能以 `_` 或 `-` 开头/结尾 | 增加 `@`；首尾限制扩展为 `_`、`-`、`@` |
| `entity.nameFormatError` | 同上，无 `@` | 与原型校验文案一致 |
| `entity.namePlaceholder` | `请输入Entity名称` / `Please enter Entity name` | `user@project` / `e.g. user@project` |

### 涉及文件

| 文件 | 说明 |
| ---- | ---- |
| `src/utils/const.js` | 更新 `EntityNameRegCheck` 正则与注释 |
| `src/i18n/zh.js` | `entity.nameRule` / `nameFormatError` / `namePlaceholder` |
| `src/i18n/en.js` | 同上（英文） |
| `docs/zh-cn/08-entity.md` | §8.2 名称「格式要求」补上字符集与 `@` |
| `design-docs/sys-design/各模块实现细节设计/Entity管理.md` | §5.1 `name` 校验列与 OpenAPI 对齐 |
| `design-docs/prototype-design/assets/js/entity-upsert.js` | 已改（正则 / tip / placeholder） |
| `design-docs/prototype-design/assets/js/mock-data.js` | 已改（`alice@default`） |
| `design-docs/api-define/OpenAPI接口定义/00-common.md` | 已从 api 仓库同步 |

### 验收清单

- [ ] 输入 `alice@default`、`user@project`：前端通过，可成功创建
- [ ] 输入 `@alice`、`alice@`：拦截，提示含「不能以 @ 开头/结尾」语义
- [ ] 创建抽屉 form-tip / placeholder 与原型一致
- [ ] `npm run lint` 通过
