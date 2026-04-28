import { Chip } from '@mui/material';
import { TRIP_STATUS } from '../../utils/constants';
import { useT } from '../../i18n';

export function TripStatusChip({ status, size = 'small' }) {
  const tt = useT();
  const cfg = TRIP_STATUS[status] || { color: 'default', emoji: '' };
  const label = tt(`status.${status}`);
  return (
    <Chip
      label={`${cfg.emoji} ${label}`}
      color={cfg.color}
      size={size}
      sx={{ fontWeight: 600 }}
    />
  );
}
