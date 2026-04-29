import {
  Box, Card, CardContent, Typography, Button, Chip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Alert, IconButton, Stack,
} from '@mui/material';
import {
  ArrowBack, EventSeat, AccessTime, Person, Phone, Telegram,
} from '@mui/icons-material';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSnackbar } from 'notistack';
import { useSelector } from 'react-redux';

import { tripsApi } from '../../api/services';
import { selectRole } from '../../features/auth/authSlice';
import { TripStatusChip } from '../../components/common/TripStatusChip';
import {
  CAR_TYPE, formatPrice, formatDate,
} from '../../utils/constants';
import { useT } from '../../i18n';

// ─── Telefon raqamni ko'rinishi uchun formatlash ─────────────────────────────
const formatPhoneDisplay = (raw) => {
  if (!raw) return '';
  // 998901234567 → +998 90 123 45 67
  const n = raw.replace(/\D/g, '');
  if (n.length === 12 && n.startsWith('998')) {
    return `+${n.slice(0,3)} ${n.slice(3,5)} ${n.slice(5,8)} ${n.slice(8,10)} ${n.slice(10)}`;
  }
  return raw;
};

// ─── Telefon raqamga qo'ng'iroq qilish (tel: link) ───────────────────────────
const callPhone = (phone) => {
  if (!phone) return;
  const n = phone.replace(/\D/g, '');
  window.location.href = `tel:+${n}`;
};

