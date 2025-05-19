const Block = require('./Block');
const Transaction = require('./Transaction');
const level = require('level');

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 4;
        this.pendingTransactions = [];
        this.miningReward = 100;
        this.targetBlockTime = 10000; // 10 seconds in milliseconds
        this.difficultyAdjustmentInterval = 10; // Adjust difficulty every 10 blocks
        this.db = level('./chaindata'); // Initialize LevelDB
        this.utxoSet = new Map(); // Store unspent transaction outputs
    }

    createGenesisBlock() {
        return new Block(Date.now(), [], "0");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    adjustDifficulty() {
        if (this.chain.length % this.difficultyAdjustmentInterval !== 0) {
            return this.difficulty;
        }

        const lastBlock = this.getLatestBlock();
        const prevAdjustmentBlock = this.chain[this.chain.length - this.difficultyAdjustmentInterval];
        const timeExpected = this.targetBlockTime * this.difficultyAdjustmentInterval;
        const timeTaken = lastBlock.timestamp - prevAdjustmentBlock.timestamp;

        if (timeTaken < timeExpected / 2) {
            return this.difficulty + 1;
        } else if (timeTaken > timeExpected * 2) {
            return Math.max(1, this.difficulty - 1);
        }
        return this.difficulty;
    }

    minePendingTransactions(miningRewardAddress) {
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);

        const block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.log('Block mined!');
        this.chain.push(block);

        // Update UTXO set
        this.updateUTXOSet(block);

        // Adjust difficulty
        this.difficulty = this.adjustDifficulty();

        // Clear pending transactions
        this.pendingTransactions = [];

        // Persist to database
        this.saveToDb();
    }

    addTransaction(transaction) {
        if (!transaction.fromAddress || !transaction.toAddress) {
            throw new Error('Transaction must include from and to address');
        }

        if (!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain');
        }

        if (transaction.amount <= 0) {
            throw new Error('Transaction amount should be higher than 0');
        }

        // Verify UTXO inputs
        const totalInput = transaction.getTotalInput();
        if (totalInput < transaction.amount) {
            throw new Error('Not enough balance');
        }

        transaction.createOutputs();
        this.pendingTransactions.push(transaction);
    }

    updateUTXOSet(block) {
        // Remove spent outputs
        for (const tx of block.transactions) {
            for (const input of tx.inputs) {
                this.utxoSet.delete(input.txHash + ':' + input.outputIndex);
            }
        }

        // Add new unspent outputs
        for (const tx of block.transactions) {
            const txHash = tx.calculateHash();
            tx.outputs.forEach((output, index) => {
                this.utxoSet.set(txHash + ':' + index, {
                    address: output.address,
                    amount: output.amount
                });
            });
        }
    }

    getBalance(address) {
        let balance = 0;
        for (const [_, utxo] of this.utxoSet) {
            if (utxo.address === address) {
                balance += utxo.amount;
            }
        }
        return balance;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (!currentBlock.hasValidTransactions()) {
                return false;
            }

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }
        return true;
    }

    async saveToDb() {
        try {
            await this.db.put('chain', JSON.stringify(this.chain));
            await this.db.put('utxoSet', JSON.stringify(Array.from(this.utxoSet.entries())));
        } catch (error) {
            console.error('Error saving to database:', error);
        }
    }

    async loadFromDb() {
        try {
            const chainData = await this.db.get('chain');
            const utxoData = await this.db.get('utxoSet');
            
            this.chain = JSON.parse(chainData);
            this.utxoSet = new Map(JSON.parse(utxoData));
        } catch (error) {
            if (error.type === 'NotFoundError') {
                console.log('No existing blockchain found in database');
            } else {
                console.error('Error loading from database:', error);
            }
        }
    }

    // Find the longest valid chain
    async findLongestChain(chains) {
        let longestChain = this.chain;
        let maxLength = this.chain.length;

        for (const chain of chains) {
            if (chain.length > maxLength && this.isValidChain(chain)) {
                longestChain = chain;
                maxLength = chain.length;
            }
        }

        if (longestChain !== this.chain) {
            this.chain = longestChain;
            await this.saveToDb();
        }

        return longestChain;
    }

    isValidChain(chain) {
        if (JSON.stringify(chain[0]) !== JSON.stringify(this.createGenesisBlock())) {
            return false;
        }

        for (let i = 1; i < chain.length; i++) {
            const block = chain[i];
            const previousBlock = chain[i - 1];

            if (block.previousHash !== previousBlock.hash) {
                return false;
            }

            if (block.hash !== block.calculateHash()) {
                return false;
            }

            if (!block.hasValidTransactions()) {
                return false;
            }
        }

        return true;
    }
}

module.exports = Blockchain; 