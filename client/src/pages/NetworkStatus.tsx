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
  ListItemIcon,
  ListItemText,
  Alert,
  Snackbar,
  Chip
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Add as AddIcon,
  Dns as DnsIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';
import { getPeers, addPeer } from '../services/api';

const NetworkStatus: React.FC = () => {
  const [peers, setPeers] = useState<string[]>([]);
  const [newPeer, setNewPeer] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingPeer, setAddingPeer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchPeers = async () => {
      try {
        setLoading(true);
        const response = await getPeers();
        setPeers(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching peers:', err);
        setError('获取节点信息失败，请检查区块链节点是否运行');
      } finally {
        setLoading(false);
      }
    };

    fetchPeers();
    // 每30秒刷新一次数据
    const interval = setInterval(fetchPeers, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAddPeer = async () => {
    if (!newPeer.trim()) {
      setError('请输入节点地址');
      return;
    }

    if (!newPeer.startsWith('ws://') && !newPeer.startsWith('wss://')) {
      setError('节点地址必须以 ws:// 或 wss:// 开头');
      return;
    }

    try {
      setAddingPeer(true);
      setError(null);
      
      await addPeer(newPeer);
      
      // 刷新节点列表
      const response = await getPeers();
      setPeers(response.data);
      
      // 清空表单
      setNewPeer('');
      
      // 显示成功消息
      setSuccessMessage('新节点已成功添加到网络');
    } catch (err: any) {
      console.error('Error adding peer:', err);
      setError(err.response?.data?.error || '添加节点失败，请检查节点地址');
    } finally {
      setAddingPeer(false);
    }
  };

  const handleCloseSuccessMessage = () => {
    setSuccessMessage(null);
  };

  if (loading && !addingPeer) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        网络状态
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader 
              title="连接的节点" 
              subheader={`当前共有 ${peers.length} 个连接的节点`}
              avatar={<DnsIcon />}
            />
            <Divider />
            <CardContent>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
              )}

              {peers.length > 0 ? (
                <List>
                  {peers.map((peer, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <ComputerIcon />
                      </ListItemIcon>
                      <ListItemText 
                        primary={peer} 
                        secondary={
                          index === 0 ? (
                            <Chip size="small" label="自身节点" color="primary" />
                          ) : (
                            "连接的节点"
                          )
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    没有发现连接的节点
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader 
              title="添加新节点" 
              avatar={<CloudIcon />}
            />
            <Divider />
            <CardContent>
              <Typography variant="body1" paragraph>
                添加新节点到您的区块链网络。新节点将与您当前的节点同步，并参与共识过程。
              </Typography>
              
              <TextField
                label="节点地址"
                placeholder="例如：ws://localhost:6002"
                fullWidth
                value={newPeer}
                onChange={(e) => setNewPeer(e.target.value)}
                margin="normal"
                helperText="节点地址必须以 ws:// 或 wss:// 开头"
                disabled={addingPeer}
              />

              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<AddIcon />}
                onClick={handleAddPeer}
                disabled={addingPeer}
                sx={{ mt: 2 }}
              >
                {addingPeer ? <CircularProgress size={24} /> : '添加节点'}
              </Button>
            </CardContent>
          </Card>

          <Card elevation={3} sx={{ mt: 3 }}>
            <CardHeader title="本地节点信息" />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">HTTP API</Typography>
                  <Typography variant="body1">http://localhost:3001</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">WebSocket P2P</Typography>
                  <Typography variant="body1">ws://localhost:6001</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">状态</Typography>
                  <Chip 
                    label="在线" 
                    color="success" 
                    size="small" 
                    icon={<DnsIcon />} 
                  />
                </Grid>
              </Grid>
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

export default NetworkStatus; 