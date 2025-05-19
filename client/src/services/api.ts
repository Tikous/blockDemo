import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 区块相关接口
export const getBlocks = () => api.get('/blocks');
export const getBlockByIndex = (index: number) => api.get(`/blocks/${index}`);

// 交易相关接口
export const getPendingTransactions = () => api.get('/pending-transactions');
export const createTransaction = (transaction: {
  fromAddress: string;
  toAddress: string;
  amount: number;
  privateKey: string;
}) => api.post('/transaction', transaction);

// 挖矿相关接口
export const mineBlock = (minerAddress: string) => api.post('/mine', { minerAddress });

// 钱包相关接口
export const createWallet = () => api.post('/wallet/new');
export const getBalance = (address: string) => api.get(`/balance/${address}`);
export const getUTXO = (address: string) => api.get(`/utxo/${address}`);

// 网络相关接口
export const getPeers = () => api.get('/peers');
export const addPeer = (peer: string) => api.post('/peers', { peer });

// 接口类型定义
export interface Block {
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  merkleRoot: string;
}

export interface Transaction {
  fromAddress: string | null;
  toAddress: string;
  amount: number;
  timestamp: number;
  inputs: UTXO[];
  outputs: Output[];
  signature: string;
  blockIndex?: number;
}

export interface UTXO {
  txHash: string;
  outputIndex: number;
  amount: number;
  utxoKey?: string;
}

export interface Output {
  address: string;
  amount: number;
}

export interface Wallet {
  privateKey: string;
  publicKey: string;
}

export interface Balance {
  address: string;
  balance: number;
}

export default api; 