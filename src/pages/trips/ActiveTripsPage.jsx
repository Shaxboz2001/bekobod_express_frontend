import {
  Box, Typography, CircularProgress, Select, MenuItem,
  FormControl, Button, Chip, Alert,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

import { tripsApi } from '../../api/services';
import TripCard from '../../components/common/TripCard';
import { useT } from '../../i18n';

export default function ActiveTripsPage() {
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const tt = useT();
  const [direction, setDirection] = useState('');
  const [category, setCategory] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);

  const { data, isLoading, refetch, isError } = useQuery(
    ['active-trips', direction, category],
    () => tripsApi.active({
      page: 1, size: 30,
      ...(direction && { direction }),
      ...(category && { category }),
    }).then((r) => r.data),
    { refetchInterval: 20_000 },
  );

  const acceptMutation = useMutation(
    (id) => tripsApi.accept(id).then((r) => r.data),
    {
      onMutate: (id) => setAcceptingId(id),
      onSuccess: (data) => {
        qc.invalidateQueries('active-trips');
        qc.invalidateQueries('my-trips');
        enqueueSnackbar(`✅ #${data.id} ${tt('status.accepted')}`, { variant: 'success' });
        setAcceptingId(null);
      },
      onError: (err) => {
        enqueueSnackbar(err.response?.data?.detail || tt('common.error'), { variant: 'error' });
        setAcceptingId(null);
      },
    },
  );

  const trips = data?.items || [];
  const total = data?.total || 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        px: 2, pt: 2, pb: 1.5,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: '#fff',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={700} color="#fff">
              🚕 {tt('nav.activeTrips')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {total} · {tt('status.active')}
            </Typography>
          </Box>
          <Button
            size="small"
            startIcon={<Refresh />}
            onClick={() => refetch()}
            sx={{
              color: '#fff', borderColor: 'rgba(255,255,255,0.3)',
              border: '1px solid', borderRadius: 2, px: 1.5,
            }}
          >
            {tt('common.refresh')}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              displayEmpty
              sx={{
                bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                '& .MuiSvgIcon-root': { color: '#fff' },
              }}
            >
              <MenuItem value="">— {tt('common.search')} —</MenuItem>
              <MenuItem value="bekobod_to_tashkent">🚀 {tt('dir.bekobod_to_tashkent')}</MenuItem>
              <MenuItem value="tashkent_to_bekobod">🏠 {tt('dir.tashkent_to_bekobod')}</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ flex: 1 }}>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              displayEmpty
              sx={{
                bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                '& .MuiSvgIcon-root': { color: '#fff' },
              }}
            >
              <MenuItem value="">— {tt('trip.category')} —</MenuItem>
              <MenuItem value="passenger">👤 {tt('cat.passenger')}</MenuItem>
              <MenuItem value="passenger_small_cargo">🎒 {tt('cat.passenger_small_cargo')}</MenuItem>
              <MenuItem value="cargo">📦 {tt('cat.cargo')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>{tt('common.error')}</Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#1a1a2e' }} />
          </Box>
        ) : trips.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: 56, mb: 2 }}>📭</Typography>
            <Typography variant="h6" fontWeight={600} color="text.secondary">
              {tt('trip.empty')}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => refetch()}
              sx={{ mt: 2, borderRadius: 2, borderColor: '#1a1a2e', color: '#1a1a2e' }}
            >
              {tt('common.refresh')}
            </Button>
          </Box>
        ) : (
          <>
            {trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                showAccept
                onAccept={(id) => acceptMutation.mutate(id)}
                loading={acceptingId === trip.id}
              />
            ))}
          </>
        )}
      </Box>
    </Box>
  );
}
