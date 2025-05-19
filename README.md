# 区块链演示

这是一个使用 Cosmos SDK、JavaScript 和 Node.js 实现的基础区块链。该实现包含以下特性：

- 基于 UTXO 的交易模型
- 工作量证明（PoW）挖矿
- 交易验证的默克尔树
- 动态难度调整
- P2P 网络
- RESTful API
- 使用 LevelDB 的数据持久化

## 环境要求

- Node.js (v14 或更高版本)
- npm

## 安装

1. 克隆仓库
2. 安装依赖：
```bash
npm install
```

## 运行节点

使用默认端口启动节点（HTTP: 3001, P2P: 6001）：
```bash
npm start
```

使用自定义端口启动节点：
```bash
HTTP_PORT=3002 P2P_PORT=6002 npm start
```

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
- `GET /utxo/:address` - 获取地址的 UTXO 集合

### 网络操作

- `POST /peers` - 添加新节点
  ```json
  {
    "peer": "ws://localhost:6002"
  }
  ```
- `GET /peers` - 获取已连接节点列表

### 钱包操作

- `POST /wallet/new` - 生成新钱包（返回公钥和私钥）

## P2P 网络

创建多节点网络：

1. 使用默认端口启动第一个节点
2. 使用不同端口启动其他节点
3. 使用 `/peers` 接口连接节点

示例：
```bash
# 终端 1 - 第一个节点
npm start

# 终端 2 - 第二个节点
HTTP_PORT=3002 P2P_PORT=6002 npm start

# 终端 3 - 将第二个节点连接到第一个节点
curl -X POST -H "Content-Type: application/json" -d '{"peer": "ws://localhost:6001"}' http://localhost:3002/peers
```

## 功能特性

### 挖矿

- 自动难度调整，保持约 10 秒的出块时间
- 挖矿奖励：100 个币
- 工作量证明共识机制

### 交易

- 基于 UTXO 的交易模型
- 使用椭圆曲线加密的数字签名
- 交易验证
- 使用默克尔树进行高效的交易验证

### 链安全

- 最长链规则
- 区块验证
- 交易验证
- 加密工作量证明

### 数据持久化

- 区块链数据存储在 LevelDB 中
- 重启时自动从数据库恢复

## 开发

使用自动重启进行开发：
```bash
npm run dev
``` 