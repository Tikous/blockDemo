# 区块链演示

这是一个使用 Cosmos SDK、JavaScript 和 Node.js 实现的基础区块链。该实现包含以下特性：

- 基于 UTXO 的交易模型
- 工作量证明（PoW）挖矿
- 交易验证的默克尔树
- 动态难度调整
- P2P 网络
- RESTful API
- 使用 LevelDB 的数据持久化
- React 前端可视化界面

## 项目结构

- `/src` - 区块链核心代码
  - `/src/Block.js` - 区块实现，包含默克尔树
  - `/src/Transaction.js` - 交易和UTXO实现
  - `/src/Blockchain.js` - 区块链实现，包含难度调整
  - `/src/P2PServer.js` - P2P网络功能
  - `/src/HttpServer.js` - REST API实现
  - `/src/index.js` - 主入口文件
- `/client` - React前端界面代码
  - `/client/src/components` - 可重用组件
  - `/client/src/pages` - 页面组件
  - `/client/src/services` - API服务和接口定义

## 环境要求

- Node.js (v14 或更高版本)
- npm

## 安装

1. 克隆仓库
2. 安装后端依赖：
```bash
npm install
```
3. 安装前端依赖：
```bash
cd client
npm install
```

## 运行应用

### 启动区块链节点

使用默认端口启动节点（HTTP: 3001, P2P: 6001）：
```bash
npm start
```

使用自定义端口启动节点：
```bash
HTTP_PORT=3002 P2P_PORT=6002 npm start
```

### 启动前端界面

在另一个终端窗口中：
```bash
cd client
npm start
```

前端将在 [http://localhost:3000](http://localhost:3000) 上运行。

## 前端功能

- **仪表盘**：显示区块链概览、统计数据和图表
- **区块浏览**：查看所有区块及其详细信息
- **交易管理**：查看交易历史、创建新交易
- **挖矿界面**：挖掘新区块、查看待处理交易
- **钱包管理**：创建和管理钱包、查看余额和UTXO
- **网络状态**：查看和管理P2P连接

## API 接口

### 区块链操作

- `GET /blocks` - 获取所有区块
- `GET /blocks/:index` - 根据索引获取特定区块
- `POST /mine` - 挖掘新区块
  ```json
  {
    "minerAddress": "你的公钥"
  }
  ```

### 交易操作

- `POST /transaction` - 创建新交易
  ```json
  {
    "fromAddress": "发送方公钥",
    "toAddress": "接收方公钥",
    "amount": 100,
    "privateKey": "发送方私钥"
  }
  ```
- `GET /pending-transactions` - 获取待处理交易
- `GET /balance/:address` - 获取地址余额
- `GET /utxo/:address` - 获取地址的 UTXO（未花费的交易输出）

### 钱包操作

- `POST /wallet/new` - 创建新钱包
  
  响应:
  ```json
  {
    "privateKey": "私钥",
    "publicKey": "公钥/地址"
  }
  ```

### 网络操作

- `GET /peers` - 获取连接的对等节点列表
- `POST /peers` - 连接到新的对等节点
  ```json
  {
    "peer": "ws://hostname:port"
  }
  ```

## 多节点设置

要创建一个多节点网络：

1. 启动第一个节点：
```bash
npm start
```

2. 启动第二个节点（不同端口）：
```bash
HTTP_PORT=3002 P2P_PORT=6002 npm start
```

3. 将第二个节点连接到第一个节点：
```bash
curl -X POST http://localhost:3002/peers -H "Content-Type: application/json" -d '{"peer": "ws://localhost:6001"}'
```

## 网络扩展

通过此方式，可以创建任意数量的节点并将它们互相连接，形成P2P网络。

## 许可证

MIT 