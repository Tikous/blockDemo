import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Grid, 
  Paper, 
  Box,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Divider
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Link } from 'react-router-dom';
import { getBlocks, getPendingTransactions } from '../services/api';
import { Block, Transaction } from '../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [blocksResponse, pendingTxResponse] = await Promise.all([
          getBlocks(),
          getPendingTransactions()
        ]);
        setBlocks(blocksResponse.data);
        setPendingTransactions(pendingTxResponse.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('获取数据失败，请检查区块链节点是否运行');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // 每10秒刷新一次数据
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // 为图表准备数据
  const blockSizeData = blocks.map((block, index) => ({
    name: `区块 ${index}`,
    交易数: block.transactions.length,
    索引: index
  }));

  const hashRateData = blocks.slice(1).map((block, index) => ({
    name: `区块 ${index + 1}`,
    难度: block.hash.substring(0, block.hash.length / 10).split('0').length - 1,
    nonce: block.nonce,
    索引: index + 1
  }));

  const transactionDistribution = blocks.reduce((acc: { name: string; value: number }[], block) => {
    block.transactions.forEach(tx => {
      if (!tx.fromAddress) return; // 忽略挖矿奖励交易

      const existingEntry = acc.find(entry => entry.name === tx.fromAddress);
      if (existingEntry) {
        existingEntry.value += 1;
      } else {
        acc.push({ name: tx.fromAddress.substring(0, 10) + '...', value: 1 });
      }
    });
    return acc;
  }, []);

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
        区块链概览
      </Typography>

      {/* 主要统计信息 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              区块总数
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {blocks.length}
            </Typography>
            <Typography variant="body2" component={Link} to="/blocks" sx={{ textDecoration: 'none' }}>
              查看所有区块
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              总交易数
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {blocks.reduce((sum, block) => sum + block.transactions.length, 0)}
            </Typography>
            <Typography variant="body2" component={Link} to="/transactions" sx={{ textDecoration: 'none' }}>
              查看所有交易
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              待处理交易
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {pendingTransactions.length}
            </Typography>
            <Typography variant="body2" component={Link} to="/mining" sx={{ textDecoration: 'none' }}>
              挖掘新区块
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              当前难度
            </Typography>
            <Typography variant="h3" component="div" sx={{ flexGrow: 1 }}>
              {blocks.length > 0 ? blocks[blocks.length - 1].hash.substring(0, 4).split('0').length - 1 : 0}
            </Typography>
            <Typography variant="body2">
              平均每10秒出块
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 图表 */}
      <Grid container spacing={3}>
        {/* 区块大小图表 */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader title="区块交易数" />
            <Divider />
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={blockSizeData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [value, '交易数']}
                    labelFormatter={(label) => {
                      // 从标签中提取区块索引
                      const match = label.match(/区块 (\d+)/);
                      if (match && match[1]) {
                        return `区块 ${match[1]}`;
                      }
                      return label;
                    }}
                  />
                  <Bar dataKey="交易数" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 哈希率/难度图表 */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader title="区块挖掘难度和Nonce" />
            <Divider />
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={hashRateData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="难度" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="nonce" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 交易分布图表 */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader title="交易发送方分布" />
            <Divider />
            <CardContent sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={transactionDistribution.length > 0 ? transactionDistribution : [{ name: '暂无数据', value: 1 }]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {transactionDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} 交易`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* 最新区块信息 */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader title="最新区块信息" />
            <Divider />
            <CardContent>
              {blocks.length > 0 ? (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    <strong>哈希值:</strong> {blocks[blocks.length - 1].hash.substring(0, 20)}...
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>前一区块哈希:</strong> {blocks[blocks.length - 1].previousHash.substring(0, 20)}...
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>时间戳:</strong> {new Date(blocks[blocks.length - 1].timestamp).toLocaleString()}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>交易数:</strong> {blocks[blocks.length - 1].transactions.length}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Nonce:</strong> {blocks[blocks.length - 1].nonce}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>默克尔根:</strong> {blocks[blocks.length - 1].merkleRoot.substring(0, 20)}...
                  </Typography>
                  <Box mt={2}>
                    <Typography 
                      variant="body2" 
                      component={Link} 
                      to={`/blocks/${blocks.length - 1}`} 
                      sx={{ textDecoration: 'none' }}
                    >
                      查看完整区块详情
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body1">暂无区块数据</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 