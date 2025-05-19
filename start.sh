#!/bin/bash

# 安装后端依赖
echo "安装后端依赖..."
npm install

# 安装前端依赖
echo "安装前端依赖..."
cd client && npm install
cd ..

# 启动完整应用（后端+前端）
echo "启动区块链应用（后端+前端）..."
npm run dev:full

# 这个脚本不会运行到这里，因为上面的命令会保持运行
# 使用 Ctrl+C 停止应用 