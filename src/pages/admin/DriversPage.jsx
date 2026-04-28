// ─── DriversPage.jsx ─────────────────────────────────────────────────────────
// Ҳайдовчиlar boshqaruvi:
//  • "Тасдиқ кутмоқда" tab — янги рўйхатдан ўтган ҳайдовчилар (is_verified=false)
//  • "Тасдиқланган" tab — ишлаётган ҳайдовчилар
//  • Тезкор тасдиқлаш / рад этиш тугмалари
//  • Автоматик refresh (10s) — yangi haydovchilar real-time ko'rinsin

import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Avatar, Chip, Rating,
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Grid, IconButton, Tooltip, Switch, FormControlLabel,
  Tabs, Tab, Badge, Alert, Stack,
} from '@mui/material';
import {
  Add, Edit, Refresh, CheckCircle, Cancel, HourglassEmpty,
  Verified, Block,
} from '@mui/icons-material';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSnackbar } from 'notistack';
import { adminUsersApi as usersApi } from '../../api/services';
import { formatDate } from '../../utils';

const TABS = {
  PENDING:   'pending',
  VERIFIED:  'verified',
  ALL:       'all',
};

export default function DriversPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(TABS.PENDING);
  const [editDialog, setEditDialog] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [driverForm, setDriverForm] = useState({
    car_model: '', car_number: '', car_color: '', car_type: 'sedan',
    car_year: '', license_number: '', seats_available: 4,
  });
  const [userDialog, setUserDialog] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: '', phone: '', password: '' });

  // ── Fetch — barcha driver'larni olamiz, klient tomonida tab'ga ajratamiz.
  // Bu N+1'ni oldini oladi (bitta query) va tab almashinishida re-fetch yo'q.
  // Eslatma: agar haydovchilar > 500 bo'lsa, server-side filtering kerak bo'ladi
  // (backend'ga `is_verified` query param qo'shish).
  const { data: drivers = [], isLoading, refetch, isFetching } = useQuery(
    'admin-drivers',
    () => usersApi.list({ role: 'driver', size: 500 }).then(r => r.data),
    {
      refetchInterval: 10_000,        // Har 10s avtomatik refresh
      refetchIntervalInBackground: false,
    },
  );

  // ── Mutations ──────────────────────────────────────────────────────────────
  const verifyMut = useMutation((id) => usersApi.verify(id).then(r => r.data), {
    onSuccess: () => {
      qc.invalidateQueries('admin-drivers');
      enqueueSnackbar('Ҳайдовчи тасдиқланди ✓', { variant: 'success' });
      setConfirmDialog(null);
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.detail || 'Тасдиқлашda xato', { variant: 'error' });
    },
  });

  const rejectMut = useMutation((id) => usersApi.reject(id).then(r => r.data), {
    onSuccess: () => {
      qc.invalidateQueries('admin-drivers');
      enqueueSnackbar('Ҳайдовчи рад этилди', { variant: 'info' });
      setConfirmDialog(null);
    },
    onError: (err) => {
      enqueueSnackbar(err.response?.data?.detail || 'Хато', { variant: 'error' });
    },
  });

  const createUserMut = useMutation(
    async ({ userData, profileData }) => {
      const user = await usersApi.create({ ...userData, role: 'driver' }).then(r => r.data);
      // Backend `create_driver_profile` ichida is_verified=True qiladi
      await usersApi.createDriverProfile(user.id, profileData);
      return user;
    },
    {
      onSuccess: () => {
        qc.invalidateQueries('admin-drivers');
        enqueueSnackbar('Ҳайдовчи яратилди ва тасдиқланди!', { variant: 'success' });
        setUserDialog(false);
      },
      onError: (err) => {
        enqueueSnackbar(err.response?.data?.detail || 'Хато', { variant: 'error' });
      },
    },
  );

  const updateProfileMut = useMutation(
    ({ userId, ...data }) => usersApi.updateDriverProfile(userId, data).then(r => r.data),
    {
      onSuccess: () => {
        qc.invalidateQueries('admin-drivers');
        enqueueSnackbar('Янгиланди!', { variant: 'success' });
        setEditDialog(null);
      },
      onError: (err) => enqueueSnackbar(err.response?.data?.detail || 'Хато', { variant: 'error' }),
    },
  );

  // ── Tab bo'yicha filtrlash ─────────────────────────────────────────────────
  const { pending, verified, all } = useMemo(() => {
    const list = Array.isArray(drivers) ? drivers : [];
    return {
      pending:  list.filter(d => !d.is_verified),
      verified: list.filter(d =>  d.is_verified),
      all:      list,
    };
  }, [drivers]);

  const visible = tab === TABS.PENDING ? pending : tab === TABS.VERIFIED ? verified : all;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openNewDriver = () => {
    setNewUser({ full_name: '', phone: '', password: '' });
    setDriverForm({
      car_model: '', car_number: '', car_color: '', car_type: 'sedan',
      car_year: '', license_number: '', seats_available: 4,
    });
    setUserDialog(true);
  };

  const openEditProfile = (d) => {
    setDriverForm({
      car_model: '', car_number: '', car_color: '', car_type: 'sedan',
      car_year: '', license_number: '', seats_available: 4,
      ...(d.driver_profile || {}),
      _userId: d.id,
    });
    setEditDialog(true);
  };

  const askVerify = (d) => setConfirmDialog({ type: 'verify', driver: d });
  const askReject = (d) => setConfirmDialog({ type: 'reject', driver: d });

  const setD = (k) => (e) => setDriverForm(f => ({ ...f, [k]: e.target.value }));
  const setU = (k) => (e) => setNewUser(f => ({ ...f, [k]: e.target.value }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>🚗 Ҳайдовчиlar</Typography>
          <Typography variant="caption" color="text.secondary">
            {isFetching ? 'Янгиланмоқда…' : 'Автоматик янгиланади (10s)'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Ҳозир янгилаш">
            <IconButton onClick={() => refetch()} size="small" disabled={isFetching}>
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openNewDriver}
            sx={{ bgcolor: '#1a1a2e' }}
          >
            Янги ҳайдовчи
          </Button>
        </Box>
      </Box>

      {/* Pending alert — eng muhim, admin ko'zga tashlansin */}
      {pending.length > 0 && tab !== TABS.PENDING && (
        <Alert
          severity="warning"
          icon={<HourglassEmpty />}
          action={
            <Button size="small" color="inherit" onClick={() => setTab(TABS.PENDING)}>
              Кўриш
            </Button>
          }
          sx={{ mb: 2 }}
        >
          <strong>{pending.length}</strong> та ҳайдовчи тасдиқлашни кутмоқда
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Тасдиқ кутмоқда',    value: pending.length,  color: '#f39c12' },
          { label: 'Тасдиқланган',       value: verified.length, color: '#27ae60' },
          { label: 'Фаол (online)',      value: verified.filter(d => d.driver_profile?.is_available).length, color: '#2980b9' },
          { label: 'Жами сафарлар',      value: verified.reduce((s, d) => s + (d.driver_profile?.total_trips || 0), 0), color: '#1a1a2e' },
        ].map((s, i) => (
          <Grid item xs={6} md={3} key={i}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: s.color }}>
                  {s.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab
            label={
              <Badge badgeContent={pending.length} color="warning" max={99}>
                <Box sx={{ pr: pending.length ? 2 : 0 }}>Тасдиқ кутмоқда</Box>
              </Badge>
            }
            value={TABS.PENDING}
          />
          <Tab label={`Тасдиқланган (${verified.length})`} value={TABS.VERIFIED} />
          <Tab label={`Hammasi (${all.length})`} value={TABS.ALL} />
        </Tabs>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Ҳайдовчи</TableCell>
                <TableCell>Телефон</TableCell>
                <TableCell>Telegram</TableCell>
                <TableCell>Машина</TableCell>
                <TableCell>Raqam</TableCell>
                <TableCell>Жойлар</TableCell>
                {tab !== TABS.PENDING && (
                  <>
                    <TableCell>Safarlar</TableCell>
                    <TableCell>Рейтинг</TableCell>
                  </>
                )}
                <TableCell>Ҳолат</TableCell>
                <TableCell>Сана</TableCell>
                <TableCell align="right">Amal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visible.map((d) => (
                <DriverRow
                  key={d.id}
                  driver={d}
                  showStats={tab !== TABS.PENDING}
                  onVerify={() => askVerify(d)}
                  onReject={() => askReject(d)}
                  onEdit={() => openEditProfile(d)}
                />
              ))}
              {!visible.length && (
                <TableRow>
                  <TableCell
                    colSpan={tab === TABS.PENDING ? 9 : 11}
                    align="center"
                    sx={{ py: 5, color: 'text.secondary' }}
                  >
                    {isLoading ? 'Юкlanmoqda…' :
                      tab === TABS.PENDING ? 'Тасдиқ кутаётган ҳайдовчилар йў\'q' :
                      'Ҳайдовчилар топилмади'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Confirm dialog — verify yoki reject */}
      <Dialog open={!!confirmDialog} onClose={() => setConfirmDialog(null)} maxWidth="xs" fullWidth>
        {confirmDialog && (
          <>
            <DialogTitle>
              {confirmDialog.type === 'verify' ? 'Тасдиқлашни тасдиқланг' : 'Рад этишни тасдиқланг'}
            </DialogTitle>
            <DialogContent>
              <Stack spacing={1.5} sx={{ pt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#f5a623' }}>
                    {confirmDialog.driver.full_name?.[0]}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={600}>{confirmDialog.driver.full_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {confirmDialog.driver.phone}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2">
                  {confirmDialog.type === 'verify'
                    ? 'Бу ҳайдовчи тизимга кириши ва эълонларни қабул қилиши мумкин бўлади.'
                    : 'Бу ҳайдовчи блокланади ва тизимга кира олмайди. Кейинчалик қайта фаоллаштириш мумкин.'}
                </Typography>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 2, pb: 2 }}>
              <Button onClick={() => setConfirmDialog(null)} variant="outlined">
                Бекор
              </Button>
              <Button
                onClick={() => {
                  if (confirmDialog.type === 'verify') {
                    verifyMut.mutate(confirmDialog.driver.id);
                  } else {
                    rejectMut.mutate(confirmDialog.driver.id);
                  }
                }}
                variant="contained"
                color={confirmDialog.type === 'verify' ? 'success' : 'error'}
                disabled={verifyMut.isLoading || rejectMut.isLoading}
              >
                {confirmDialog.type === 'verify' ? 'Тасдиқлаш' : 'Рад etish'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* New Driver dialog */}
      <Dialog open={userDialog} onClose={() => setUserDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Янги ҳайдовчи қўшиш</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
            Фойдаланувчи ma'lumotlari
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12}>
              <TextField label="Тўлиқ исм" value={newUser.full_name} onChange={setU('full_name')} fullWidth />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Телефон" value={newUser.phone} onChange={setU('phone')} fullWidth placeholder="998901234567" />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Парол" type="password" value={newUser.password} onChange={setU('password')} fullWidth />
            </Grid>
          </Grid>
          <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
            Машина ma'lumotlari
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField label="Машина modeli" value={driverForm.car_model} onChange={setD('car_model')} fullWidth />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Давлат рақами" value={driverForm.car_number} onChange={setD('car_number')} fullWidth />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Rang" value={driverForm.car_color} onChange={setD('car_color')} fullWidth />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Yil" type="number" value={driverForm.car_year} onChange={setD('car_year')} fullWidth />
            </Grid>
            <Grid item xs={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tur</InputLabel>
                <Select value={driverForm.car_type} label="Tur" onChange={setD('car_type')}>
                  <MenuItem value="sedan">Sedan</MenuItem>
                  <MenuItem value="minivan">Minivan</MenuItem>
                  <MenuItem value="cargo_van">Юк</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField label="Ҳайдовчиlik guvohnomasi" value={driverForm.license_number} onChange={setD('license_number')} fullWidth />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Жойлар сони" type="number" value={driverForm.seats_available} onChange={setD('seats_available')} fullWidth inputProps={{ min: 1, max: 20 }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setUserDialog(false)} variant="outlined">Бекор</Button>
          <Button
            onClick={() => createUserMut.mutate({ userData: newUser, profileData: driverForm })}
            variant="contained"
            sx={{ bgcolor: '#1a1a2e' }}
            disabled={createUserMut.isLoading}
          >
            {createUserMut.isLoading ? 'Yaratilmoqda…' : 'Yaratish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit profile dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Ҳайдовчи profili tahrirlash</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField label="Машина modeli" value={driverForm.car_model || ''} onChange={setD('car_model')} fullWidth />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Давлат рақами" value={driverForm.car_number || ''} onChange={setD('car_number')} fullWidth />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Rang" value={driverForm.car_color || ''} onChange={setD('car_color')} fullWidth />
            </Grid>
            <Grid item xs={4}>
              <TextField label="Жойлар" type="number" value={driverForm.seats_available || 4} onChange={setD('seats_available')} fullWidth />
            </Grid>
            <Grid item xs={4}>
              <FormControlLabel
                control={
                  <Switch
                    checked={driverForm.is_available ?? true}
                    onChange={(e) => setDriverForm(f => ({ ...f, is_available: e.target.checked }))}
                  />
                }
                label="Фаол"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setEditDialog(null)} variant="outlined">Бекор</Button>
          <Button
            onClick={() => updateProfileMut.mutate({
              userId: driverForm._userId,
              car_model: driverForm.car_model,
              car_number: driverForm.car_number,
              car_color: driverForm.car_color,
              seats_available: parseInt(driverForm.seats_available, 10),
              is_available: driverForm.is_available,
            })}
            variant="contained"
            sx={{ bgcolor: '#1a1a2e' }}
            disabled={updateProfileMut.isLoading}
          >
            Сақлаш
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Driver row komponent ────────────────────────────────────────────────────
// Alohida komponent — re-render optimizatsiyasi va o'qish osonligi uchun
function DriverRow({ driver: d, showStats, onVerify, onReject, onEdit }) {
  const profile = d.driver_profile;
  const isPending = !d.is_verified;
  const isBlocked = d.is_active === false;

  return (
    <TableRow hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: '#f5a623' }}>
            {d.full_name?.[0] || '?'}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight={500}>{d.full_name}</Typography>
            {d.is_verified && (
              <Verified sx={{ fontSize: 14, color: '#27ae60', verticalAlign: 'middle' }} />
            )}
          </Box>
        </Box>
      </TableCell>
      <TableCell>{d.phone || '—'}</TableCell>
      <TableCell>
        <Typography variant="caption" color="text.secondary">
          {d.username ? `@${d.username}` : d.telegram_id ? d.telegram_id : '—'}
        </Typography>
      </TableCell>
      <TableCell>{profile?.car_model || <Chip label="ma'lumot yo'q" size="small" variant="outlined" />}</TableCell>
      <TableCell>{profile?.car_number || '—'}</TableCell>
      <TableCell>{profile?.seats_available || '—'}</TableCell>
      {showStats && (
        <>
          <TableCell>{profile?.total_trips || 0}</TableCell>
          <TableCell>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Rating value={profile?.rating || 5} size="small" readOnly precision={0.1} />
              <Typography variant="caption">{profile?.rating?.toFixed(1) || '5.0'}</Typography>
            </Box>
          </TableCell>
        </>
      )}
      <TableCell>
        {isBlocked ? (
          <Chip label="Блокланган" color="error" size="small" icon={<Block sx={{ fontSize: 14 }} />} />
        ) : isPending ? (
          <Chip label="Кутмоқда" color="warning" size="small" icon={<HourglassEmpty sx={{ fontSize: 14 }} />} />
        ) : profile?.is_available ? (
          <Chip label="Фаол" color="success" size="small" />
        ) : (
          <Chip label="Band" color="default" size="small" />
        )}
      </TableCell>
      <TableCell>
        <Typography variant="caption" color="text.secondary">
          {formatDate(d.created_at)}
        </Typography>
      </TableCell>
      <TableCell align="right">
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          {isPending && !isBlocked && (
            <>
              <Tooltip title="Тасдиқлаш">
                <IconButton size="small" color="success" onClick={onVerify}>
                  <CheckCircle fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Рад etish">
                <IconButton size="small" color="error" onClick={onReject}>
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          {profile && (
            <Tooltip title="Profil tahrirlash">
              <IconButton size="small" onClick={onEdit}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}
