# 本文描述如何获取AI Gateway Web产出和部署

## 获取 AI Gateway Web 产出

产出的获取有多种方式

- 方式一：通过源码编译： clone [infinity-ai-gateway/ai-gateway-web](https://github.com/infinity-ai-gateway/ai-gateway-web), 仓库后进入项目根目录，确保node为v20+版本, 执行 `sh build.sh`， output 文件夹就是静态文件
- 方式二：直接进入 [ai-gateway-web/releases](https://github.com/infinity-ai-gateway/ai-gateway-web/releases) 页面下载相应的编译产出

若想进行二次开发或者提交PR，请参考 [项目开发指南](./develop.md)。

## AI Gateway Web 部署

AI Gateway Web 依赖 [AI Gateway API](https://github.com/infinity-ai-gateway/ai-gateway-api)。请先完成AI Gateway API的部署，详见[AI Gateway API 部署](https://github.com/infinity-ai-gateway/ai-gateway-api/blob/develop/docs/zh_cn/deploy.md)。

生产环境具体部署步骤为：将编译产出放入 AI Gateway API的static静态文件夹中。
