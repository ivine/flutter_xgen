#!/bin/bash

# 定义目录
WEBVIEW_UI_DIR="webview_ui"
DIST_DIR="../dist/webview_ui"

# 检查 webview_ui 目录是否存在，如果不存在则创建
if [ ! -d "$WEBVIEW_UI_DIR" ]; then
  echo "目录 $WEBVIEW_UI_DIR 不存在，正在创建..."
  mkdir -p "$WEBVIEW_UI_DIR"
  if [ $? -ne 0 ]; then
    echo "创建目录 $WEBVIEW_UI_DIR 失败。"
    exit 1
  fi
fi

# 切换到 webview_ui 目录
cd "$WEBVIEW_UI_DIR" || exit

# 运行 yarn 命令
yarn && yarn build

# 检查 yarn build 是否成功
if [ $? -ne 0 ]; then
  echo "Yarn build 失败。"
  exit 1
fi

# 如果 dist 目录存在，则删除它
if [ -d "$DIST_DIR" ]; then
  rm -rf "$DIST_DIR"
fi

# 创建 dist 目录
mkdir -p "$DIST_DIR"

# 移动构建后的文件到 dist 目录
mv dist/* "$DIST_DIR"

# 检查移动是否成功
if [ $? -ne 0 ]; then
  echo "移动构建文件到 $DIST_DIR 失败。"
  exit 1
fi

echo "构建和移动操作成功完成。"
