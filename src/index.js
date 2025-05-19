const Blockchain = require('./Blockchain');
const P2PServer = require('./P2PServer');
const HttpServer = require('./HttpServer');

const HTTP_PORT = process.env.HTTP_PORT || 3001;
const P2P_PORT = process.env.P2P_PORT || 6001;

const blockchain = new Blockchain();
const p2pServer = new P2PServer(blockchain);
const httpServer = new HttpServer(blockchain, p2pServer);

// Initialize the blockchain from database if available
blockchain.loadFromDb().then(() => {
    // Start the servers
    httpServer.listen(HTTP_PORT);
    p2pServer.listen(P2P_PORT);
}); 