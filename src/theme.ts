import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1DA1F2', // Twitter blue
    },
    secondary: {
      main: '#657786', // Twitter gray
    },
    background: {
      default: '#ffffff',
      paper: '#f5f8fa',
    },
    text: {
      primary: '#14171a',
      secondary: '#657786',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
    button: {
      textTransform: 'none', // Twitter buttons are not uppercase
    },
  },
  shape: {
    borderRadius: 16, // Rounded corners like Twitter
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          padding: '8px 16px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 20,
          },
        },
      },
    },
  },
});

export default theme;