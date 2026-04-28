import { Card, CardContent, Box, Typography, Chip, Divider, Button, Avatar } from '@mui/material';
import { LocationOn, FlagOutlined, AccessTime, EventSeat, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { TripStatusChip } from './TripStatusChip';
import { DIRECTION, formatPrice, formatDate } from '../../utils/constants';
import { selectRole } from '../../features/auth/authSlice';
import { useT } from '../../i18n';

export default function TripCard({ trip, showAccept = false, onAccept, loading }) {
  const navigate = useNavigate();
  const role = useSelector(selectRole);
  const tt = useT();

  const dir = DIRECTION[trip.direction];
  const isDriver = role === 'driver';
  const isPassenger = role === 'passenger';

  return (
    <Card sx={{ mb: 1.5 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              #{trip.id}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
              <Chip
                label={`${dir?.emoji} ${dir?.short}`}
                size="small"
                sx={{ bgcolor: '#1a1a2e', color: '#fff', fontWeight: 600, fontSize: '0.7rem' }}
              />
              <Chip
                label={tt(`cat.${trip.category}`)}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            </Box>
          </Box>
          <TripStatusChip status={trip.status} />
        </Box>

        {/* Route */}
        <Box sx={{ mb: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocationOn sx={{ color: '#1a1a2e', fontSize: 16, flexShrink: 0 }} />
            <Typography variant="body2" fontWeight={500} noWrap>{trip.pickup_point}</Typography>
          </Box>
          <Box sx={{ pl: 2, borderLeft: '2px dashed #e0e0e0', ml: '7px', py: 0.25 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FlagOutlined sx={{ color: '#e74c3c', fontSize: 16, flexShrink: 0 }} />
            <Typography variant="body2" fontWeight={500} noWrap>{trip.dropoff_point}</Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        {/* Meta row */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {formatDate(trip.trip_date)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <EventSeat sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {trip.seats} {tt('trip.seats.unit')}
              </Typography>
            </Box>
          </Box>
          <Typography variant="body2" fontWeight={700} color="secondary.main">
            {formatPrice(trip.total_price)}
          </Typography>
        </Box>

        {/* ─── Yo'lovchi preview (haydovchi uchun, faol e'lonlarda) ─── */}
        {/* Haydovchi e'lonni qabul qilishdan oldin ham yo'lovchi ismini ko'radi */}
        {isDriver && trip.passenger && (
          <Box sx={{
            mt: 1.5, p: 1, bgcolor: '#f0f9ff', borderRadius: 2,
            display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <Avatar sx={{ width: 24, height: 24, bgcolor: '#2980b9', fontSize: '0.7rem' }}>
              {trip.passenger.full_name?.[0]}
            </Avatar>
            <Typography variant="caption" color="text.primary" fontWeight={500} noWrap sx={{ flex: 1 }}>
              {trip.passenger.full_name}
            </Typography>
          </Box>
        )}

        {/* ─── Haydovchi info (yo'lovchi uchun, qabul qilingan e'lonlarda) ─── */}
        {isPassenger && trip.driver && trip.status !== 'active' && (
          <Box sx={{
            mt: 1.5, p: 1.25, bgcolor: '#f0fff4', borderRadius: 2,
            border: '1px solid #c6f6d5',
          }}>
            <Typography variant="caption" color="success.dark" fontWeight={600}>
              🚗 {trip.driver.full_name} · {trip.driver.phone}
            </Typography>
            {trip.driver.driver_profile && (
              <Typography variant="caption" color="text.secondary" display="block">
                {trip.driver.driver_profile.car_model} · {trip.driver.driver_profile.car_number}
              </Typography>
            )}
          </Box>
        )}

        {/* Notes */}
        {trip.notes && (
          <Box sx={{ mt: 1, p: 1, bgcolor: '#fffbf0', borderRadius: 1.5 }}>
            <Typography variant="caption" color="text.secondary">💬 {trip.notes}</Typography>
          </Box>
        )}

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
          <Button
            size="small"
            variant="outlined"
            fullWidth
            onClick={() => navigate(`/trips/${trip.id}`)}
            sx={{ borderRadius: 2 }}
          >
            {tt('trip.detail')}
          </Button>
          {showAccept && trip.status === 'active' && (
            <Button
              size="small"
              variant="contained"
              fullWidth
              onClick={() => onAccept?.(trip.id)}
              disabled={loading}
              sx={{ bgcolor: '#1a1a2e', borderRadius: 2 }}
            >
              {tt('trip.accept')}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
