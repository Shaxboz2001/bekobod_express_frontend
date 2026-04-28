import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  Avatar, Chip, IconButton, Tooltip, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Switch,
  FormControlLabel, Grid,
} from '@mui/material';
import { Add, Edit, Refresh } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSnackbar } from 'notistack';
import { adminUsersApi as usersApi } from '../../api/services';
import { USER_ROLE, formatDate } from '../../utils';

export default function UsersPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [page, setPage] = useState(0);
  const [role, setРолe] = useState('');
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState({ full_name: '', phone: '', password: '', role: 'passenger' });

  const { data, isLoading, refetch } = useQuery(
    ['admin-users', page, role],
    () => usersApi.list({ page: page + 1, size: 20, ...(role && { role }) }).then(r => r.data)
  );

  const createUser = useMutation(d => usersApi.create(d).then(r => r.data), {
    onSuccess: () => { qc.invalidateQueries('admin-users'); enqueueSnackbar("Яратилди!", { variant: 'success' }); setDialog(null); },
    onError: err => enqueueSnackbar(err.response?.data?.detail || "Хато", { variant: 'error' }),
  });

  const updateUser = useMutation(({ id, ...d }) => usersApi.update(id, d).then(r => r.data), {
    onSuccess: () => { qc.invalidateQueries('admin-users'); enqueueSnackbar("Янгиланди!", { variant: 'success' }); setDialog(null); },
  });

  const openCreate = () => {
    setForm({ full_name: '', phone: '', password: '', role: 'passenger' });
    setDialog({ mode: 'create' });
  };

  const openEdit = u => {
    setForm({ full_name: u.full_name, phone: u.phone, password: '', role: u.role, is_active: u.is_active, _id: u.id });
    setDialog({ mode: 'edit' });
  };

  const handleSave = () => {
    if (dialog.mode === 'create') { const { _id, is_active, ...rest } = form; createUser.mutate(rest); }
    else { const { password, _id, ...rest } = form; updateUser.mutate({ id: _id, ...rest }); }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const users = Array.isArray(data) ? data : [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>👥 Фойдаланувчилар</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Янгилаш"><IconButton onClick={() => refetch()} size="small"><Refresh /></IconButton></Tooltip>
          <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ bgcolor: '#1a1a2e' }}>Янги</Button>
        </Box>
      </Box>

      <Card sx={{ mb: 2, px: 2, py: 1.5 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Рол бўйича</InputLabel>
          <Select value={role} label="Рол бўйича" onChange={e => { setРолe(e.target.value); setPage(0); }}>
            <MenuItem value="">Барчаси</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="driver">Ҳайдовчи</MenuItem>
            <MenuItem value="passenger">Йўловчи</MenuItem>
          </Select>
        </FormControl>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Ism</TableCell>
                <TableCell>Телефон</TableCell>
                <TableCell>Telegram</TableCell>
                <TableCell>Рол</TableCell>
                <TableCell>Ҳолат</TableCell>
                <TableCell>Сана</TableCell>
                <TableCell align="right">Amal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(u => {
                const r = USER_ROLE[u.role] || { label: u.role, color: 'default' };
                return (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#1a1a2e' }}>{u.full_name?.[0]}</Avatar>
                        <Typography variant="body2" fontWeight={500}>{u.full_name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2">{u.phone}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{u.username ? `@${u.username}` : u.telegram_id ? `${u.telegram_id}` : '—'}</Typography></TableCell>
                    <TableCell><Chip label={r.label} color={r.color} size="small" /></TableCell>
                    <TableCell>
                      <Chip label={u.is_active ? 'Фаол' : 'Блокланган'} color={u.is_active ? 'success' : 'error'} size="small" />
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{formatDate(u.created_at)}</Typography></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Таҳрирлаш"><IconButton size="small" onClick={() => openEdit(u)}><Edit fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!users.length && (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>Фойдаланувчилар топилмади</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={users.length} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={20} rowsPerPageOptions={[20]}
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Card>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog?.mode === 'create' ? 'Янги фойдаланувчи' : 'Таҳрирлаш'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField label="Тўлиқ исм" value={form.full_name} onChange={set('full_name')} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Телефон" value={form.phone} onChange={set('phone')} fullWidth /></Grid>
            {dialog?.mode === 'create' && (
              <Grid item xs={12} sm={6}><TextField label="Парол" type="password" value={form.password} onChange={set('password')} fullWidth /></Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Рол</InputLabel>
                <Select value={form.role} label="Рол" onChange={set('role')}>
                  <MenuItem value="passenger">Йўловчи</MenuItem>
                  <MenuItem value="driver">Ҳайдовчи</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {dialog?.mode === 'edit' && (
              <Grid item xs={12}>
                <FormControlLabel control={<Switch checked={form.is_active ?? true} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />} label="Фаол" />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setDialog(null)} variant="outlined">Бекор</Button>
          <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#1a1a2e' }}>Сақлаш</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
