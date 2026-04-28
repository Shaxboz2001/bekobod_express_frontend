import { createTheme } from '@mui/material/styles';

// User (passenger/driver) — Telegram WebApp variantida ishlatiladi
const userTheme = createTheme({
  palette: {
    primary:    { main: '#1a1a2e', contrastText: '#fff' },
    secondary:  { main: '#f5a623', contrastText: '#000' },
    success:    { main: '#27ae60' },
    error:      { main: '#e74c3c' },
    warning:    { main: '#f39c12' },
    info:       { main: '#2980b9' },
    background: { default: '#f4f6f9', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: 'none',
          padding: '10px 20px',
          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)', transform: 'translateY(-1px)' },
          transition: 'all 0.2s ease',
        },
        containedPrimary:   { background: '#1a1a2e' },
        containedSecondary: { background: '#f5a623' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          border: '1px solid rgba(0,0,0,0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8, fontWeight: 600 } },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 10 } } },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64,
          borderTop: '1px solid rgba(0,0,0,0.08)',
          backgroundColor: '#fff',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#aaa',
          '&.Mui-selected': { color: '#1a1a2e' },
          minWidth: 60,
        },
      },
    },
  },
});

export default userTheme;
