#!/bin/sh
# 从生产构建同步样式与静态资源，保证原型与线上一致
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="${NVM_DIR:+$NVM_DIR/versions/node/v20.19.4/bin:}$PATH"
node -v >/dev/null 2>&1 || true
npm run build
rm -rf prototype/assets/static prototype/assets/font
cp -R dist/static prototype/assets/static
cp -R src/assets/font prototype/assets/font
echo "prototype assets synced from dist/"
