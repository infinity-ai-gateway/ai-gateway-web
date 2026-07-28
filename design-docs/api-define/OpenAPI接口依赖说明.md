# AI Gateway Web OpenAPI 接口依赖说明

## 1. 设计原则

`ai-gateway-web` 是 `ai-gateway-api` 的 OpenAPI 消费方，遵循以下原则：

1. **只消费，不定义**：前端不在本仓库重新定义 OpenAPI 接口。
2. **引用不在复制**：接口定义以 `ai-gateway-api/design-docs/api-define/` 为准。
3. **变更先定接口**：若新增功能需要新接口，先在 `ai-gateway-api` 仓库完成接口设计，再在本仓库引用。
4. **映射关系清晰**：所有消费接口统一登记在 `design-docs/sys-design/OpenAPI消费接口映射.md`。

## 2. OpenAPI 文档位置

接口定义位于 `ai-gateway-api` 仓库：

```
ai-gateway-api/
└── design-docs/
    └── api-define/
        └── OpenAPI接口定义.md
```

开发时应将两个仓库放在同一 workspace 下，通过相对路径或仓库链接引用。

## 3. 前端统一请求前缀

前端所有请求通过 `src/utils/request.js` 封装，自动拼接前缀：

```js
config.url = `${window.location.protocol}//${window.location.host}/open-api/v1/${config.url}`;
```

因此业务代码中只需写相对路径，例如：

```js
this.$request({
  url: 'clusters',
  method: 'get'
});
```

实际请求地址为：`/open-api/v1/clusters`。

## 4. 引用示例

在编写变更说明或设计文档时，按以下方式引用 OpenAPI：

```markdown
## 本次变更依赖的接口

- `GET /open-api/v1/clusters`：查询集群列表。
  - 定义位置：`ai-gateway-api/design-docs/api-define/OpenAPI接口定义.md#clusters`
- `POST /open-api/v1/clusters`：创建集群。
  - 定义位置：`ai-gateway-api/design-docs/api-define/OpenAPI接口定义.md#create-cluster`
```

## 5. 接口依赖映射

前端消费接口与模块的完整映射，请参见：

```
design-docs/sys-design/OpenAPI消费接口映射.md
```

该文档登记了每个页面/组件使用的后端端点、方法及用途。

## 6. 新增接口的流程

当业务功能需要新的后端接口时，按以下流程执行：

```
1. 在 ai-gateway-api 仓库完成接口设计
   └─ 更新 ai-gateway-api/design-docs/api-define/OpenAPI接口定义.md

2. 在 ai-gateway-web 创建变更说明
   └─ design-docs/modifications/YYYYMMDD-<目的>/
      └─ api-dependencies.md（引用新接口）

3. 在 ai-gateway-web 更新接口映射
   └─ design-docs/sys-design/OpenAPI消费接口映射.md

4. 实现前端代码
   └─ 在对应模块组件中调用新接口

5. 联调验证
   └─ 确认前后端接口定义一致
```

## 7. Review 检查清单

每次涉及接口变更时，需检查：

- [ ] 所需接口已在 `ai-gateway-api/design-docs/api-define/` 中定义。
- [ ] 前端文档中仅引用接口，不重新定义接口路径、参数、响应结构。
- [ ] `OpenAPI消费接口映射.md` 已同步更新。
- [ ] 前端代码中请求 URL 只写相对路径，由 `request.js` 统一加前缀。
- [ ] 鉴权、语言、TraceId 等通用请求头由 `request.js` 统一注入，业务代码不重复处理。

## 8. 常见问题

### Q：接口文档不一致怎么办？

以 `ai-gateway-api` 仓库的定义为准，及时同步 `ai-gateway-web` 的映射文档与代码。

### Q：前端 mock 数据是否允许？

开发模式下允许通过 dev server 代理到后端或本地 mock 服务，但不应将 mock 接口定义写入设计文档。

### Q：接口版本如何管理？

当前统一使用 `/open-api/v1/` 版本。如需升级版本，应同时在 `ai-gateway-api` 与 `ai-gateway-web` 的 `request.js` 中统一调整。
