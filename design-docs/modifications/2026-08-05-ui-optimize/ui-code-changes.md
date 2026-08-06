# UI 代码变更文档

> **核对日期**：2026-08-05
> **状态**：已实施

---

## 1. 变更优先级总览

| 优先级 | 变更点 | 影响模块 | 状态 | 备注 |
| -------- | -------- | ---------- | ------ | ------ |
| P0 | 编辑集群时模型服务商不回显 | 集群 · 大模型配置 | 已修改 | `GatewayConfig.vue` mounted 回显 |
| P0 | 会话保持 `hash_header` 必填校验 | 集群 · 基本配置 | 已修改 | 新增 `validateHashHeader` |
| P0 | 会话保持提交 payload 清理 | 集群 · 基本配置 | 已修改 | 停用只传 `enabled`；`CLIENT_IP_ONLY` 不传 `hash_header` |
| P1 | 路由规则目标/备用列溢出 | 路由表 · 规则列表 | 已修改 | Tag 省略号 + Tooltip |
| P1 | 路由规则加载/提交失败无提示 | 路由表 · 规则列表 | 已修改 | `route.loadFailed`、`com.tipSubmitFailed` |
| P1 | 规则名称校验（长度/格式） | 路由表 · 规则表单 | 已修改 | 1–64 字符，字母数字开头结尾 |
| P2 | 路由表启停按钮防抖 | 路由表 · 列表 | 已修改 | loading 期间禁用按钮 |
| P2 | API-Key 父级选择器可清空 | API Key · 编辑 | 已修改 | `clearable` |
| P2 | API-Key 筛选值修正 | 路由表 · 列表 | 已修改 | `api_key` → `apikey` |

---

## 2. P0：集群基本配置（会话保持）

### 2.1 `hash_header` 必填校验

**影响文件**：`src/modules/Clusters/components/BaseConfig.vue`、i18n

新增 `validateHashHeader`：会话保持启用且策略为 `CLIENT_ID_ONLY` / `CLIENT_ID_PREFERED` 时，`hash_header` 为空报错「哈希头部不能为空」（`cluster.tipHashHeaderRequired`）；`CLIENT_IP_ONLY` 或停用时直接通过。

```javascript
const validateHashHeader = (rule, value, callback) => {
    const stickySessions = this.formData.sticky_sessions || {};
    if (stickySessions.enabled !== 'true') { callback(); return; }
    const strategy = stickySessions.hash_strategy;
    if (strategy === 'CLIENT_IP_ONLY') { callback(); return; }
    if (strategy === 'CLIENT_ID_ONLY' || strategy === 'CLIENT_ID_PREFERED') {
        if (value === undefined || value === null || String(value).trim() === '') {
            callback(new Error(this.$t('cluster.tipHashHeaderRequired')));
            return;
        }
    }
    callback();
};
```

规则由 `required: false, trigger: 'change'` 改为 `required: true, trigger: 'blur', validator: validateHashHeader`。

### 2.2 提交 payload 清理

**影响文件**：`BaseConfig.vue`（`handleSubmit`）、`Clusters/components/index.vue`（`formatStickySessionsForApi`）

| 场景 | 改后提交 |
| ------ | ------ |
| 停用 | `{ enabled: 'false' }`（编辑格式化后为 `{ enabled: false }`） |
| 启用 + `CLIENT_IP_ONLY` | 删除 `hash_header` |
| 启用 + 其他策略 | 完整 `enabled/hash_strategy/hash_header` |

---

## 3. P0：编辑集群回显模型服务商

**影响文件**：`src/modules/Clusters/components/GatewayConfig.vue`

**问题**：编辑集群进入大模型配置步骤时，模型服务商未回显。

**修改**：`mounted` 中非新增模式下对已有 `llmConfigData` 调用 `applyLlmConfigData` 回显：

```javascript
mounted() {
    if (!this.isAdd) {
        this.$nextTick(() => {
            if (this.llmConfigData && Object.keys(this.llmConfigData).length > 0) {
                this.applyLlmConfigData(this.llmConfigData);
            }
        });
    }
},
```

