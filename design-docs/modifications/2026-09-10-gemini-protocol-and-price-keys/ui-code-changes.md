# UI 代码变更文档

> **对照接口**：`providers.md` §1、§2.1、§2.6；`model-prices.md` §1.1
> **对照原型**：`provider-upsert.js`（服务商表单）、`mock-data.js`（共享 Mock 数据）

---

## 1. 变更总览

| 页面 / 模块 | 变更要点 | 状态 |
| ----------- | -------- | ---- |
| 服务商 · 协议选择 | `model_protocols` 枚举追加 `gemini` | 待实现 |
| 服务商 · 模型发现 | 默认 URI 按协议区分：`gemini` → `/v1beta/models`；认证头 `x-goog-api-key` | 待实现 |
| 服务商 · 校验文案 | 协议校验错误信息追加 `gemini` | 待实现 |
| 模型定价 · 价格项 | `prices` / `tier_prices` 键名枚举追加 10 个新键 | 待实现 |
| i18n | 中英文协议校验文案追加 `gemini` | 待实现 |

---

## 2. 服务商 · 协议选择

**原型**：`provider-upsert.js` 中 `PROTOCOL_OPTIONS` 由 `['openai', 'anthropic']` 扩展为 `['openai', 'anthropic', 'gemini']`；服务商列表页、新建/编辑表单的协议下拉选项均由该常量或 `MockData.modelProtocols` 驱动。

**对照接口**：`providers.md` §1 — `model_protocols` 枚举值为 `openai`、`anthropic`、`gemini`。

**变更**：

| 项 | 变更前 | 变更后 |
| -- | ------ | ------ |
| 协议枚举 | `['openai', 'anthropic']` | `['openai', 'anthropic', 'gemini']` |
| 列表页协议筛选选项 | 仅 openai、anthropic | 增加 gemini |
| 新建/编辑表单协议多选 | 仅 openai、anthropic | 增加 gemini |
| 默认协议 | `['openai']` | 保持不变 |

**涉及文件**：

| 文件 | 说明 |
| ---- | ---- |
| `src/modules/Providers/index.vue` | `PROTOCOL_OPTIONS` 常量追加 `gemini` |
| `src/modules/Providers/components/ProviderUpsert.vue` | `PROTOCOL_OPTIONS` 常量追加 `gemini`；`validateProtocols` 校验文案更新 |
| `src/i18n/zh.js` | `provider.protocolInvalid` 追加 `gemini` |
| `src/i18n/en.js` | `provider.protocolInvalid` 追加 `gemini` |

---

## 3. 服务商 · 模型发现

**原型**：`provider-upsert.js` 中 `mockDiscoverModels` 增加 `gemini` 分支；`buildDiscoverPayload` 默认 URI 按 `model_protocol` 取 `/v1/models` 或 `/v1beta/models`。

**对照接口**：`providers.md` §2.6 — 若 `uri` 为空，按协议取默认值：`openai`/`anthropic` 为 `/v1/models`，`gemini` 为 `/v1beta/models`；`gemini` 认证头为 `x-goog-api-key`；响应解析从 `models[].name` 提取并剥离 `models/` 前缀。

**变更**：

| 项 | 变更前 | 变更后 |
| -- | ------ | ------ |
| 发现默认 URI | 固定 `/v1/models` | `gemini` → `/v1beta/models`，其他 `/v1/models` |
| 发现请求 model_protocol | 取第一个协议直接透传 | 透传，UI 无需额外处理 |
| 后端认证头 | UI 不配置 Authorization | 保持不变，由后端根据 `model_protocols` 自动决定（`x-goog-api-key`） |

> 说明：认证头 `Authorization` 已在 `providers.md` §1 Endpoint 说明中禁止配置，完全由后端根据 `model_protocols` 决定，前端不需要新增字段。

**涉及文件**：

| 文件 | 说明 |
| ---- | ---- |
| `src/modules/Providers/components/ProviderUpsert.vue` | 发现请求 payload 的 `uri` 默认值按首个协议动态选取 |

