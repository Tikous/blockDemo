import React, { useState } from 'react';
import { ThemeProvider, createTheme, CssBaseline, Box, Container } from '@mui/material';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Blocks from './pages/Blocks';
import BlockDetails from './pages/BlockDetails';
import Transactions from './pages/Transactions';
import Mining from './pages/Mining';
import Wallet from './pages/Wallet';
import NetworkStatus from './pages/NetworkStatus';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#2196f3',
      },
      secondary: {
        main: '#f50057',
      },
    },
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
          <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/blocks" element={<Blocks />} />
              <Route path="/blocks/:blockIndex" element={<BlockDetails />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/mining" element={<Mining />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/network" element={<NetworkStatus />} />
            </Routes>
          </Container>
          <Box component="footer" sx={{ p: 2, textAlign: 'center', borderTop: '1px solid #eaeaea' }}>
            <Box sx={{ color: 'text.secondary' }}>
              区块链演示 © {new Date().getFullYear()}
            </Box>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
