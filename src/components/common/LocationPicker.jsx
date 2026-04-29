import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, CircularProgress, Alert,
} from '@mui/material';
import { Close, MyLocation, Check } from '@mui/icons-material';
import { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import { useT } from '../../i18n';

// ─── Leaflet marker icon fix ─────────────────────────────────────────────────
// Webpack/CRA bilan Leaflet icon path noto'g'ri rezolv qilinadi.
// CDN'dan yuklab quyamiz.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ─── Default markaz: Bekobod ─────────────────────────────────────────────────
const BEKOBOD_CENTER = [40.218, 69.272];
const TASHKENT_CENTER = [41.311, 69.279];

// ─── Joy bosgan paytda marker'ni yangilash uchun bolаjak komponent ──────────
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

/**
 * Lokatsiyani tanlash dialog'i.
 *
 * Qabul qiladi:
 *   • open: bool — ochiqmi
 *   • onClose: () => void
 *   • onConfirm: ({ lat, lng, address }) => void
 *   • initialPos: [lat, lng] yoki null
 *   • directionHint: 'bekobod_to_tashkent' | 'tashkent_to_bekobod' (default markaz)
 *
 * Foydalanuvchi:
 *   1. "📍 Mening joyim" tugmasini bosadi → Geolocation API
 *   2. Yoki xaritada to'g'ridan-to'g'ri joy bosadi
 *   3. Reverse geocoding (Nominatim) avtomatik ishlaydi → manzil topiladi
 *   4. "Tasdiqlash" tugmasi
 *
 * Production cheklovlari:
 *   • Nominatim 1 req/s rate limit'i bor — agressiv user'larda fail bo'lishi
 *     mumkin. Productionda o'z geocoding service'iga o'tish tavsiya etiladi.
 *   • iOS Safari'da Geolocation HTTPS talab qiladi (Telegram WebApp HTTPS — OK)
 *   • Telegram'da "request_location" ham ishlaydi (alohida, bu komponentdan tashqari)
 */
export default function LocationPicker({
  open,
  onClose,
  onConfirm,
  initialPos,
  directionHint,
}) {
  const tt = useT();
  const [pos, setPos] = useState(initialPos);
  const [address, setAddress] = useState('');
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [error, setError] = useState('');

  const center = directionHint === 'tashkent_to_bekobod'
    ? TASHKENT_CENTER
    : BEKOBOD_CENTER;

  // Dialog ochilganda initial pos bilan boshlash
  useEffect(() => {
    if (open) {
      setPos(initialPos);
      setAddress('');
      setError('');
    }
  }, [open, initialPos]);

  // ─── Reverse geocoding (Nominatim) ─────────────────────────────────────────
  // Pos o'zgarganda manzilni qidiramiz. Debounce qilingan.
  useEffect(() => {
    if (!pos) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoadingAddr(true);
      try {
        const url = new URL('https://nominatim.openstreetmap.org/reverse');
        url.searchParams.set('format', 'jsonv2');
        url.searchParams.set('lat', pos[0]);
        url.searchParams.set('lon', pos[1]);
        url.searchParams.set('zoom', '18');
        url.searchParams.set('accept-language', 'ru,uz');

        const res = await fetch(url, {
          signal: ctrl.signal,
          headers: {
            // Nominatim Identification policy talab qiladi
            'Accept': 'application/json',
          },
        });
        const data = await res.json();
        // display_name odatda full address — biz qisqartiramiz
        const addr = data.display_name || '';
        setAddress(addr.split(',').slice(0, 3).join(',').trim());
      } catch (e) {
        if (e.name !== 'AbortError') {
          // Manzil topilmasa ham ko'rsatkichni davom ettirish mumkin
          setAddress('');
        }
      } finally {
        setLoadingAddr(false);
      }
    }, 500);  // debounce 500ms

    return () => {
      ctrl.abort();
      clearTimeout(timer);
    };
  }, [pos]);

  // ─── Geolocation API ──────────────────────────────────────────────────────
  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(tt('common.error'));
      return;
    }
    setLoadingGeo(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (geoPos) => {
        setPos([geoPos.coords.latitude, geoPos.coords.longitude]);
        setLoadingGeo(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? 'Жойлашувга рухсат берилмаган'
            : 'Жойлашувни топиб бўлмади',
        );
        setLoadingGeo(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [tt]);

  const handleConfirm = () => {
    if (!pos) return;
    onConfirm({
      lat: pos[0],
      lng: pos[1],
      address: address || null,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      // Telegram WebApp'da fullscreen native overlay'i bilan to'qnashmaydi
      // chunki bu MUI Dialog Modal bo'lsa ham, fullscreen mode'da Backdrop yo'q
      PaperProps={{ sx: { bgcolor: '#fff' } }}
    >
      <DialogTitle sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        py: 1.5, px: 2, borderBottom: '1px solid #e0e0e0',
      }}>
        <Typography variant="h6" fontWeight={700}>
          📍 Жойни танлаш
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, position: 'relative' }}>
        {error && (
          <Alert severity="error" sx={{ position: 'absolute', top: 8, left: 8, right: 8, zIndex: 1000 }}>
            {error}
          </Alert>
        )}

        {/* Xarita */}
        <Box sx={{ height: 'calc(100vh - 220px)', minHeight: 300 }}>
          <MapContainer
            center={pos || center}
            zoom={pos ? 15 : 11}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            <ClickHandler onPick={setPos} />
            {pos && <Marker position={pos} />}
          </MapContainer>
        </Box>

        {/* Joriy holat panel */}
        <Box sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          bgcolor: '#fff', p: 2, borderTop: '1px solid #e0e0e0',
          boxShadow: '0 -4px 16px rgba(0,0,0,0.05)',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Box sx={{ flex: 1, mr: 1, minWidth: 0 }}>
              {pos ? (
                <>
                  <Typography variant="caption" color="text.secondary">
                    Танланган жой
                  </Typography>
                  {loadingAddr ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                      <CircularProgress size={12} />
                      <Typography variant="caption" color="text.secondary">
                        Манзил топилмоқда...
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {address || `${pos[0].toFixed(5)}, ${pos[1].toFixed(5)}`}
                    </Typography>
                  )}
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Хаританинг исталган жойини босинг ёки 📍 тугмасини босинг
                </Typography>
              )}
            </Box>
            <Button
              size="small"
              variant="outlined"
              startIcon={loadingGeo ? <CircularProgress size={14} /> : <MyLocation />}
              onClick={useMyLocation}
              disabled={loadingGeo}
              sx={{ borderRadius: 2, flexShrink: 0 }}
            >
              {loadingGeo ? '...' : 'Менинг жойим'}
            </Button>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={onClose} variant="outlined" fullWidth>
          {tt('common.cancel')}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          startIcon={<Check />}
          disabled={!pos}
          fullWidth
          sx={{ bgcolor: '#1a1a2e' }}
        >
          {tt('common.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
