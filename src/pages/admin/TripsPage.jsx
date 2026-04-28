import {
  Box, Card, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination,
  Chip, IconButton, Tooltip, Select, MenuItem, FormControl,
  InputLabel, TextField, InputAdornment, Button,
} from '@mui/material';
import { Visibility, Search, Refresh } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { adminTripsApi as tripsApi } from '../../api/services';
import { DIRECTION, CATEGORY, TRIP_STATUS, formatPrice, formatDate } from '../../utils';

export default function TripsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);
  const [status, setСтатус] = useState('');
  const [direction, setDirection] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading, refetch } = useQuery(
    ['admin-trips', page, size, status, direction, category],
    () => tripsApi.list({ page: page + 1, size, ...(status && { status }), ...(direction && { direction }), ...(category && { category }) }).then(r => r.data),
    { keepPreviousData: true }
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>📋 Эълонлар</Typography>
        <Tooltip title="Янгилаш">
          <IconButton onClick={() => refetch()} size="small"><Refresh /></IconButton>
        </Tooltip>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2, px: 2, py: 1.5 }}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Ҳолат</InputLabel>
            <Select value={status} label="Ҳолат" onChange={e => { setСтатус(e.target.value); setPage(0); }}>
              <MenuItem value="">Барчаси</MenuItem>
              {Object.entries(TRIP_STATUS).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel>Йўналиш</InputLabel>
            <Select value={direction} label="Йўналиш" onChange={e => { setDirection(e.target.value); setPage(0); }}>
              <MenuItem value="">Барчаси</MenuItem>
              {Object.entries(DIRECTION).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v.emoji} {v.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Категория</InputLabel>
            <Select value={category} label="Категория" onChange={e => { setCategory(e.target.value); setPage(0); }}>
              <MenuItem value="">Барчаси</MenuItem>
              {Object.entries(CATEGORY).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v.emoji} {v.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {(status || direction || category) && (
            <Button size="small" onClick={() => { setСтатус(''); setDirection(''); setCategory(''); setPage(0); }} variant="outlined" color="inherit">
              Tozalash
            </Button>
          )}
        </Box>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Йўналиш</TableCell>
                <TableCell>Қабул joyi</TableCell>
                <TableCell>Yetkazish joyi</TableCell>
                <TableCell>Вақт</TableCell>
                <TableCell>Joy</TableCell>
                <TableCell>Tur</TableCell>
                <TableCell>Нарх</TableCell>
                <TableCell>Ҳолат</TableCell>
                <TableCell>Йўловчи</TableCell>
                <TableCell>Ҳайдовчи</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items?.map(trip => {
                const st = TRIP_STATUS[trip.status];
                const dir = DIRECTION[trip.direction];
                const cat = CATEGORY[trip.category];
                return (
                  <TableRow key={trip.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={700}>#{trip.id}</Typography></TableCell>
                    <TableCell>
                      <Chip label={`${dir?.emoji} ${dir?.label}`} size="small" sx={{ bgcolor: '#1a1a2e', color: '#fff', fontSize: '0.68rem' }} />
                    </TableCell>
                    <TableCell><Typography variant="body2" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.pickup_point}</Typography></TableCell>
                    <TableCell><Typography variant="body2" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.dropoff_point}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{formatDate(trip.trip_date)}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{trip.seats} ta</Typography></TableCell>
                    <TableCell><Typography variant="caption">{cat?.emoji} {cat?.label}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{formatPrice(trip.total_price)}</Typography></TableCell>
                    <TableCell><Chip label={st?.label} color={st?.color} size="small" /></TableCell>
                    <TableCell><Typography variant="caption">{trip.passenger?.full_name}</Typography></TableCell>
                    <TableCell>
                      {trip.driver
                        ? <Typography variant="caption" color="success.main">{trip.driver.full_name}</Typography>
                        : <Typography variant="caption" color="text.disabled">—</Typography>
                      }
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Кўриш">
                        <IconButton size="small" onClick={() => navigate(`/admin/trips/${trip.id}`)}><Visibility fontSize="small" /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!data?.items?.length && (
                <TableRow><TableCell colSpan={12} align="center" sx={{ py: 5, color: 'text.secondary' }}>Эълонлар топилмади</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={data?.total ?? 0}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={size}
          onRowsPerPageChange={e => { setSize(+e.target.value); setPage(0); }}
          rowsPerPageOptions={[10, 15, 25, 50]}
          labelRowsPerPage="Саҳифада:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </Card>
    </Box>
  );
}