---

## 4. P1：路由表规则列表与表单

### 4.1 目标/备用集群列溢出处理

**影响文件**：`src/modules/RouteTable/components/RouteRules.vue`

目标集群和模型、备用集群和模型两列的 Tag 改为「Tooltip 包裹 + 单行省略号」，超长内容悬浮查看完整文本：

```javascript
h('Tooltip', {
    props: { content: text, transfer: true, maxWidth: 600 },
    style: 'display: block; width: 100%; margin-bottom: 4px;'
}, [
    h('Tag', {
        style: 'max-width: calc(100% - 5px); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; vertical-align: middle;'
    }, text)
]);
```

并增加样式约束 `.ivu-table-cell .ivu-tooltip { max-width: 100%; }`，修复 Tooltip 外层 inline-block 导致的溢出裁剪问题。

### 4.2 加载/提交失败提示

**影响文件**：`RouteRules.vue`、i18n

- 全局/属主路由规则加载失败（非 200 或异常）提示 `route.loadFailed`「加载路由规则失败」并 `console.error`
- 规则提交失败提示 `com.tipSubmitFailed`

### 4.3 规则名称校验

**影响文件**：`src/modules/RouteTable/components/RuleForm.vue`、i18n

| 校验 | 规则 |
| ------ | ------ |
| 长度 | `min: 1, max: 64`（`route.ruleNameLengthError`） |
| 格式 | `/^[a-zA-Z0-9]([a-zA-Z0-9._-]{0,62}[a-zA-Z0-9])?$/`（`route.ruleNameFormatError`） |

### 4.4 模型下拉简化

**影响文件**：`RuleForm.vue`

`getModelsByCluster` 移除「已选模型过滤」逻辑，直接返回该集群服务商的全部模型。

---

## 5. P2：其他

### 5.1 路由表启停防抖

**影响文件**：`src/modules/RouteTable/index.vue`

- `onToggleEnabled` 在 `loading` 期间直接 return
- 启用/停用按钮在 `loading` 期间 `disabled`，避免快速重复点击

### 5.2 API-Key 筛选值修正

**影响文件**：`RouteTable/index.vue`

搜索过滤器 API-Key 的 value 由 `api_key` 修正为 `apikey`（与后端筛选参数一致）。

### 5.3 API Key 父级选择器可清空

**影响文件**：`src/modules/APIKey/components/Upsert.vue`

Entity 选择器增加 `clearable`。

### 5.4 代码风格

`BaseConfig.vue`、`RuleForm.vue` 模板与脚本统一为 2 空格缩进风格。

---

## 6. i18n 新增

| Key | 中文 |
| ----- | ------ |
| `cluster.tipHashHeaderRequired` | 哈希头部不能为空 |
| `route.loadFailed` | 加载路由规则失败 |
| `route.ruleNameLengthError` | 规则名称长度为 1–64 个字符 |
| `route.ruleNameFormatError` | 规则名称仅允许字母、数字、-、_、.，且不允许以 -、_、. 开头或结尾 |

英文同步新增。

---

## 7. 测试计划

- [ ] 基本配置：启用会话保持 + CLIENT_ID_ONLY，hash_header 留空提交被拦截；CLIENT_IP_ONLY 提交不含 hash_header；停用提交仅含 enabled
- [ ] 编辑集群：大模型配置步骤模型服务商正确回显
- [ ] 路由规则：超长目标/备用集群标签省略号展示，悬浮 Tooltip 显示全文
- [ ] 路由规则：加载失败、提交失败有错误提示
- [ ] 规则表单：名称超长/非法字符被拦截
- [ ] 路由表列表：加载中启停按钮禁用，快速点击不重复请求

---

## 8. 参考文档

| 文档 | 路径 |
| ------ | ------ |
| 上一轮 | `design-docs/modifications/2026-08-01-ui-optimize/ui-code-changes.md` |
| 下一轮 | `design-docs/modifications/2026-08-06-ui-optimize/ui-code-changes.md` |
