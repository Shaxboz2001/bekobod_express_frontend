/**
 * AcceptTripPage — Telegram inline tugma bossa keladigan sahifa.
 *
 * Flow:
 *   1. Haydovchi Telegram'da "✅ Қабул қилиш" tugmasini bosadi
 *   2. WebApp ochiladi: /accept-trip/:id
 *   3. Bu sahifa ochilganda:
 *      a. Loading state — "Қабул қилинмоқда..."
 *      b. POST /trips/:id/accept chaqiriladi
 *      c. Muvaffaqiyat → trip detail sahifasiga yo'naltiriladi
 *      d. Xato → tushuntirish + "Эълонлар рўйхатига" tugmasi
 *
 * Race condition:
 *   • Backend `with_for_update()` qulflash bilan boshqa haydovchi qabul qilgan
 *     bo'lsa, 409 yoki 400 qaytaradi. Frontend tushunarli xato ko'rsatadi.
 *
 * UX:
 *   • Bir bosishda hammasi avtomatik
 *   • Foydalanuvchi tugmani bosish kerak emas
 *   • Loading → success → trip detail (3 daqiqa ichida bo'ladi)
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, CircularProgress, Button, Alert,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { useSelector } from 'react-redux';

import { tripsApi } from '../../api/services';
import { selectRole } from '../../features/auth/authSlice';
import { useT } from '../../i18n';
import { useTelegram } from '../../hooks/useTelegram';

// Holat enum
const S = {
  ACCEPTING: 'accepting',
  SUCCESS:   'success',
  ERROR:     'error',
};

export default function AcceptTripPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = useSelector(selectRole);
  const tt = useT();
  const { haptic } = useTelegram();
  const qc = useQueryClient();

  const [state, setState] = useState(S.ACCEPTING);
  const [errorMsg, setErrorMsg] = useState('');

  const acceptMut = useMutation(
    (tripId) => tripsApi.accept(tripId).then((r) => r.data),
    {
      onSuccess: (data) => {
        haptic?.('medium');
        setState(S.SUCCESS);
        qc.invalidateQueries('my-trips');
        qc.invalidateQueries('active-trips');
        // 1.2 sekundga muvaffaqiyat ekranini ko'rsatamiz
        setTimeout(() => navigate(`/trips/${data.id}`, { replace: true }), 1200);
      },
      onError: (err) => {
        haptic?.('error');
        const detail = err.response?.data?.detail || tt('common.error');
        // Backend'dan kelgan tipik xatolarni mahalliylashtiramiz
        let userMsg;
        if (typeof detail === 'string') {
          if (detail.toLowerCase().includes('not found')) {
            userMsg = 'Эълон топилмади. Балки ўчирилган.';
          } else if (
            detail.toLowerCase().includes('already') ||
            detail.toLowerCase().includes('not active') ||
            detail.toLowerCase().includes('accepted')
          ) {
            userMsg = '⏰ Эълон бошқа ҳайдовчи томонидан қабул қилинган';
          } else if (detail.toLowerCase().includes('verified')) {
            userMsg = 'Ҳисобингиз ҳали тасдиқланмаган. Админ тасдиқлагач қабул қила оласиз.';
          } else {
            userMsg = detail;
          }
        } else {
          userMsg = tt('common.error');
        }
        setErrorMsg(userMsg);
        setState(S.ERROR);
      },
    },
  );

  // Sahifa mount bo'lganda darhol accept'ni boshlaymiz
  useEffect(() => {
    // Faqat haydovchi qabul qila oladi
    if (role !== 'driver') {
      setErrorMsg('Фақат ҳайдовчилар эълон қабул қила олади');
      setState(S.ERROR);
      return;
    }
    if (!id || isNaN(parseInt(id, 10))) {
      setErrorMsg('Эълон ID нотўғри');
      setState(S.ERROR);
      return;
    }
    acceptMut.mutate(parseInt(id, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: '#f4f6f9', p: 2.5,
    }}>
      <Card sx={{ width: '100%', maxWidth: 360 }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          {state === S.ACCEPTING && <AcceptingScreen tt={tt} tripId={id} />}
          {state === S.SUCCESS && <SuccessScreen tt={tt} tripId={id} />}
          {state === S.ERROR && (
            <ErrorScreen
              tt={tt}
              errorMsg={errorMsg}
              onBack={() => navigate('/active-trips', { replace: true })}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

// ─── Screens ────────────────────────────────────────────────────────────────

function AcceptingScreen({ tt, tripId }) {
  return (
    <>
      <Box sx={{
        width: 80, height: 80, mx: 'auto', mb: 2,
        bgcolor: '#e8f4fd', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CircularProgress sx={{ color: '#1a1a2e' }} />
      </Box>
      <Typography variant="h6" fontWeight={700} mb={1}>
        Қабул қилинмоқда...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Эълон #{tripId} учун маълумотлар текширилмоқда
      </Typography>
    </>
  );
}

function SuccessScreen({ tt, tripId }) {
  return (
    <>
      <Box sx={{
        width: 80, height: 80, mx: 'auto', mb: 2,
        bgcolor: '#e8f5e9', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CheckCircleIcon sx={{ color: '#27ae60', fontSize: 48 }} />
      </Box>
      <Typography variant="h6" fontWeight={700} mb={1} color="success.dark">
        ✅ Эълон қабул қилинди!
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Тафсилотларга йўналтирилмоқда...
      </Typography>
    </>
  );
}

function ErrorScreen({ tt, errorMsg, onBack }) {
  return (
    <>
      <Box sx={{
        width: 80, height: 80, mx: 'auto', mb: 2,
        bgcolor: '#fdecea', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <ErrorIcon sx={{ color: '#e74c3c', fontSize: 48 }} />
      </Box>
      <Typography variant="h6" fontWeight={700} mb={1}>
        Қабул қилиб бўлмади
      </Typography>
      <Alert severity="warning" sx={{ mb: 2, textAlign: 'left' }}>
        {errorMsg}
      </Alert>
      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={onBack}
        sx={{ bgcolor: '#1a1a2e', borderRadius: 3, py: 1.5 }}
      >
        Эълонлар рўйхатига
      </Button>
    </>
  );
}
