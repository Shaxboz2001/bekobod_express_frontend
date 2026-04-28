import {
  Box, Typography, Tabs, Tab, CircularProgress,
  Button, Select, MenuItem, FormControl,
} from '@mui/material';
import { Add, Refresh } from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSnackbar } from 'notistack';
import { useSelector } from 'react-redux';

import { tripsApi } from '../../api/services';
import { selectRole } from '../../features/auth/authSlice';
import TripCard from '../../components/common/TripCard';
import { useT } from '../../i18n';

export default function MyTripsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const role = useSelector(selectRole);
  const { enqueueSnackbar } = useSnackbar();
  const tt = useT();
  const [tab, setTab] = useState(0);
  const [direction, setDirection] = useState('');

  const STATUS_TABS = [
    { labelKey: '',                statusKey: '' },        // Barchasi
    { labelKey: 'status.active',   statusKey: 'active' },
    { labelKey: 'status.accepted', statusKey: 'accepted' },
    { labelKey: 'status.completed', statusKey: 'completed' },
    { labelKey: 'status.cancelled', statusKey: 'cancelled' },
  ];

  const statusFilter = STATUS_TABS[tab].statusKey;

  const { data, isLoading, refetch } = useQuery(
    ['my-trips', statusFilter, direction],
    () => tripsApi.list({
      page: 1, size: 30,
      ...(statusFilter && { status: statusFilter }),
      ...(direction && { direction }),
    }).then((r) => r.data),
    { refetchInterval: 30_000 },
  );

  const cancelMutation = useMutation(
    (id) => tripsApi.updateStatus(id, {
      status: 'cancelled',
      cancellation_reason: tt('trip.cancel'),
    }).then((r) => r.data),
    {
      onSuccess: () => {
        qc.invalidateQueries('my-trips');
        enqueueSnackbar(tt('status.cancelled'), { variant: 'info' });
      },
    },
  );

  const trips = data?.items || [];

  return (
    <Box>
      <Box sx={{
        px: 2, pt: 2, pb: 1,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <Typography variant="h6" fontWeight={700}>
          {role === 'driver' ? tt('nav.driverTrips') : tt('nav.myTrips')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small" variant="outlined" startIcon={<Refresh />}
            onClick={() => refetch()}
            sx={{ borderRadius: 2, minWidth: 0, px: 1.5 }}
          >
            {tt('common.refresh')}
          </Button>
          {role !== 'driver' && (
            <Button
              size="small" variant="contained" startIcon={<Add />}
              onClick={() => navigate('/new-trip')}
              sx={{ bgcolor: '#1a1a2e', borderRadius: 2 }}
            >
              {tt('nav.newTrip')}
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ px: 2, mb: 1 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <Select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            displayEmpty
            sx={{ borderRadius: 2 }}
          >
            <MenuItem value="">— {tt('common.search')} —</MenuItem>
            <MenuItem value="bekobod_to_tashkent">🚀 {tt('dir.bekobod_to_tashkent')}</MenuItem>
            <MenuItem value="tashkent_to_bekobod">🏠 {tt('dir.tashkent_to_bekobod')}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons={false}
        sx={{
          px: 1, borderBottom: '1px solid #f0f0f0',
          '& .MuiTab-root': { minWidth: 'auto', px: 1.5, fontSize: '0.78rem', fontWeight: 600 },
          '& .Mui-selected': { color: '#1a1a2e' },
          '& .MuiTabs-indicator': { bgcolor: '#1a1a2e' },
        }}
      >
        {STATUS_TABS.map((t, i) => (
          <Tab
            key={i}
            label={t.labelKey ? tt(t.labelKey) : tt('common.search')}
          />
        ))}
      </Tabs>

      <Box sx={{ p: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#1a1a2e' }} />
          </Box>
        ) : trips.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ fontSize: 48, mb: 1 }}>🚕</Typography>
            <Typography color="text.secondary" fontWeight={500}>
              {tt('trip.empty')}
            </Typography>
            {role !== 'driver' && (
              <Button
                variant="contained" startIcon={<Add />}
                onClick={() => navigate('/new-trip')}
                sx={{ mt: 2, bgcolor: '#1a1a2e', borderRadius: 2 }}
              >
                {tt('nav.newTrip')}
              </Button>
            )}
          </Box>
        ) : (
          trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onCancel={
                trip.status === 'active' && role !== 'driver'
                  ? () => cancelMutation.mutate(trip.id)
                  : undefined
              }
            />
          ))
        )}
      </Box>
    </Box>
  );
}
