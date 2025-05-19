import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Paper,
  Grid,
  Divider,
  Chip,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { getBlockByIndex } from '../services/api';
import { Block, Transaction } from '../services/api';

const BlockDetails: React.FC = () => {
  const { blockIndex } = useParams<{ blockIndex: string }>();
  const [block, setBlock] = useState<Block | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const navigate = useNavigate();

  const index = blockIndex ? parseInt(blockIndex) : 0;

  useEffect(() => {
    const fetchBlockDetails = async () => {
      if (blockIndex === undefined) return;
      
      try {
        setLoading(true);
        const response = await getBlockByIndex(parseInt(blockIndex));
        setBlock(response.data);
        setError(null);
        
        // 获取总区块数
        const blocksResponse = await fetch('http://localhost:3001/blocks');
        const blocks = await blocksResponse.json();
        setTotalBlocks(blocks.length);
      } catch (err) {
        console.error('Error fetching block details:', err);
        setError('获取区块详情失败，请检查区块索引是否正确');
      } finally {
        setLoading(false);
      }
    };

    fetchBlockDetails();
  }, [blockIndex]);

  const handleNavigateToBlock = (targetIndex: number) => {
    navigate(`/blocks/${targetIndex}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // 可以添加一个弹窗通知用户复制成功
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !block) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <Typography color="error" variant="h6">{error || '未找到区块数据'}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          区块 #{index}
          {index === 0 && (
            <Chip 
              label="创世区块" 
              color="success" 
              size="small" 
              sx={{ ml: 1 }}
            />
          )}
        </Typography>

        <Box>
          <Button 
            variant="outlined" 
            startIcon={<PrevIcon />}
            disabled={index <= 0}
            onClick={() => handleNavigateToBlock(index - 1)}
            sx={{ mr: 1 }}
          >
            上一个区块
          </Button>
          <Button 
            variant="outlined" 
            endIcon={<NextIcon />}
            disabled={index >= totalBlocks - 1}
            onClick={() => handleNavigateToBlock(index + 1)}
          >
            下一个区块
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={3}>
            <CardHeader title="区块信息" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">区块哈希</Typography>
                  <Box display="flex" alignItems="center">
                    <Typography variant="body1" 
                      sx={{ 
                        fontFamily: 'monospace',
                        wordBreak: 'break-all'
                      }}
                    >
                      {block.hash}
                    </Typography>
                    <Tooltip title="复制哈希值">
                      <IconButton size="small" onClick={() => copyToClipboard(block.hash)}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">前一区块哈希</Typography>
                  <Box display="flex" alignItems="center">
                    <Typography variant="body1" 
                      sx={{ 
                        fontFamily: 'monospace',
                        wordBreak: 'break-all'
                      }}
                    >
                      {block.previousHash}
                    </Typography>
                    <Tooltip title="复制哈希值">
                      <IconButton size="small" onClick={() => copyToClipboard(block.previousHash)}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">默克尔根</Typography>
                  <Box display="flex" alignItems="center">
                    <Typography variant="body1" 
                      sx={{ 
                        fontFamily: 'monospace',
                        wordBreak: 'break-all'
                      }}
                    >
                      {block.merkleRoot}
                    </Typography>
                    <Tooltip title="复制默克尔根">
                      <IconButton size="small" onClick={() => copyToClipboard(block.merkleRoot)}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">时间戳</Typography>
                  <Typography variant="body1">
                    {new Date(block.timestamp).toLocaleString()}
                    {' '}
                    <Typography variant="caption" color="textSecondary">
                      ({block.timestamp})
                    </Typography>
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">Nonce</Typography>
                  <Typography variant="body1">{block.nonce}</Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="textSecondary">交易数量</Typography>
                  <Typography variant="body1">{block.transactions.length}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={3}>
            <CardHeader 
              title="区块交易" 
              subheader={`共 ${block.transactions.length} 笔交易`}
            />
            <Divider />
            <CardContent>
              {block.transactions.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>发送方</TableCell>
                        <TableCell>接收方</TableCell>
                        <TableCell>金额</TableCell>
                        <TableCell>时间</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {block.transactions.map((tx: Transaction, txIndex: number) => (
                        <TableRow key={txIndex}>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" align="center">此区块没有交易</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BlockDetails; 