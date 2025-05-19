const crypto = require('crypto');
const { ec: EC } = require('elliptic');
const ec = new EC('secp256k1');

class Transaction {
    constructor(fromAddress, toAddress, amount, inputs = [], outputs = []) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
        this.inputs = inputs;  // UTXO inputs
        this.outputs = outputs;  // UTXO outputs
        this.signature = '';

        // 如果是挖矿奖励交易，直接创建输出
        if (fromAddress === null) {
            this.outputs.push({
                address: toAddress,
                amount: amount
            });
        }
    }

    calculateHash() {
        return crypto
            .createHash('sha256')
            .update(this.fromAddress + this.toAddress + this.amount + this.timestamp + JSON.stringify(this.inputs) + JSON.stringify(this.outputs))
            .digest('hex');
    }

    signTransaction(signingKey) {
        if (signingKey.getPublic('hex') !== this.fromAddress) {
            throw new Error('You cannot sign transactions for other wallets!');
        }

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid() {
        if (this.fromAddress === null) return true; // Mining reward

        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }

    // Calculate total input amount from UTXOs
    getTotalInput() {
        return this.inputs.reduce((total, input) => total + input.amount, 0);
    }

    // Create UTXO outputs
    createOutputs() {
        const totalInput = this.getTotalInput();
        if (totalInput < this.amount) {
            throw new Error('Not enough input amount');
        }

        // Create output for recipient
        this.outputs.push({
            address: this.toAddress,
            amount: this.amount
        });

        // Create change output if necessary
        const change = totalInput - this.amount;
        if (change > 0) {
            this.outputs.push({
                address: this.fromAddress,
                amount: change
            });
        }
    }
}

module.exports = Transaction; 