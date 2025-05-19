const Blockchain = require('./Blockchain');
const P2PServer = require('./P2PServer');
const HttpServer = require('./HttpServer');

const HTTP_PORT = process.env.HTTP_PORT || 3001;
const P2P_PORT = process.env.P2P_PORT || 6001;

const blockchain = new Blockchain();
const p2pServer = new P2PServer(blockchain);
const httpServer = new HttpServer(blockchain, p2pServer);

// 初始化区块链，包括打开数据库和从数据库加载
blockchain.initialize().then(() => {
    // 启动服务器
    httpServer.listen(HTTP_PORT);
    p2pServer.listen(P2P_PORT);
}).catch(error => {
    console.error('Failed to initialize blockchain:', error);
    process.exit(1);
}); 