// ─── Telegram'da yozish ──────────────────────────────────────────────────────
const writeOnTelegram = ({ username, telegram_id }) => {
  if (username) {
    // Telegram WebApp API
    const url = `https://t.me/${username}`;
    if (window.Telegram?.WebApp?.openTelegramLink) {
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
    return;
  }
  if (telegram_id) {
    const url = `tg://user?id=${telegram_id}`;
    window.location.href = url;
  }
};

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useSelector(selectRole);
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const tt = useT();

  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: trip, isLoading, isError } = useQuery(
    ['trip', id],
    () => tripsApi.get(id).then((r) => r.data),
  );

  const cancelMutation = useMutation(
    () => tripsApi.updateStatus(id, {
      status: 'cancelled',
      cancellation_reason: cancelReason || tt('trip.cancel'),
    }).then((r) => r.data),
    {
      onSuccess: () => {
        qc.invalidateQueries(['trip', id]);
        qc.invalidateQueries('my-trips');
        enqueueSnackbar(tt('status.cancelled'), { variant: 'info' });
        setCancelDialog(false);
      },
    },
  );

  const statusMutation = useMutation(
    (status) => tripsApi.updateStatus(id, { status }).then((r) => r.data),
    {
      onSuccess: (data) => {
        qc.invalidateQueries(['trip', id]);
        qc.invalidateQueries('my-trips');
        enqueueSnackbar(tt(`status.${data.status}`), { variant: 'success' });
      },
    },
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#1a1a2e' }} />
      </Box>
    );
  }

  if (isError || !trip) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">{tt('trip.notFound')}</Typography>
        <Button onClick={() => navigate(-1)} sx={{ mt: 2 }}>{tt('common.back')}</Button>
      </Box>
    );
  }

  const carType = CAR_TYPE[trip.car_type_preference];
  const canCancel = ['active', 'accepted'].includes(trip.status);
  const isDriver = role === 'driver';
  const isPassenger = role === 'passenger';

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header */}
      <Box sx={{
        px: 2, pt: 2, pb: 2,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #2d2d4e 100%)',
      }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, px: 0 }}
          size="small"
        >
          {tt('common.back')}
        </Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
              {tt('trip.id')} #{trip.id}
            </Typography>
            <Typography variant="h6" fontWeight={700} color="#fff" sx={{ mt: 0.25 }}>
              {tt(`dir.${trip.direction}`)}
            </Typography>
          </Box>
          <TripStatusChip status={trip.status} />
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        {trip.cancellation_reason && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <strong>{tt('trip.cancellationReason')}:</strong> {trip.cancellation_reason}
          </Alert>
        )}

        {/* ─── Yo'lovchi ma'lumotlari (haydovchi uchun) ─── */}
        {/* Eng asosiy yangilanish: haydovchi qabul qilgach yo'lovchini ko'radi */}
        {isDriver && trip.passenger && trip.status !== 'active' && (
          <ContactCard
            type="passenger"
            person={trip.passenger}
            tt={tt}
          />
        )}

        {/* ─── Xarita preview (lokatsiya bo'lsa) ─────────────────────────── */}
        {/* Haydovchi e'lonni qabul qilgach yo'lovchining aniq joyini ko'radi.
            Tugma: tashqi navigation app'da ochish (Yandex Navi/Google Maps). */}
        {trip.pickup_lat != null && trip.pickup_lng != null && (
          <PickupLocationCard
            lat={trip.pickup_lat}
            lng={trip.pickup_lng}
            address={trip.pickup_address || trip.pickup_point}
            tt={tt}
          />
        )}

        {/* Route */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
              {tt('trip.route')}
            </Typography>
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: '50%', bgcolor: '#1a1a2e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Typography sx={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>A</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{tt('trip.pickup')}</Typography>
                  <Typography variant="body2" fontWeight={600}>{trip.pickup_point}</Typography>
                </Box>
              </Box>
              <Box sx={{ ml: '15px', borderLeft: '2px dashed #e0e0e0', height: 24 }} />
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: '50%', bgcolor: '#e74c3c',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Typography sx={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>B</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">{tt('trip.dropoff')}</Typography>
                  <Typography variant="body2" fontWeight={600}>{trip.dropoff_point}</Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Details */}
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
              {tt('trip.details')}
            </Typography>
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <DetailRow icon={<AccessTime fontSize="small" />} label={tt('trip.time')} value={formatDate(trip.trip_date)} />
              <DetailRow icon={<EventSeat fontSize="small" />} label={tt('trip.seats')} value={`${trip.seats} ${tt('trip.seats.unit')}`} />
              <DetailRow
                icon={<span style={{ fontSize: 16 }}>📦</span>}
                label={tt('trip.category')}
                value={tt(`cat.${trip.category}`)}
              />
              <DetailRow
                icon={<span style={{ fontSize: 16 }}>{carType?.emoji}</span>}
                label={tt('trip.carType')}
                value={carType?.label}
              />
              {trip.luggage && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">🧳 {tt('trip.luggage')}</Typography>
                  <Chip label={tt('trip.luggage.has')} size="small" color="warning" />
                </Box>
              )}
            </Box>
            {trip.notes && (
              <Box sx={{ mt: 1.5, p: 1.25, bgcolor: '#fffbf0', borderRadius: 2, border: '1px solid #f5a623' }}>
                <Typography variant="caption" color="text.secondary">💬 {trip.notes}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Price */}
        <Card sx={{ mb: 2, bgcolor: '#f0fff4', border: '1px solid #c6f6d5' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">{tt('trip.pricePerSeat')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatPrice(trip.price_per_seat)} × {trip.seats}
                </Typography>
              </Box>
              <Typography variant="h5" fontWeight={700} color="success.main">
                {formatPrice(trip.total_price)}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* ─── Haydovchi ma'lumotlari (yo'lovchi uchun) ─── */}
        {isPassenger && trip.driver && (
          <ContactCard
            type="driver"
            person={trip.driver}
            tt={tt}
          />
        )}

        {/* Actions */}
        {isDriver && trip.status === 'accepted' && (
          <Button
            fullWidth variant="contained" size="large"
            onClick={() => statusMutation.mutate('in_progress')}
            disabled={statusMutation.isLoading}
            sx={{ mb: 1.5, bgcolor: '#2980b9', borderRadius: 3, py: 1.5 }}
          >
            {tt('trip.startTrip')}
          </Button>
        )}
        {isDriver && trip.status === 'in_progress' && (
          <Button
            fullWidth variant="contained" color="success" size="large"
            onClick={() => statusMutation.mutate('completed')}
            disabled={statusMutation.isLoading}
            sx={{ mb: 1.5, borderRadius: 3, py: 1.5 }}
          >
            {tt('trip.completeTrip')}
          </Button>
        )}
        {canCancel && (
          <Button
            fullWidth variant="outlined" color="error" size="large"
            onClick={() => setCancelDialog(true)}
            sx={{ borderRadius: 3, py: 1.5 }}
          >
            {tt('trip.cancel')}
          </Button>
        )}
      </Box>

      {/* Cancel dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{tt('trip.cancel.title')}</DialogTitle>
        <DialogContent>
          <TextField
            label={tt('trip.cancel.reason')}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            fullWidth multiline rows={3}
            placeholder={tt('trip.cancel.placeholder')}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setCancelDialog(false)} variant="outlined">
            {tt('common.back')}
          </Button>
          <Button
            onClick={() => cancelMutation.mutate()}
            variant="contained" color="error"
            disabled={cancelMutation.isLoading}
          >
            {tt('trip.cancel')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ─── Helper komponentlar ─────────────────────────────────────────────────────

function DetailRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
        {icon}
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </Box>
      <Typography variant="body2" fontWeight={600}>{value}</Typography>
    </Box>
  );
}

/**
 * Universal contact card — yo'lovchi yoki haydovchi uchun.
 *
 * Haydovchi tomondan: yo'lovchining ismi, telefoni, Telegram username
 * Yo'lovchi tomondan: haydovchining ismi, telefoni, mashina, reyting
 *
 * Har ikkalasida ham:
 *  • 📞 Qo'ng'iroq tugmasi (tel: link, default qo'ng'iroq ilovasi)
 *  • 💬 Telegram tugmasi (agar username bor bo'lsa)
 */
function ContactCard({ type, person, tt }) {
  const isDriver = type === 'driver';
  const profile = person.driver_profile;
  const accentColor = isDriver ? '#f5a623' : '#2980b9';
  const bgColor = isDriver ? '#fff8e1' : '#e8f4fd';
  const titleKey = isDriver ? 'trip.driver' : 'trip.passenger';

  const hasPhone = !!person.phone && !person.phone.startsWith('tg_');
  const hasTelegram = !!person.username || !!person.telegram_id;

  return (
    <Card sx={{ mb: 2, bgcolor: bgColor, border: `1px solid ${accentColor}40` }}>
      <CardContent sx={{ p: 2 }}>
        <Typography
          variant="caption" color="text.secondary"
          fontWeight={600} sx={{ textTransform: 'uppercase' }}
        >
          {tt(titleKey)}
        </Typography>

        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: '50%', bgcolor: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Person sx={{ color: '#fff', fontSize: 26 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body1" fontWeight={700} noWrap>
              {person.full_name}
            </Typography>
            {person.username && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                @{person.username}
              </Typography>
            )}
            {hasPhone && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                📞 {formatPhoneDisplay(person.phone)}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Mashina (faqat haydovchi uchun) */}
        {isDriver && profile && (
          <Box sx={{ p: 1.25, bgcolor: 'rgba(255,255,255,0.6)', borderRadius: 2, mb: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">{tt('trip.car')}</Typography>
              <Typography variant="caption" fontWeight={600}>
                {profile.car_model} {profile.car_color ? `(${profile.car_color})` : ''}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">{tt('trip.carNumber')}</Typography>
              <Chip
                label={profile.car_number}
                size="small"
                sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">{tt('trip.rating')}</Typography>
              <Typography variant="caption" fontWeight={600}>
                ⭐ {profile.rating?.toFixed(1)}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Contact tugmalari */}
        <Stack direction="row" spacing={1}>
          {hasPhone && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<Phone />}
              onClick={() => callPhone(person.phone)}
              sx={{
                bgcolor: '#27ae60',
                '&:hover': { bgcolor: '#229954' },
                borderRadius: 2,
                py: 1,
              }}
            >
              {tt('common.call')}
            </Button>
          )}
          {hasTelegram && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<Telegram />}
              onClick={() => writeOnTelegram(person)}
              sx={{
                bgcolor: '#0088cc',
                '&:hover': { bgcolor: '#006fa6' },
                borderRadius: 2,
                py: 1,
              }}
            >
              {tt('common.write')}
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ─── PickupLocationCard ──────────────────────────────────────────────────────
// Yo'lovchi belgilagan lokatsiyani xaritada ko'rsatadi va navigatsiya app'larga
// to'g'ridan-to'g'ri yo'l ochadi.
//
// Strategy:
//   • Yandex Static Maps API (api kalit kerak emas hozircha)
//   • Yandex Maps web (rtext) — marshrut tuzish
//   • Google Maps fallback
//   • OSM static rasm fallback (agar Yandex 4xx qaytarsa)
function PickupLocationCard({ lat, lng, address, tt }) {
  // ─ Deeplinks ────────────────────────────────────────────────────────────
  const yandexMapsUrl = `https://yandex.com/maps/?rtext=~${lat},${lng}&rtt=auto&z=16`;
  const gmapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

  // ─ Static map (Yandex asosiy, OSM fallback) ─────────────────────────────
  // Yandex format: ll=lng,lat (E'TIBOR: lng birinchi)
  // pt=lng,lat,STYLE — pm2rdl = red large pushpin
  const yandexStaticUrl =
    `https://static-maps.yandex.ru/1.x/?` +
    `ll=${lng},${lat}&z=15&size=600,300&l=map` +
    `&pt=${lng},${lat},pm2rdl`;

  const osmStaticUrl =
    `https://staticmap.openstreetmap.de/staticmap.php?` +
    `center=${lat},${lng}&zoom=15&size=600x300&maptype=mapnik` +
    `&markers=${lat},${lng},red-pushpin`;

  const openLink = (url) => {
    if (window.Telegram?.WebApp?.openLink) {
      window.Telegram.WebApp.openLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <Card sx={{ mb: 2, overflow: 'hidden' }}>
      <CardContent sx={{ p: 2, pb: 1 }}>
        <Typography
          variant="caption" color="text.secondary"
          fontWeight={600} sx={{ textTransform: 'uppercase' }}
        >
          📍 {tt('trip.pickup')}
        </Typography>
        {address && (
          <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>
            {address}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </Typography>
      </CardContent>

      {/* Static map preview */}
      <Box
        component="img"
        src={yandexStaticUrl}
        alt="Pickup location"
        onError={(e) => {
          if (e.target.src !== osmStaticUrl) {
            e.target.src = osmStaticUrl;
          }
        }}
        onClick={() => openLink(yandexMapsUrl)}
        sx={{
          width: '100%',
          height: 180,
          objectFit: 'cover',
          cursor: 'pointer',
          display: 'block',
          bgcolor: '#e8e8e8',
        }}
      />

      <Stack direction="row" spacing={1} sx={{ p: 1.5 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={() => openLink(yandexMapsUrl)}
          sx={{ bgcolor: '#fc3f1d', '&:hover': { bgcolor: '#d93519' }, borderRadius: 2 }}
        >
          🧭 Yandex
        </Button>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => openLink(gmapsUrl)}
          sx={{ borderColor: '#4285f4', color: '#4285f4', borderRadius: 2 }}
        >
          🗺️ Google
        </Button>
      </Stack>
    </Card>
  );
}
