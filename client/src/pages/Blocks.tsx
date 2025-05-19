import React, { useEffect, useState } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getBlocks } from '../services/api';
import { Block } from '../services/api';

const Blocks: React.FC = () => {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        setLoading(true);
        const response = await getBlocks();
        setBlocks(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching blocks:', err);
        setError('获取区块数据失败，请检查区块链节点是否运行');
      } finally {
        setLoading(false);
      }
    };

    fetchBlocks();
    // 每30秒刷新一次数据
    const interval = setInterval(fetchBlocks, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleViewBlockDetails = (index: number) => {
    navigate(`/blocks/${index}`);
  };

  const formatHash = (hash: string) => {
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 10)}`;
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
        区块列表
      </Typography>
      <Typography variant="body1" paragraph>
        当前链上共有 <strong>{blocks.length}</strong> 个区块。
      </Typography>

      <TableContainer component={Paper} elevation={3}>
        <Table aria-label="区块列表">
          <TableHead>
            <TableRow>
              <TableCell>索引</TableCell>
              <TableCell>哈希值</TableCell>
              <TableCell>前一区块哈希</TableCell>
              <TableCell>时间戳</TableCell>
              <TableCell>交易数量</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {blocks.map((block, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <Chip 
                    label={`#${index}`} 
                    color={index === 0 ? "success" : "primary"} 
                    size="small"
                    variant={index === blocks.length - 1 ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell>{formatHash(block.hash)}</TableCell>
                <TableCell>{formatHash(block.previousHash)}</TableCell>
                <TableCell>{new Date(block.timestamp).toLocaleString()}</TableCell>
                <TableCell>{block.transactions.length}</TableCell>
                <TableCell>
                  <Tooltip title="查看区块详情">
                    <IconButton 
                      size="small" 
                      color="primary" 
                      onClick={() => handleViewBlockDetails(index)}
                    >
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Blocks; 