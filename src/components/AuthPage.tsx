import React, { useState } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import SignUpForm from './SignUpForm';
import LoginForm from './LoginForm';

interface AuthPageProps {
  onAuthSuccess?: (token: string, user: any) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAuthSuccess = (token: string, user: any) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    if (onAuthSuccess) {
      onAuthSuccess(token, user);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card sx={{ boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h4" align="center" gutterBottom sx={{ mb: 3 }}>
            🐦 Twitter
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="authentication tabs">
              <Tab label="Login" id="auth-tab-0" aria-controls="auth-tabpanel-0" />
              <Tab label="Sign Up" id="auth-tab-1" aria-controls="auth-tabpanel-1" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <LoginForm onLoginSuccess={handleAuthSuccess} />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <SignUpForm onSignUpSuccess={handleAuthSuccess} />
          </TabPanel>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AuthPage;
