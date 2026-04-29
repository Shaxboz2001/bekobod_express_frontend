import {
  Box, Card, CardContent, Typography, TextField, Button,
  ToggleButton, ToggleButtonGroup, Grid, Chip, CircularProgress,
  Alert, Divider, Autocomplete,
} from '@mui/material';
import {
  LocationOn, FlagOutlined, EventSeat,
  Luggage, ArrowForward, Map as MapIcon,
  MyLocation as MyLocationIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { useSnackbar } from 'notistack';
import dayjs from 'dayjs';

import { tripsApi } from '../../api/services';
import {
  DIRECTION, CATEGORY, CAR_TYPE, formatPrice,
  BEKOBOD_POINTS, TASHKENT_POINTS,
} from '../../utils/constants';
import { useT } from '../../i18n';
import LocationPicker from '../../components/common/LocationPicker';

const INITIAL = {
  direction: 'bekobod_to_tashkent',
  pickup_point: '',
  dropoff_point: '',
  trip_date: '',
  trip_time: '',
  seats: 1,
  category: 'passenger',
  car_type_preference: 'any',
  notes: '',
  luggage: false,
  // ─── Location (yangi, ixtiyoriy) ─────────────────────────────────────────
  pickup_lat: null,
  pickup_lng: null,
  pickup_address: null,
};

export default function NewTripPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const tt = useT();
  const [form, setForm] = useState(INITIAL);
  const [error, setError] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [locationError, setLocationError] = useState('');

  // ─── Joylashuvni olish ─────────────────────────────────────────────────────
  // Strategy:
  //   1. Telegram WebApp LocationManager (Bot API 8.0+, oktabr 2024+)
  //      Eng aniq — Telegram sistem permissionsidan foydalanadi
  //   2. Browser Geolocation API — fallback (eski Telegram clientlarida)
  //
  // Reverse geocoding (Nominatim) avtomatik manzilni qo'shadi.
  // Tarmoq tezligi yomon bo'lsa ham, lat/lng saqlangan bo'ladi.
  const getCurrentLocation = async () => {
    setLocationError('');
    setLoadingGeo(true);

    try {
      const pos = await getPositionViaTelegramOrBrowser();
      const { latitude: lat, longitude: lng } = pos;

      // Reverse geocoding — fail bo'lsa ham koordinata saqlanadi
      let address = null;
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&accept-language=ru,uz`;
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 3000);  // 3s timeout
        const res = await fetch(url, { signal: ctrl.signal });
        const data = await res.json();
        if (data?.display_name) {
          address = data.display_name.split(',').slice(0, 3).join(',').trim();
        }
      } catch (_) {
        // Geocoding fail — koordinata saqlanadi, address null bo'ladi
      }

      setForm((f) => ({
        ...f,
        pickup_lat: lat,
        pickup_lng: lng,
        pickup_address: address,
        pickup_point: f.pickup_point || address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      }));
    } catch (err) {
      setLocationError(err.message || 'Жойлашувни топиб бўлмади');
    } finally {
      setLoadingGeo(false);
    }
  };

  const { data: pricingList = [] } = useQuery(
    'pricing',
    () => tripsApi.pricing().then((r) => r.data),
  );

  const pricing = pricingList.find(
    (p) => p.direction === form.direction && p.category === form.category,
  );
  const totalPrice = pricing ? pricing.price_per_seat * form.seats : null;

  const createTrip = useMutation(
    (data) => tripsApi.create(data).then((r) => r.data),
    {
      onSuccess: () => {
        qc.invalidateQueries('my-trips');
        enqueueSnackbar('🎉 ' + tt('trip.id'), { variant: 'success' });
        navigate('/my-trips');
      },
      onError: (err) => setError(err.response?.data?.detail || tt('common.error')),
    },
  );

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const setE = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickupOptions = form.direction === 'bekobod_to_tashkent' ? BEKOBOD_POINTS : TASHKENT_POINTS;
  const dropoffOptions = form.direction === 'bekobod_to_tashkent' ? TASHKENT_POINTS : BEKOBOD_POINTS;

  const handleSubmit = () => {
    setError('');
    if (!form.pickup_point) { setError(tt('trip.pickup')); return; }
    if (!form.dropoff_point) { setError(tt('trip.dropoff')); return; }
    if (!form.trip_date || !form.trip_time) { setError(tt('trip.time')); return; }
    if (!pricing) { setError(tt('trip.price') + ' ✗'); return; }

    const trip_date = new Date(`${form.trip_date}T${form.trip_time}:00`).toISOString();
    createTrip.mutate({
      direction: form.direction,
      pickup_point: form.pickup_point,
      dropoff_point: form.dropoff_point,
      trip_date,
      seats: form.seats,
      category: form.category,
      car_type_preference: form.car_type_preference,
      notes: form.notes || null,
      luggage: form.luggage,
      // Location — null bo'lsa backend'da NULL saqlaydi, paired validator OK
      pickup_lat: form.pickup_lat,
      pickup_lng: form.pickup_lng,
      pickup_address: form.pickup_address,
    });
  };

  return (
    <Box sx={{ p: 2, maxWidth: 540, mx: 'auto' }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        🚕 {tt('nav.newTrip')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
      )}

      {/* Direction */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <SectionLabel>{tt('trip.route')}</SectionLabel>
          <ToggleButtonGroup
            exclusive
            value={form.direction}
            onChange={(_, v) => v && setForm((f) => ({
              ...f, direction: v, pickup_point: '', dropoff_point: '',
            }))}
            fullWidth
            sx={{ mt: 1.5 }}
          >
            {Object.entries(DIRECTION).map(([key, val]) => (
              <ToggleButton
                key={key}
                value={key}
                sx={{
                  py: 1.25, fontWeight: 600, fontSize: '0.78rem',
                  '&.Mui-selected': {
                    bgcolor: '#1a1a2e', color: '#fff',
                    '&:hover': { bgcolor: '#1a1a2e' },
                  },
                }}
              >
                {val.emoji} {tt(`dir.${key}`)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </CardContent>
      </Card>

      {/* Manzillar */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <SectionLabel>{tt('trip.pickup')} / {tt('trip.dropoff')}</SectionLabel>
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Autocomplete
              freeSolo
              options={pickupOptions}
              value={form.pickup_point}
              onInputChange={(_, v) => set('pickup_point')(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={tt('trip.pickup')}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <LocationOn sx={{ color: '#1a1a2e', fontSize: 18, mr: 0.5 }} />,
                  }}
                />
              )}
            />

            {/* Lokatsiya tugmalari — 2 ta variant */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* 1. Айни жойим — bir bosishda */}
              <Button
                variant={form.pickup_lat ? 'contained' : 'outlined'}
                startIcon={
                  loadingGeo
                    ? <CircularProgress size={16} color="inherit" />
                    : <MyLocationIcon />
                }
                onClick={getCurrentLocation}
                disabled={loadingGeo}
                sx={{
                  flex: 2,
                  borderRadius: 2,
                  bgcolor: form.pickup_lat ? '#27ae60' : 'transparent',
                  color: form.pickup_lat ? '#fff' : '#1a1a2e',
                  borderColor: '#1a1a2e',
                  '&:hover': {
                    bgcolor: form.pickup_lat ? '#229954' : 'rgba(26,26,46,0.04)',
                  },
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  py: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {form.pickup_lat
                  ? (form.pickup_address || `${form.pickup_lat.toFixed(4)}, ${form.pickup_lng.toFixed(4)}`)
                  : 'Айни жойим'}
              </Button>

              {/* 2. Xaritadan tanlash — ikkinchi variant */}
              <Button
                variant="outlined"
                onClick={() => setMapOpen(true)}
                sx={{
                  flex: 0,
                  minWidth: 44,
                  borderRadius: 2,
                  borderColor: '#1a1a2e',
                  color: '#1a1a2e',
                  px: 0,
                }}
              >
                <MapIcon />
              </Button>
            </Box>

            {/* Lokatsiya xato xabari */}
            {locationError && (
              <Alert severity="warning" onClose={() => setLocationError('')}>
                {locationError}
              </Alert>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Divider sx={{ flex: 1 }} />
              <Box sx={{ p: 0.75, bgcolor: '#f4f6f9', borderRadius: '50%', display: 'flex' }}>
                <ArrowForward sx={{ fontSize: 16, color: 'text.secondary' }} />
              </Box>
              <Divider sx={{ flex: 1 }} />
            </Box>
            <Autocomplete
              freeSolo
              options={dropoffOptions}
              value={form.dropoff_point}
              onInputChange={(_, v) => set('dropoff_point')(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={tt('trip.dropoff')}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: <FlagOutlined sx={{ color: '#e74c3c', fontSize: 18, mr: 0.5 }} />,
                  }}
                />
              )}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Vaqt */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <SectionLabel>{tt('trip.time')}</SectionLabel>
          <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
            <Grid item xs={7}>
              <TextField
                label={tt('trip.time')}
                type="date"
                value={form.trip_date}
                onChange={setE('trip_date')}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: dayjs().format('YYYY-MM-DD') }}
                fullWidth
              />
            </Grid>
            <Grid item xs={5}>
              <TextField
                label="⏰"
                type="time"
                value={form.trip_time}
                onChange={setE('trip_time')}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Kategoriya va joylar */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <SectionLabel>{tt('trip.category')}</SectionLabel>
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Object.entries(CATEGORY).map(([key, val]) => (
              <Box
                key={key}
                onClick={() => set('category')(key)}
                sx={{
                  p: 1.5, borderRadius: 2, cursor: 'pointer', border: '2px solid',
                  borderColor: form.category === key ? '#1a1a2e' : '#e0e0e0',
                  bgcolor: form.category === key ? '#f0f0ff' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  transition: 'all 0.15s',
                }}
              >
                <Typography sx={{ fontSize: 24 }}>{val.emoji}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {tt(`cat.${key}`)}
                  </Typography>
                </Box>
                {form.category === key && (
                  <Chip label="✓" size="small" sx={{ bgcolor: '#1a1a2e', color: '#fff' }} />
                )}
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight={600} mb={1}>
              <EventSeat sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
              {tt('trip.seats')}: {form.seats}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3, 4].map((n) => (
                <Box
                  key={n}
                  onClick={() => set('seats')(n)}
                  sx={{
                    width: 44, height: 44, borderRadius: 2, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid', fontWeight: 700,
                    borderColor: form.seats === n ? '#1a1a2e' : '#e0e0e0',
                    bgcolor: form.seats === n ? '#1a1a2e' : 'transparent',
                    color: form.seats === n ? '#fff' : 'text.primary',
                    transition: 'all 0.15s',
                  }}
                >
                  {n}
                </Box>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Mashina turi */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <SectionLabel>{tt('trip.carType')} ({tt('common.optional').toLowerCase()})</SectionLabel>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
            {Object.entries(CAR_TYPE).map(([key, val]) => {
              // 'any' uchun special label
              const label = key === 'any'
                ? tt('common.search')
                : tt(`auth.driver.car.type.${key === 'cargo_van' ? 'cargo' : key}`);
              return (
                <Chip
                  key={key}
                  label={`${val.emoji} ${label}`}
                  onClick={() => set('car_type_preference')(key)}
                  variant={form.car_type_preference === key ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 600,
                    bgcolor: form.car_type_preference === key ? '#1a1a2e' : 'transparent',
                    color: form.car_type_preference === key ? '#fff' : 'text.primary',
                    borderColor: form.car_type_preference === key ? '#1a1a2e' : '#e0e0e0',
                  }}
                />
              );
            })}
          </Box>
        </CardContent>
      </Card>

      {/* Qo'shimcha */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <SectionLabel>{tt('trip.notes')}</SectionLabel>
          <TextField
            label={tt('trip.notes')}
            value={form.notes}
            onChange={setE('notes')}
            fullWidth multiline rows={2}
            sx={{ mt: 1.5 }}
          />
          <Box
            onClick={() => set('luggage')(!form.luggage)}
            sx={{
              mt: 1.5, p: 1.5, borderRadius: 2, cursor: 'pointer',
              border: '2px solid', display: 'flex', alignItems: 'center', gap: 1,
              borderColor: form.luggage ? '#f5a623' : '#e0e0e0',
              bgcolor: form.luggage ? '#fffbf0' : 'transparent',
              transition: 'all 0.15s',
            }}
          >
            <Luggage sx={{ color: form.luggage ? '#f5a623' : 'text.secondary' }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                🧳 {tt('trip.luggage')}
              </Typography>
            </Box>
            {form.luggage && (
              <Chip label="✓" size="small" sx={{ bgcolor: '#f5a623', color: '#fff' }} />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Narx */}
      <Card sx={{
        mb: 3,
        bgcolor: pricing ? '#f0fff4' : '#f4f6f9',
        border: `2px solid ${pricing ? '#27ae60' : '#e0e0e0'}`,
      }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                {tt('trip.totalPrice')}
              </Typography>
              {pricing ? (
                <Typography variant="caption" color="text.secondary">
                  {formatPrice(pricing.price_per_seat)} × {form.seats}
                </Typography>
              ) : (
                <Typography variant="caption" color="error">
                  {tt('trip.notFound')}
                </Typography>
              )}
            </Box>
            <Typography
              variant="h5" fontWeight={700}
              color={pricing ? 'success.main' : 'text.disabled'}
            >
              {totalPrice ? formatPrice(totalPrice) : '—'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Button
        variant="contained" size="large" fullWidth
        disabled={createTrip.isLoading || !pricing}
        onClick={handleSubmit}
        sx={{
          bgcolor: '#1a1a2e', py: 1.75, borderRadius: 3,
          fontSize: '1rem', fontWeight: 700, mb: 1,
        }}
      >
        {createTrip.isLoading
          ? <CircularProgress size={24} color="inherit" />
          : `🚕 ${tt('common.submit')} — ${totalPrice ? formatPrice(totalPrice) : '...'}`
        }
      </Button>

      {/* Lokatsiya tanlash dialog */}
      <LocationPicker
        open={mapOpen}
        onClose={() => setMapOpen(false)}
        initialPos={form.pickup_lat ? [form.pickup_lat, form.pickup_lng] : null}
        directionHint={form.direction}
        onConfirm={({ lat, lng, address }) => {
          setForm((f) => ({
            ...f,
            pickup_lat: lat,
            pickup_lng: lng,
            pickup_address: address,
            // Agar pickup_point bo'sh bo'lsa, address'ni qo'shamiz
            pickup_point: f.pickup_point || address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          }));
        }}
      />
    </Box>
  );
}

function SectionLabel({ children }) {
  return (
    <Typography
      variant="caption" color="text.secondary" fontWeight={600}
      sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
    >
      {children}
    </Typography>
  );
}

// ─── Joylashuvni olish: Telegram LocationManager → Browser Geolocation ──────
//
// Strategy:
//   1. tg.LocationManager (Bot API 8.0+, oktabr 2024+) — agar mavjud bo'lsa
//      Telegram'ning native permission flow'idan foydalanadi (eng yaxshi UX)
//   2. navigator.geolocation — universal fallback
//
// Returns: { latitude, longitude, accuracy }
// Throws: Error with localized message
function getPositionViaTelegramOrBrowser() {
  const tg = window.Telegram?.WebApp;

  // ─── 1. Telegram LocationManager (yangi Bot API 8.0+) ──────────────────────
  if (tg?.LocationManager) {
    return new Promise((resolve, reject) => {
      // Initialize qilish kerak — bir martagina
      const initPromise = tg.LocationManager.isInited
        ? Promise.resolve()
        : new Promise((res) => tg.LocationManager.init(res));

      initPromise.then(() => {
        if (!tg.LocationManager.isLocationAvailable) {
          // Permission yo'q yoki cihaz qo'llab-quvvatlamaydi → fallback
          getViaBrowser().then(resolve).catch(reject);
          return;
        }

        if (!tg.LocationManager.isAccessGranted) {
          // Permission so'rash — Telegram native dialog
          tg.LocationManager.openSettings();
          // openSettings async — javob kelmaydi. Foydalanuvchi keyin qayta bosishi kerak.
          reject(new Error('Telegram созламаларидан жойлашувга рухсат беринг'));
          return;
        }

        tg.LocationManager.getLocation((loc) => {
          if (!loc) {
            // Foydalanuvchi rad etdi yoki tarmoq xatosi
            getViaBrowser().then(resolve).catch(reject);
            return;
          }
          resolve({
            latitude: loc.latitude,
            longitude: loc.longitude,
            accuracy: loc.horizontal_accuracy,
          });
        });
      });
    });
  }

  // ─── 2. Fallback: browser Geolocation API ──────────────────────────────────
  return getViaBrowser();
}

function getViaBrowser() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Браузер жойлашувни қўллаб-қувватламайди'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => {
        let msg;
        switch (err.code) {
          case 1:  // PERMISSION_DENIED
            msg = 'Жойлашувга рухсат берилмаган';
            break;
          case 2:  // POSITION_UNAVAILABLE
            msg = 'Жойлашувни топиб бўлмади';
            break;
          case 3:  // TIMEOUT
            msg = 'Жуда узоқ кутилди — қайта уриниб кўринг';
            break;
          default:
            msg = 'Жойлашувни олиб бўлмади';
        }
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}