---

## 4. 服务商 · 校验文案

**原型**：`provider-upsert.js` 中 `validateDiscoverPayload` 与 `validate` 的协议校验文案由 `openai 或 anthropic` 改为 `openai、anthropic 或 gemini`。

**对照接口**：`providers.md` §1 — `model_protocols` 必填且取值须为枚举值。

**变更**：

| 项 | 变更前 | 变更后 |
| -- | ------ | ------ |
| 发现请求协议校验 | `model_protocol 须为 openai 或 anthropic` | `model_protocol 须为 openai、anthropic 或 gemini` |
| Provider 表单协议校验 | `模型协议取值须为 openai 或 anthropic` | `模型协议取值须为 openai、anthropic 或 gemini` |
| i18n 中文 | `模型协议仅支持 openai、anthropic` | `模型协议仅支持 openai、anthropic、gemini` |
| i18n 英文 | `Model protocol only supports openai and anthropic` | `Model protocol only supports openai, anthropic and gemini` |

**涉及文件**：

| 文件 | 说明 |
| ---- | ---- |
| `src/modules/Providers/components/ProviderUpsert.vue` | `validateProtocols` 错误文案改用 i18n 键 |
| `src/i18n/zh.js` | 更新 `provider.protocolInvalid` |
| `src/i18n/en.js` | 更新 `provider.protocolInvalid` |

---

## 5. 模型定价 · 价格项

**原型**：`mock-data.js` 中 `modelPriceKeys` 数组追加 10 个新键；`model-price-upsert.js` 从 `MockData.modelPriceKeys` 动态渲染价格项下拉。

**对照接口**：`model-prices.md` §1.1 — `prices` 键名枚举新增 10 个键。

**变更**：

| 项 | 变更前 | 变更后 |
| -- | ------ | ------ |
| 缓存写入 TTL | `cache_creation_input_token_cost` | 新增 `cache_creation_input_token_cost_1h` |
| 长度分档 | 仅 200k | 新增 256k、272k、512k 三档输入/输出成本 |
| 图像 Token | 仅输出图像相关键 | 新增 `input_cost_per_image_token` |
| 音频 Token | 仅 `input_cost_per_audio_per_second` | 新增 `input_cost_per_audio_token`、`output_cost_per_audio_token` |

新增键名清单：

1. `cache_creation_input_token_cost_1h`
2. `input_cost_per_token_above_256k_tokens`
3. `output_cost_per_token_above_256k_tokens`
4. `input_cost_per_token_above_272k_tokens`
5. `output_cost_per_token_above_272k_tokens`
6. `input_cost_per_token_above_512k_tokens`
7. `output_cost_per_token_above_512k_tokens`
8. `input_cost_per_image_token`
9. `input_cost_per_audio_token`
10. `output_cost_per_audio_token`

**涉及文件**：

| 文件 | 说明 |
| ---- | ---- |
| `src/modules/ModelPrices/components/ModelPriceUpsert.vue` | `PRICE_KEY_OPTIONS` 常量追加上述 10 个键 |

> 说明：`ModelPriceView.vue` 直接遍历 API 返回的 `prices` 对象所有键，不依赖选项列表，无需修改即可显示新字段；列表页 `index.vue` 不直接展示价格字段，无需修改；`price.js` 格式化与校验逻辑与键名无关，无需修改。

---

## 6. 验收清单

- [ ] 服务商列表页协议筛选下拉包含 `gemini`
- [ ] 服务商新建/编辑表单协议多选下拉包含 `gemini`
- [ ] 选择 `gemini` 协议时，模型发现请求的默认 URI 为 `/v1beta/models`
- [ ] 选择 `openai`/`anthropic` 协议时，模型发现请求的默认 URI 仍为 `/v1/models`
- [ ] 协议校验错误文案包含 `gemini`
- [ ] 模型定价新增/编辑表单的价格项下拉包含 10 个新增键名
- [ ] 模型定价分时段价格的价格项下拉包含 10 个新增键名
- [ ] `npm run lint` 通过
