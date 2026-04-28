import {
  Box, Card, CardContent, Typography, Avatar, Chip,
  Divider, Button, Switch, CircularProgress, ToggleButton, ToggleButtonGroup,
} from '@mui/material';
import { Logout, DirectionsCar, Language } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

import { logout, selectUser } from '../../features/auth/authSlice';
import { usersApi } from '../../api/services';
import { formatDate } from '../../utils/constants';
import { useT, useLang } from '../../i18n';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentUser = useSelector(selectUser);
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const tt = useT();
  const { lang, setLang } = useLang();

  const { data: me, isLoading } = useQuery(
    'me',
    () => usersApi.me().then((r) => r.data),
  );

  const toggleAvailable = useMutation(
    (is_available) => usersApi.updateDriverProfile(me.id, { is_available }).then((r) => r.data),
    {
      onSuccess: () => {
        qc.invalidateQueries('me');
        enqueueSnackbar(tt('common.save'), { variant: 'success' });
      },
    },
  );

  const handleLogout = () => {
    dispatch(logout());
    navigate('/auth', { replace: true });
  };

  const user = me || currentUser;
  const isDriver = user?.role === 'driver';

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#1a1a2e' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Profile header */}
      <Card sx={{ mb: 2, background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d4e 100%)' }}>
        <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
          <Avatar sx={{
            width: 72, height: 72, mx: 'auto', mb: 1.5,
            bgcolor: '#f5a623', fontSize: '1.75rem',
          }}>
            {user?.full_name?.[0]?.toUpperCase()}
          </Avatar>
          <Typography variant="h6" fontWeight={700} color="#fff">
            {user?.full_name}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1.5 }}>
            {user?.phone}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            <Chip
              label={isDriver ? `🚗 ${tt('auth.role.driver')}` : `👤 ${tt('auth.role.passenger')}`}
              size="small"
              sx={{ bgcolor: '#f5a623', color: '#000', fontWeight: 600 }}
            />
            {user?.is_verified && (
              <Chip label={tt('profile.verified')} size="small" color="success" />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Driver section */}
      {isDriver && me?.driver_profile && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2} sx={{
              display: 'flex', alignItems: 'center', gap: 0.75,
            }}>
              <DirectionsCar fontSize="small" /> {tt('profile.driver.info')}
            </Typography>

            <Box sx={{
              p: 1.5, bgcolor: '#f4f6f9', borderRadius: 2, mb: 2,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {me.driver_profile.is_available
                    ? `✓ ${tt('status.active')}`
                    : tt('status.expired')}
                </Typography>
              </Box>
              <Switch
                checked={me.driver_profile.is_available}
                onChange={(e) => toggleAvailable.mutate(e.target.checked)}
                disabled={toggleAvailable.isLoading}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#27ae60' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#27ae60' },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[
                { label: tt('trip.car'),       value: `${me.driver_profile.car_model} (${me.driver_profile.car_year || '—'})` },
                { label: tt('auth.driver.car.color'), value: me.driver_profile.car_color || '—' },
                { label: tt('trip.carNumber'), value: me.driver_profile.car_number },
                { label: tt('auth.driver.car.seats'), value: `${me.driver_profile.seats_available} ${tt('trip.seats.unit')}` },
              ].map((item, i) => (
                <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                </Box>
              ))}
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-around', py: 0.5 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={700} color="#f5a623">
                    {me.driver_profile.total_trips}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tt('trip.id')}
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={700} color="#f5a623">
                    ⭐ {me.driver_profile.rating?.toFixed(1)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {tt('trip.rating')}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Account info */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
            {tt('profile.title')}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {[
              { label: tt('auth.phone.label'), value: user?.phone },
              {
                label: 'Telegram',
                value: user?.username
                  ? `@${user.username}`
                  : (user?.telegram_id ? `ID: ${user.telegram_id}` : '—'),
              },
              { label: tt('trip.time'), value: formatDate(user?.created_at) },
            ].map((item, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                <Typography variant="body2" fontWeight={500}>{item.value}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Language switcher */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography
            variant="subtitle2" fontWeight={700} mb={1.5}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
          >
            <Language fontSize="small" /> {tt('profile.lang')}
          </Typography>
          <ToggleButtonGroup
            value={lang}
            exclusive
            fullWidth
            onChange={(_, v) => v && setLang(v)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                fontSize: '0.85rem',
                py: 1,
              },
            }}
          >
            <ToggleButton value="uz">🇺🇿 Ўзбекча</ToggleButton>
            <ToggleButton value="ru">🇷🇺 Русский</ToggleButton>
          </ToggleButtonGroup>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        fullWidth variant="outlined" color="error" size="large"
        startIcon={<Logout />}
        onClick={handleLogout}
        sx={{ borderRadius: 3, py: 1.5 }}
      >
        {tt('profile.logout')}
      </Button>
    </Box>
  );
}
