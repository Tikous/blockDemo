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
  Alert,
  Tooltip,
  IconButton,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { createWallet, getBalance, getUTXO } from '../services/api';
import { Wallet as WalletType, UTXO } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface StoredWallet extends WalletType {
  label: string;
  balance?: number;
}

const Wallet: React.FC = () => {
  const [wallets, setWallets] = useState<StoredWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<StoredWallet | null>(null);
  const [utxos, setUtxos] = useState<UTXO[]>([]);
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletName, setWalletName] = useState('');
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // 从本地存储加载钱包
  useEffect(() => {
    const loadWallets = () => {
      const storedWallets = localStorage.getItem('blockchainWallets');
      if (storedWallets) {
        setWallets(JSON.parse(storedWallets));
      }
    };

    loadWallets();
  }, []);

  // 获取钱包余额
  useEffect(() => {
    const fetchWalletBalances = async () => {
      if (wallets.length === 0) return;

      const updatedWallets = [...wallets];
      let hasUpdates = false;

      for (let i = 0; i < updatedWallets.length; i++) {
        try {
          const response = await getBalance(updatedWallets[i].publicKey);
          if (updatedWallets[i].balance !== response.data.balance) {
            updatedWallets[i].balance = response.data.balance;
            hasUpdates = true;
          }
        } catch (err) {
          console.error(`Error fetching balance for wallet ${updatedWallets[i].label}:`, err);
        }
      }

      if (hasUpdates) {
        setWallets(updatedWallets);
        localStorage.setItem('blockchainWallets', JSON.stringify(updatedWallets));
      }
    };

    fetchWalletBalances();
    // 每10秒刷新一次余额
    const interval = setInterval(fetchWalletBalances, 10000);
    return () => clearInterval(interval);
  }, [wallets]);

  // 获取选定钱包的UTXO
  useEffect(() => {
    const fetchUTXOs = async () => {
      if (!selectedWallet) {
        setUtxos([]);
        return;
      }

      try {
        setWalletLoading(true);
        const response = await getUTXO(selectedWallet.publicKey);
        setUtxos(response.data);
      } catch (err) {
        console.error('Error fetching UTXOs:', err);
      } finally {
        setWalletLoading(false);
      }
    };

    fetchUTXOs();
  }, [selectedWallet]);

  const handleCreateWallet = async () => {
    if (!walletName.trim()) {
      setError('请输入钱包名称');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await createWallet();
      const newWallet: StoredWallet = {
        ...response.data,
        label: walletName,
        balance: 0
      };
      
      const updatedWallets = [...wallets, newWallet];
      setWallets(updatedWallets);
      
      // 保存到本地存储
      localStorage.setItem('blockchainWallets', JSON.stringify(updatedWallets));
      
      // 清空表单
      setWalletName('');
      
      // 选择新创建的钱包
      setSelectedWallet(newWallet);
    } catch (err: any) {
      console.error('Error creating wallet:', err);
      setError('创建钱包失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWallet = (wallet: StoredWallet) => {
    setSelectedWallet(wallet);
  };

  const handleRefreshBalance = async () => {
    if (!selectedWallet) return;

    try {
      setWalletLoading(true);
      
      // 刷新余额
      const balanceResponse = await getBalance(selectedWallet.publicKey);
      
      // 更新钱包列表中的余额
      const updatedWallets = wallets.map(wallet => 
        wallet.publicKey === selectedWallet.publicKey
          ? { ...wallet, balance: balanceResponse.data.balance }
          : wallet
      );
      
      setWallets(updatedWallets);
      setSelectedWallet({ ...selectedWallet, balance: balanceResponse.data.balance });
      
      // 保存到本地存储
      localStorage.setItem('blockchainWallets', JSON.stringify(updatedWallets));
      
      // 刷新UTXO
      const utxoResponse = await getUTXO(selectedWallet.publicKey);
      setUtxos(utxoResponse.data);
    } catch (err) {
      console.error('Error refreshing wallet:', err);
    } finally {
      setWalletLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopyMessage(`${type}已复制到剪贴板`);
  };

  const handleCreateTransaction = () => {
    if (selectedWallet) {
      navigate('/transactions', { 
        state: { 
          fromAddress: selectedWallet.publicKey,
          privateKey: selectedWallet.privateKey
        } 
      });
    }
  };

  const handleCloseCopyMessage = () => {
    setCopyMessage(null);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        钱包管理
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardHeader title="我的钱包" />
            <Divider />
            <CardContent>
              {wallets.length > 0 ? (
                <Box>
                  {wallets.map((wallet, index) => (
                    <Paper
                      key={index}
                      elevation={selectedWallet?.publicKey === wallet.publicKey ? 3 : 1}
                      sx={{
                        p: 2,
                        mb: 2,
                        cursor: 'pointer',
                        borderLeft: selectedWallet?.publicKey === wallet.publicKey
                          ? '4px solid #2196f3'
                          : 'none'
                      }}
                      onClick={() => handleSelectWallet(wallet)}
                    >
                      <Typography variant="subtitle1" gutterBottom>
                        {wallet.label}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ wordBreak: 'break-all' }}>
                        {wallet.publicKey.substring(0, 16)}...
                      </Typography>
                      <Typography variant="h6" sx={{ mt: 1 }}>
                        {wallet.balance !== undefined ? `${wallet.balance} 币` : '加载中...'}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    您还没有钱包，请创建一个新钱包
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              )}

              <TextField
                label="钱包名称"
                fullWidth
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                margin="normal"
                size="small"
                disabled={loading}
              />

              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<AddIcon />}
                onClick={handleCreateWallet}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : '创建新钱包'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedWallet ? (
            <Card elevation={3}>
              <CardHeader 
                title={`钱包详情: ${selectedWallet.label}`}
                action={
                  <Button
                    startIcon={<RefreshIcon />}
                    onClick={handleRefreshBalance}
                    disabled={walletLoading}
                  >
                    {walletLoading ? <CircularProgress size={24} /> : '刷新'}
                  </Button>
                }
              />
              <Divider />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">公钥 (地址)</Typography>
                    <Box display="flex" alignItems="center">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace',
                          wordBreak: 'break-all'
                        }}
                      >
                        {selectedWallet.publicKey}
                      </Typography>
                      <Tooltip title="复制公钥">
                        <IconButton 
                          size="small" 
                          onClick={() => copyToClipboard(selectedWallet.publicKey, '公钥')}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">私钥</Typography>
                    <Box display="flex" alignItems="center">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'monospace',
                          wordBreak: 'break-all'
                        }}
                      >
                        {selectedWallet.privateKey.substring(0, 10)}...
                        {selectedWallet.privateKey.substring(selectedWallet.privateKey.length - 10)}
                      </Typography>
                      <Tooltip title="复制私钥">
                        <IconButton 
                          size="small" 
                          onClick={() => copyToClipboard(selectedWallet.privateKey, '私钥')}
                        >
                          <CopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="caption" color="error">
                      警告：请安全保管您的私钥，不要分享给任何人。
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="textSecondary">余额</Typography>
                    <Typography variant="h5">
                      {selectedWallet.balance !== undefined ? `${selectedWallet.balance} 币` : '加载中...'}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SendIcon />}
                      onClick={handleCreateTransaction}
                      disabled={!selectedWallet.balance || selectedWallet.balance <= 0}
                      sx={{ mt: 2 }}
                    >
                      发送币
                    </Button>
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant="subtitle1">UTXO 集合</Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      未花费的交易输出
                    </Typography>

                    {walletLoading ? (
                      <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                      </Box>
                    ) : utxos.length > 0 ? (
                      <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>UTXO ID</TableCell>
                              <TableCell align="right">金额</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {utxos.map((utxo, index) => (
                              <TableRow key={index}>
                                <TableCell component="th" scope="row">
                                  {utxo.utxoKey ? (
                                    utxo.utxoKey.substring(0, 10) + '...'
                                  ) : (
                                    `UTXO #${index + 1}`
                                  )}
                                </TableCell>
                                <TableCell align="right">{utxo.amount} 币</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography color="textSecondary">
                          此钱包没有未花费的交易输出
                        </Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <Card elevation={3}>
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  没有选择钱包
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  请从左侧选择一个钱包，或创建一个新钱包
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <Snackbar
        open={!!copyMessage}
        autoHideDuration={3000}
        onClose={handleCloseCopyMessage}
        message={copyMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default Wallet; 