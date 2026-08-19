# AI Gateway Web

AI Gateway Web 为 AI 网关的用户提供图形化操作界面，用于管理与查看 AI 网关的主要配置。

## 特性

- 资源管理（AI 网关实例池、AI 业务集群、模型定价）
- 路由管理（路由表：Global / Entity / API-Key）
- 消费者管理（API Key 管理、Entity 管理）
- 用户管理（用户、Token）

## 快速开始

### 适用环境

**本文档的配置步骤、示例命名（如集群/实例池名称）以及截图，基于 [ai-gateway-demo](https://github.com/rainway-ai-gateway/ai-gateway-demo) 提供的 K8S 演示环境整理。**

如使用自建环境/生产环境（域名、端口、Service 名称、网络策略等不同），界面字段与配置值请以实际部署为准。

### 从源代码构建

请参见：[`BUILD_GUIDE.md`](BUILD_GUIDE.md)

## 文档

- [使用指南](docs/zh-cn/00-README.md)
- [部署文档](docs/zh-cn/deploy.md)
- [开发文档](docs/zh-cn/develop.md)

## 参考资料

- 演示环境（K8S）：[ai-gateway-demo](https://github.com/rainway-ai-gateway/ai-gateway-demo)
- AI Gateway API：[ai-gateway-api](https://github.com/rainway-ai-gateway/ai-gateway-api)

## 社区贡献

请参考：[CONTRIBUTING.md](CONTRIBUTING.md)

## License

请参考：[LICENSE](LICENSE)
