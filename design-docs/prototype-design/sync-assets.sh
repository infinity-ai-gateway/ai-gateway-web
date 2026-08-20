#!/bin/sh
# 从生产构建同步样式与静态资源，保证原型与线上一致
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"
cd "$ROOT"
export PATH="${NVM_DIR:+$NVM_DIR/versions/node/v20.19.4/bin:}$PATH"
node -v >/dev/null 2>&1 || true
npm run build
rm -rf "$SCRIPT_DIR/assets/static" "$SCRIPT_DIR/assets/font"
cp -R dist/static "$SCRIPT_DIR/assets/static"
cp -R src/assets/font "$SCRIPT_DIR/assets/font"
echo "prototype-design assets synced from dist/"
