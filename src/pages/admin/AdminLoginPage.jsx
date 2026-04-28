// ─── AdminLoginPage.jsx ──────────────────────────────────────────────────────
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert, CircularProgress,
} from '@mui/material';
import { LocalTaxi } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { useDispatch } from 'react-redux';
import { authApi } from '../../api/services';
import { setCredentials } from '../../features/auth/authSlice';

export default function AdminLoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Production'da default credentials YO'Q. Bo'sh form'dan boshlanadi.
  const [form, setForm] = useState({ phone: '', password: '' });
  const [error, setError] = useState('');

  const { mutate, isLoading } = useMutation(
    (d) => authApi.login(d).then((r) => r.data),
    {
      onSuccess: (data) => {
        if (data.user.role !== 'admin') {
          setError('Фақат админлар кириши мумкин');
          return;
        }
        dispatch(setCredentials({
          user: data.user,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        }));
        navigate('/admin', { replace: true });
      },
      onError: (err) => setError(err.response?.data?.detail || 'Хато юз берди'),
    },
  );

  const onSubmit = () => {
    setError('');
    if (!form.phone || !form.password) {
      setError('Телефон ва паролни киритинг');
      return;
    }
    mutate(form);
  };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', bgcolor: '#f4f6f9', p: 2,
    }}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{
            width: 64, height: 64, bgcolor: '#1a1a2e', borderRadius: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2,
          }}>
            <LocalTaxi sx={{ color: '#f5a623', fontSize: 36 }} />
          </Box>
          <Typography variant="h5" fontWeight={700}>Админ панел</Typography>
          <Typography variant="body2" color="text.secondary">Bekobod Express</Typography>
        </Box>
        <Card>
          <CardContent sx={{ p: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Телефон"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                placeholder="998901234567"
                fullWidth
                autoFocus
              />
              <TextField
                label="Парол"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                fullWidth
              />
              <Button
                variant="contained" size="large" fullWidth
                disabled={isLoading}
                onClick={onSubmit}
                sx={{ bgcolor: '#1a1a2e', py: 1.5 }}
              >
                {isLoading ? <CircularProgress size={22} color="inherit" /> : 'Кириш'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
