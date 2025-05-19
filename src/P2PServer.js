const WebSocket = require('ws');

const MESSAGE_TYPES = {
    QUERY_LATEST: 'QUERY_LATEST',
    QUERY_ALL: 'QUERY_ALL',
    RESPONSE_BLOCKCHAIN: 'RESPONSE_BLOCKCHAIN',
    NEW_BLOCK: 'NEW_BLOCK',
    NEW_TRANSACTION: 'NEW_TRANSACTION'
};

class P2PServer {
    constructor(blockchain) {
        this.blockchain = blockchain;
        this.sockets = [];
    }

    listen(p2pPort) {
        const server = new WebSocket.Server({ port: p2pPort });
        server.on('connection', socket => this.connectSocket(socket));
        console.log(`Listening for p2p connections on port: ${p2pPort}`);
    }

    connectToPeers(newPeers) {
        newPeers.forEach(peer => {
            const socket = new WebSocket(peer);
            socket.on('open', () => this.connectSocket(socket));
            socket.on('error', () => console.log('Connection failed'));
        });
    }

    connectSocket(socket) {
        this.sockets.push(socket);
        console.log('Socket connected');
        this.messageHandler(socket);
        this.sendQuery(socket);
    }

    messageHandler(socket) {
        socket.on('message', async (data) => {
            const message = JSON.parse(data);
            switch (message.type) {
                case MESSAGE_TYPES.QUERY_LATEST:
                    this.sendLatestBlock(socket);
                    break;
                case MESSAGE_TYPES.QUERY_ALL:
                    this.sendChain(socket);
                    break;
                case MESSAGE_TYPES.RESPONSE_BLOCKCHAIN:
                    await this.handleBlockchainResponse(message);
                    break;
                case MESSAGE_TYPES.NEW_BLOCK:
                    this.handleNewBlock(message.data);
                    break;
                case MESSAGE_TYPES.NEW_TRANSACTION:
                    this.handleNewTransaction(message.data);
                    break;
            }
        });
    }

    sendLatestBlock(socket) {
        socket.send(JSON.stringify({
            type: MESSAGE_TYPES.RESPONSE_BLOCKCHAIN,
            data: [this.blockchain.getLatestBlock()]
        }));
    }

    sendChain(socket) {
        socket.send(JSON.stringify({
            type: MESSAGE_TYPES.RESPONSE_BLOCKCHAIN,
            data: this.blockchain.chain
        }));
    }

    broadcastLatest() {
        this.broadcast({
            type: MESSAGE_TYPES.RESPONSE_BLOCKCHAIN,
            data: [this.blockchain.getLatestBlock()]
        });
    }

    broadcastTransaction(transaction) {
        this.broadcast({
            type: MESSAGE_TYPES.NEW_TRANSACTION,
            data: transaction
        });
    }

    broadcast(message) {
        this.sockets.forEach(socket => socket.send(JSON.stringify(message)));
    }

    async handleBlockchainResponse(message) {
        const receivedBlocks = message.data.sort((b1, b2) => b1.timestamp - b2.timestamp);
        const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
        const latestBlockHeld = this.blockchain.getLatestBlock();

        if (latestBlockReceived.timestamp > latestBlockHeld.timestamp) {
            if (latestBlockReceived.previousHash === latestBlockHeld.hash) {
                try {
                    this.blockchain.chain.push(latestBlockReceived);
                    await this.blockchain.saveToDb();
                    this.broadcast(message);
                } catch (e) {
                    console.log('Invalid block received');
                }
            } else if (receivedBlocks.length === 1) {
                this.broadcast({ type: MESSAGE_TYPES.QUERY_ALL });
            } else {
                await this.blockchain.findLongestChain(receivedBlocks);
            }
        }
    }

    handleNewBlock(block) {
        if (block.previousHash === this.blockchain.getLatestBlock().hash) {
            try {
                this.blockchain.chain.push(block);
                this.blockchain.saveToDb();
                this.broadcast({
                    type: MESSAGE_TYPES.NEW_BLOCK,
                    data: block
                });
            } catch (e) {
                console.log('Invalid block received');
            }
        }
    }

    handleNewTransaction(transaction) {
        try {
            this.blockchain.addTransaction(transaction);
            this.broadcast({
                type: MESSAGE_TYPES.NEW_TRANSACTION,
                data: transaction
            });
        } catch (e) {
            console.log('Invalid transaction received');
        }
    }

    sendQuery(socket) {
        socket.send(JSON.stringify({ type: MESSAGE_TYPES.QUERY_LATEST }));
    }
}

module.exports = P2PServer; 