import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardHeader,
  CardContent,
  Divider,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  AlertTitle,
  Snackbar
} from '@mui/material';
import {
  Memory as MiningIcon,
  PendingActions as PendingIcon
} from '@mui/icons-material';
import { getPendingTransactions, mineBlock } from '../services/api';
import { Transaction } from '../services/api';
import { getBalance } from '../services/api';

const Mining: React.FC = () => {
  const [minerAddress, setMinerAddress] = useState('');
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [miningInProgress, setMiningInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [miningResult, setMiningResult] = useState<any | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPendingTransactions = async () => {
      try {
        setLoading(true);
        const response = await getPendingTransactions();
        setPendingTransactions(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching pending transactions:', err);
        setError('获取待处理交易失败，请检查区块链节点是否运行');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingTransactions();
    // 每10秒刷新一次数据
    const interval = setInterval(fetchPendingTransactions, 10000);
    return () => clearInterval(interval);
  }, []);

  // 添加刷新钱包余额的函数
  const refreshWalletBalance = async (address: string) => {
    try {
      // 从本地存储获取钱包列表
      const storedWallets = localStorage.getItem('blockchainWallets');
      if (!storedWallets) return;

      const wallets = JSON.parse(storedWallets);
      const updatedWallets = [...wallets];
      let hasUpdates = false;

      // 更新指定地址的钱包余额
      for (let i = 0; i < updatedWallets.length; i++) {
        if (updatedWallets[i].publicKey === address) {
          const response = await getBalance(address);
          if (updatedWallets[i].balance !== response.data.balance) {
            updatedWallets[i].balance = response.data.balance;
            hasUpdates = true;
          }
          break;
        }
      }

      if (hasUpdates) {
        localStorage.setItem('blockchainWallets', JSON.stringify(updatedWallets));
      }
    } catch (err) {
      console.error('Error refreshing wallet balance:', err);
    }
  };

  const handleMineBlock = async () => {
    if (!minerAddress) {
      setError('请输入矿工地址');
      return;
    }

    try {
      setMiningInProgress(true);
      setError(null);
      
      const response = await mineBlock(minerAddress);
      setMiningResult(response.data);
      
      // 显示成功消息
      setSuccessMessage('新区块已成功挖掘！');
      
      // 刷新待处理交易列表
      const pendingTxResponse = await getPendingTransactions();
      setPendingTransactions(pendingTxResponse.data);

      // 立即刷新矿工钱包余额
      await refreshWalletBalance(minerAddress);
    } catch (err: any) {
      console.error('Error mining block:', err);
      setError(err.response?.data?.error || '挖矿失败，请重试');
    } finally {
      setMiningInProgress(false);
    }
  };

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  if (loading && !miningInProgress) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        区块挖掘
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader title="挖掘新区块" />
            <Divider />
            <CardContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              )}

              <Typography variant="body1" paragraph>
                挖掘新区块会将所有待处理交易打包到一个新的区块中，并将其添加到区块链。
                为了奖励您的贡献，您将获得 100 个代币作为挖矿奖励。
              </Typography>

              <TextField
                label="矿工地址 (公钥)"
                fullWidth
                value={minerAddress}
                onChange={(e) => setMinerAddress(e.target.value)}
                margin="normal"
                required
                disabled={miningInProgress}
                helperText="挖矿奖励将发送到这个地址"
              />

              <Box mt={3}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  startIcon={<MiningIcon />}
                  onClick={handleMineBlock}
                  disabled={miningInProgress}
                >
                  {miningInProgress ? (
                    <>
                      <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                      正在挖掘...
                    </>
                  ) : (
                    '开始挖矿'
                  )}
                </Button>
              </Box>

              {miningResult && (
                <Box mt={3}>
                  <Alert severity="success">
                    <AlertTitle>挖矿成功！</AlertTitle>
                    <Typography variant="body2" gutterBottom>
                      新区块已成功添加到区块链。
                    </Typography>
                    <Typography variant="body2">
                      <strong>区块哈希:</strong> {miningResult.block.hash.substring(0, 20)}...
                    </Typography>
                    <Typography variant="body2">
                      <strong>Nonce:</strong> {miningResult.block.nonce}
                    </Typography>
                    <Typography variant="body2">
                      <strong>奖励:</strong> 100 币已发送到您的钱包
                    </Typography>
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader 
              title="待处理交易" 
              subheader={`将被包含在下一个区块中的交易 (${pendingTransactions.length})`}
              avatar={<PendingIcon />}
            />
            <Divider />
            <CardContent sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {pendingTransactions.length > 0 ? (
                <List>
                  {pendingTransactions.map((tx, index) => (
                    <Paper key={index} elevation={1} sx={{ mb: 2, p: 2 }}>
                      <ListItem disablePadding sx={{ display: 'block' }}>
                        <Grid container spacing={1}>
                          <Grid item xs={12}>
                            <Typography variant="subtitle2">
                              {tx.fromAddress ? '转账交易' : '挖矿奖励'}
                              {' '}
                              <Chip 
                                label="待确认" 
                                color="warning" 
                                size="small" 
                                sx={{ ml: 1 }} 
                              />
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              <strong>发送方:</strong> {tx.fromAddress ? 
                                tx.fromAddress.substring(0, 15) + '...' : 
                                '系统（挖矿奖励）'
                              }
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              <strong>接收方:</strong> {tx.toAddress.substring(0, 15)}...
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              <strong>金额:</strong> {tx.amount} 币
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary">
                              <strong>时间:</strong> {new Date(tx.timestamp).toLocaleString()}
                            </Typography>
                          </Grid>
                        </Grid>
                      </ListItem>
                    </Paper>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="textSecondary">
                    目前没有待处理的交易。
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                    您可以在交易页面创建新交易。
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseSuccessMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSuccessMessage} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Mining; 