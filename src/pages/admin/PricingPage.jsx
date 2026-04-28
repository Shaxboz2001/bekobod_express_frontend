import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Chip, IconButton, Tooltip,
} from '@mui/material';
import { Edit, Add } from '@mui/icons-material';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSnackbar } from 'notistack';
import { adminTripsApi as tripsApi } from '../../api/services';
import { DIRECTION, CATEGORY, formatPrice } from '../../utils';

const DIRECTIONS = ['bekobod_to_tashkent', 'tashkent_to_bekobod'];
const CATEGORIES = ['passenger', 'passenger_small_cargo', 'cargo'];

export default function PricingPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [dialog, setDialog] = useState(null); // { pricing?, direction?, category? }
  const [price, setPrice] = useState('');

  const { data: pricingList = [], isLoading } = useQuery(
    'all-pricing',
    () => tripsApi.pricing().then(r => r.data)
  );

  const getPrice = (dir, cat) =>
    pricingList.find(p => p.direction === dir && p.category === cat);

  const saveMutation = useMutation(
    (data) => data.id
      ? tripsApi.updatePricing(data.id, { price_per_seat: parseFloat(data.price) }).then(r => r.data)
      : tripsApi.createPricing({ direction: data.direction, category: data.category, price_per_seat: parseFloat(data.price) }).then(r => r.data),
    {
      onSuccess: () => {
        qc.invalidateQueries('all-pricing');
        enqueueSnackbar("Нарх сақланди ✅", { variant: 'success' });
        setDialog(null);
        setPrice('');
      },
      onError: err => enqueueSnackbar(err.response?.data?.detail || "Хато", { variant: 'error' }),
    }
  );

  const openEdit = (dir, cat) => {
    const existing = getPrice(dir, cat);
    setPrice(existing?.price_per_seat?.toString() || '');
    setDialog({ id: existing?.id, direction: dir, category: cat });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>💰 Нархлар boshqaruvi</Typography>
          <Typography variant="body2" color="text.secondary">Йўналиш ва категория бўйича жой нархини белгиланг</Typography>
        </Box>
      </Box>

      {/* Info card */}
      <Card sx={{ mb: 3, bgcolor: '#fffbf0', border: '1px solid #f5a623' }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="body2" fontWeight={600}>ℹ️ Нархлар qanday ishlaydi?</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Йўловчи эълон берганда, танланган йўналиш + категория учун нарх автоматик қўлланади.
            Жами нарх = <strong>жой нархи × жой сони</strong>.
          </Typography>
        </CardContent>
      </Card>

      {/* Pricing table */}
      {DIRECTIONS.map(dir => (
        <Card key={dir} sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2, pb: 1 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>
              {DIRECTION[dir]?.emoji} {DIRECTION[dir]?.label}
            </Typography>
          </CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Категория</TableCell>
                  <TableCell>Tavsif</TableCell>
                  <TableCell align="center">Жой нархи</TableCell>
                  <TableCell align="center">Ҳолат</TableCell>
                  <TableCell align="right">Amal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {CATEGORIES.map(cat => {
                  const p = getPrice(dir, cat);
                  return (
                    <TableRow key={cat} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {CATEGORY[cat]?.emoji} {CATEGORY[cat]?.label}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {cat === 'passenger' ? '1-4 ta yo\'lovchi joyi' :
                           cat === 'passenger_small_cargo' ? 'Yo\'lovchi + кичик сумка/paket' :
                           'Катта юк ташиш (sumkasiz yo\'lovchi)'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body1" fontWeight={700} color={p ? 'success.main' : 'text.disabled'}>
                          {p ? formatPrice(p.price_per_seat) : "Белгиланмаган"}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={p?.is_active ? 'Фаол' : (p ? 'Фаол эмас' : "Йўқ")}
                          color={p?.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={p ? 'Таҳрирлаш' : "Нарх қўшиш"}>
                          <IconButton size="small" color="primary" onClick={() => openEdit(dir, cat)}>
                            {p ? <Edit fontSize="small" /> : <Add fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ))}

      {/* Edit dialog */}
      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {dialog?.id ? 'Нархни таҳрирлаш' : "Нарх қўшиш"}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {dialog && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">Йўналиш:</Typography>
              <Typography variant="body1" fontWeight={600}>
                {DIRECTION[dialog.direction]?.emoji} {DIRECTION[dialog.direction]?.label}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Категория:</Typography>
              <Typography variant="body1" fontWeight={600}>
                {CATEGORY[dialog.category]?.emoji} {CATEGORY[dialog.category]?.label}
              </Typography>
            </Box>
          )}
          <TextField
            label="Жой нархи (so'm)"
            type="number"
            value={price}
            onChange={e => setPrice(e.target.value)}
            fullWidth
            autoFocus
            inputProps={{ min: 0, step: 1000 }}
            helperText={price ? `= ${formatPrice(parseFloat(price))}` : ''}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setDialog(null)} variant="outlined">Бекор</Button>
          <Button
            onClick={() => saveMutation.mutate({ ...dialog, price })}
            variant="contained"
            disabled={!price || saveMutation.isLoading}
            sx={{ bgcolor: '#1a1a2e' }}
          >
            Сақлаш
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
