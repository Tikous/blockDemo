const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { ec: EC } = require('elliptic');
const ec = new EC('secp256k1');

class HttpServer {
    constructor(blockchain, p2pServer) {
        this.blockchain = blockchain;
        this.p2pServer = p2pServer;
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(bodyParser.json());
        this.app.use(cors());
    }

    setupRoutes() {
        // Get the entire blockchain
        this.app.get('/blocks', (req, res) => {
            res.json(this.blockchain.chain);
        });

        // Get a specific block by index
        this.app.get('/blocks/:index', (req, res) => {
            const blockIndex = parseInt(req.params.index);
            if (blockIndex < 0 || blockIndex >= this.blockchain.chain.length) {
                return res.status(404).json({ error: 'Block not found' });
            }
            res.json(this.blockchain.chain[blockIndex]);
        });

        // Mine a new block
        this.app.post('/mine', (req, res) => {
            const { minerAddress } = req.body;
            if (!minerAddress) {
                return res.status(400).json({ error: 'Miner address is required' });
            }

            this.blockchain.minePendingTransactions(minerAddress);
            this.p2pServer.broadcastLatest();
            res.json({ message: 'New block mined!', block: this.blockchain.getLatestBlock() });
        });

        // Create a new transaction
        this.app.post('/transaction', (req, res) => {
            const { fromAddress, toAddress, amount, privateKey } = req.body;

            try {
                const keyPair = ec.keyFromPrivate(privateKey);
                const transaction = this.blockchain.createTransaction(fromAddress, toAddress, amount);
                transaction.signTransaction(keyPair);
                
                this.blockchain.addTransaction(transaction);
                this.p2pServer.broadcastTransaction(transaction);
                
                res.json({ message: 'Transaction added to pending transactions', transaction });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });

        // Get pending transactions
        this.app.get('/pending-transactions', (req, res) => {
            res.json(this.blockchain.pendingTransactions);
        });

        // Get balance of an address
        this.app.get('/balance/:address', (req, res) => {
            const { address } = req.params;
            const balance = this.blockchain.getBalance(address);
            res.json({ address, balance });
        });

        // Get UTXO set for an address
        this.app.get('/utxo/:address', (req, res) => {
            const { address } = req.params;
            const utxos = [];
            
            for (const [utxoKey, utxo] of this.blockchain.utxoSet) {
                if (utxo.address === address) {
                    utxos.push({ ...utxo, utxoKey });
                }
            }
            
            res.json(utxos);
        });

        // Add a new peer
        this.app.post('/peers', (req, res) => {
            const { peer } = req.body;
            this.p2pServer.connectToPeers([peer]);
            res.json({ message: 'Peer added', peer });
        });

        // Get connected peers
        this.app.get('/peers', (req, res) => {
            res.json(this.p2pServer.sockets.map(s => s._socket.remoteAddress + ':' + s._socket.remotePort));
        });

        // Generate new wallet
        this.app.post('/wallet/new', (req, res) => {
            const keyPair = ec.genKeyPair();
            res.json({
                privateKey: keyPair.getPrivate('hex'),
                publicKey: keyPair.getPublic('hex')
            });
        });
    }

    listen(httpPort) {
        this.app.listen(httpPort, () => {
            console.log(`HTTP Server listening on port ${httpPort}`);
        });
    }
}

module.exports = HttpServer; 