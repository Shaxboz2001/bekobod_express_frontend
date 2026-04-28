import { createTheme } from '@mui/material/styles';

// Admin panel uchun theme — desktop sidebar + table-heavy UI
const adminTheme = createTheme({
  palette: {
    primary:   { main: '#1a1a2e' },
    secondary: { main: '#f5a623' },
    background: { default: '#f4f6f9', paper: '#ffffff' },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
          border: '1px solid rgba(0,0,0,0.06)',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            bgcolor: '#f4f6f9',
            fontWeight: 600,
            color: '#636e72',
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { backgroundColor: '#1a1a2e', color: '#fff' },
      },
    },
    MuiTextField: { defaultProps: { size: 'small' } },
  },
});

export default adminTheme;
