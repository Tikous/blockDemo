import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  Divider,
  TextField,
  Button,
  Grid,
  Alert,
  Tooltip,
  Snackbar
} from '@mui/material';
import { 
  Send as SendIcon, 
  AddCircleOutline as CreateIcon 
} from '@mui/icons-material';
import { getBlocks, getPendingTransactions, createTransaction } from '../services/api';
import { Block, Transaction } from '../services/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const Transactions: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [confirmedTransactions, setConfirmedTransactions] = useState<Transaction[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 新交易表单状态
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [privateKey, setPrivateKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const [blocksResponse, pendingTxResponse] = await Promise.all([
          getBlocks(),
          getPendingTransactions()
        ]);
        
        // 从所有区块中提取已确认的交易
        const blocks: Block[] = blocksResponse.data;
        const allTransactions: Transaction[] = [];
        blocks.forEach(block => {
          block.transactions.forEach(tx => {
            allTransactions.push({
              ...tx,
              blockIndex: blocks.indexOf(block) // 添加区块索引信息
            });
          });
        });
        
        setConfirmedTransactions(allTransactions);
        setPendingTransactions(pendingTxResponse.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('获取交易数据失败，请检查区块链节点是否运行');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
    // 每30秒刷新一次数据
    const interval = setInterval(fetchTransactions, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromAddress || !toAddress || amount === '' || !privateKey) {
      setFormError('请填写所有字段');
      return;
    }

    if (typeof amount === 'number' && amount <= 0) {
      setFormError('金额必须大于 0');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      
      await createTransaction({
        fromAddress,
        toAddress,
        amount: typeof amount === 'number' ? amount : parseFloat(amount),
        privateKey
      });
      
      // 清空表单
      setFromAddress('');
      setToAddress('');
      setAmount('');
      setPrivateKey('');
      
      // 显示成功消息
      setSuccessMessage('交易已成功创建并添加到待处理队列');
      
      // 刷新待处理交易列表
      const pendingTxResponse = await getPendingTransactions();
      setPendingTransactions(pendingTxResponse.data);
      
      // 自动切换到待处理交易标签页
      setTabValue(1);
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      setFormError(err.response?.data?.error || '创建交易失败，请检查您的输入');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error" variant="h6">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        交易管理
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={3}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="transaction tabs"
                variant="fullWidth"
              >
                <Tab label={`已确认交易 (${confirmedTransactions.length})`} />
                <Tab label={`待处理交易 (${pendingTransactions.length})`} />
              </Tabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>发送方</TableCell>
                      <TableCell>接收方</TableCell>
                      <TableCell>金额</TableCell>
                      <TableCell>时间</TableCell>
                      <TableCell>区块</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {confirmedTransactions.length > 0 ? (
                      confirmedTransactions.map((tx, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            {tx.fromAddress ? (
                              <Tooltip title={tx.fromAddress}>
                                <Typography sx={{ fontFamily: 'monospace' }}>
                                  {tx.fromAddress.substring(0, 10)}...
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Chip label="系统奖励" color="success" size="small" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={tx.toAddress}>
                              <Typography sx={{ fontFamily: 'monospace' }}>
                                {tx.toAddress.substring(0, 10)}...
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {tx.amount} 币
                            {!tx.fromAddress && (
                              <Typography variant="caption" color="success.main" sx={{ ml: 1 }}>
                                (挖矿奖励)
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(tx.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`区块 #${tx.blockIndex}`} 
                              color="primary" 
                              size="small" 
                              variant="outlined" 
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">暂无确认交易</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>发送方</TableCell>
                      <TableCell>接收方</TableCell>
                      <TableCell>金额</TableCell>
                      <TableCell>时间</TableCell>
                      <TableCell>状态</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingTransactions.length > 0 ? (
                      pendingTransactions.map((tx, index) => (
                        <TableRow key={index} hover>
                          <TableCell>
                            {tx.fromAddress ? (
                              <Tooltip title={tx.fromAddress}>
                                <Typography sx={{ fontFamily: 'monospace' }}>
                                  {tx.fromAddress.substring(0, 10)}...
                                </Typography>
                              </Tooltip>
                            ) : (
                              <Chip label="系统奖励" color="success" size="small" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Tooltip title={tx.toAddress}>
                              <Typography sx={{ fontFamily: 'monospace' }}>
                                {tx.toAddress.substring(0, 10)}...
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            {tx.amount} 币
                            {!tx.fromAddress && (
                              <Typography variant="caption" color="success.main" sx={{ ml: 1 }}>
                                (挖矿奖励)
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(tx.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Chip label="待确认" color="warning" size="small" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">暂无待处理交易</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={3}>
            <CardHeader title="创建新交易" />
            <Divider />
            <CardContent>
              {formError && (
                <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
              )}

              <form onSubmit={handleCreateTransaction}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="发送方地址 (公钥)"
                      fullWidth
                      value={fromAddress}
                      onChange={(e) => setFromAddress(e.target.value)}
                      margin="normal"
                      size="small"
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="接收方地址 (公钥)"
                      fullWidth
                      value={toAddress}
                      onChange={(e) => setToAddress(e.target.value)}
                      margin="normal"
                      size="small"
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="金额"
                      type="number"
                      fullWidth
                      value={amount}
                      onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      margin="normal"
                      size="small"
                      required
                      inputProps={{ min: 0.1, step: 0.1 }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="私钥"
                      type="password"
                      fullWidth
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      margin="normal"
                      size="small"
                      required
                      helperText="发送方的私钥用于签名交易"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<SendIcon />}
                      disabled={submitting}
                    >
                      {submitting ? '处理中...' : '发送交易'}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>

          <Box mt={3}>
            <Button
              variant="outlined"
              startIcon={<CreateIcon />}
              fullWidth
              href="/wallet"
            >
              创建新钱包
            </Button>
          </Box>
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

export default Transactions; 