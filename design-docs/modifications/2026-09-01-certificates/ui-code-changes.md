# UI 代码变更文档

> **对照接口**：`certificates.md`
> **前置**：[2026-09-01-operation-logs](../2026-09-01-operation-logs/ui-code-changes.md)

## 变更总览

| 页面 | 变更要点 |
|------|----------|
| 证书列表页 | 移除 API 不返回的列；新增默认标识列；默认证书禁用删除 |
| 证书创建抽屉 | 移除 `expired_date` 手填；上传证书后前端解析并展示过期时间；请求体与 API 对齐；首证自动设为默认 |

## 需修改文件

| 文件 | 说明 |
| ------ | ------ |
| `src/modules/Cert/index.vue` | 列表列调整、删除按钮禁用、创建时传递 `defaultIsDefault` |
| `src/modules/Cert/components/Create.vue` | 上传证书后解析并展示过期时间；校验与提交体对齐 API |
| `src/utils/cert.js` | 新增 `parseCertExpiredDate`，从 PEM 证书解析过期时间 |
| `src/utils/const.js` | `CertNameRegCheck` 对齐 API 命名规则；新增 `CertDescriptionRegCheck` |
| `src/i18n/zh.js` | 新增 `cert.isDefault`、`tipDescriptionRule`、`tipCannotDeleteDefault`；更新 `tipCertNameRule` |
| `src/i18n/en.js` | 同上（英文） |

## 与 API 对齐说明

### 列表页

- **移除列**：`cert_file_name`、`key_file_name`（API 列表/详情均不返回）
- **新增列**：`is_default`（默认证书显示 Tag）
- **保留列**：`cert_name`（Tooltip 展示 description）、`expired_date`（只读，服务端解析）
- **删除操作**：`is_default === true` 时按钮禁用并提示「默认证书不可删除」

### 创建表单

- **移除手填**：`expired_date` 不由用户输入，也不提交给 API
- **上传预览**：过期时间以纯文字展示（位于私钥文件与「设为默认」之间）；未上传时显示占位提示，上传后按与后端一致的规则解析首个 PEM 证书块并展示 `notAfter`；解析失败仅保留占位，不弹错（最终以服务端解析为准）
- **提交字段**：`cert_name`、`description`、`is_default`、`cert_file_content`、`key_file_content`
- **首证逻辑**：系统中尚无默认证书时，`is_default` 自动为 `true` 且 Checkbox 禁用
- **校验规则**：
  - `cert_name`：2-64 字符，字母/数字/`_`/`-`/`.`，不能以 `_`、`-`、`.` 开头或结尾，无空白
  - `description`：2-256 字符，不含控制字符

### i18n

- `IsDefault：` 硬编码改为 `$t('cert.isDefault')`

## 验收清单

- [ ] 列表仅展示 API 返回字段（cert_name、is_default、expired_date）
- [ ] 上传证书后创建表单展示解析出的过期时间（只读预览）
- [ ] 创建请求体不含 `expired_date`、`cert_file_name`、`key_file_name`
- [ ] 无默认证书时创建首证自动勾选且不可取消「设为默认」
- [ ] 默认证书行删除按钮禁用
- [ ] 证书名/描述校验与 API 文档一致
- [ ] `npm run lint` 通过
