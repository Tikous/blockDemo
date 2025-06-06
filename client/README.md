# 区块链可视化前端

这是一个使用 React 和 Material-UI 构建的区块链可视化界面，用于展示和操作我们的区块链应用。

## 功能

- 区块链仪表盘：显示区块链概览、统计数据和图表
- 区块浏览：查看所有区块及其详细信息
- 交易管理：查看交易历史、创建新交易
- 挖矿界面：挖掘新区块、查看待处理交易
- 钱包管理：创建和管理钱包、查看余额和UTXO
- 网络状态：查看和管理P2P连接

## 安装与运行

1. 确保已安装Node.js（v14或更高版本）和npm
2. 安装依赖：
```bash
npm install
```
3. 启动开发服务器：
```bash
npm start
```

应用将在 [http://localhost:3000](http://localhost:3000) 上运行。

## 使用指南

### 开始前的准备

在使用前端界面之前，请确保：

1. 区块链后端节点已启动（默认在 http://localhost:3001）
2. 如果修改了后端API地址，请相应地更新 `.env` 文件中的 `REACT_APP_API_URL` 变量

### 创建钱包

1. 导航到"钱包"页面
2. 填写钱包名称并点击"创建新钱包"
3. 新钱包将显示在左侧列表中，并保存在浏览器的本地存储中

### 发送交易

1. 从钱包页面选择一个钱包，点击"发送币"
2. 或直接导航到"交易"页面，填写交易表单
3. 输入发送方地址、接收方地址、金额和私钥
4. 点击"发送交易"按钮

### 挖掘新区块

1. 导航到"挖矿"页面
2. 输入矿工地址（接收挖矿奖励的钱包公钥）
3. 点击"开始挖矿"
4. 挖矿成功后，您的钱包将收到100个币作为奖励

### 查看区块链状态

1. 主仪表盘显示了区块链的概览和重要统计数据
2. "区块"页面列出了所有区块
3. 点击区块可查看其详细信息，包括所有包含的交易

## 开发信息

此前端应用使用了以下技术：

- React 18
- TypeScript
- Material-UI 5
- Recharts（用于图表可视化）
- Axios（用于API通信）
- React Router（用于导航）

代码结构：
- `/src/components` - 可重用组件
- `/src/pages` - 页面组件
- `/src/services` - API服务和接口定义
