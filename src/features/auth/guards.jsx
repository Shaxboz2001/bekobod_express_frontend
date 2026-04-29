import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuth, selectRole } from './authSlice';

/**
 * Auth-required guard. Authentikatsiya bo'lmagan user'ni /auth ga yuboradi.
 * Telegram WebApp ichida bo'lsa /auth avtomatik login qiladi.
 */
export function RequireAuth({ children }) {
  const isAuth = useSelector(selectIsAuth);
  const location = useLocation();
  if (!isAuth) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }
  return children;
}

/**
 * Admin-only guard. Authentikatsiya + role='admin' tekshiradi.
 * Eslatma: bu faqat UX qatlami. Real himoya backend JWT claim'ida bo'lishi shart.
 */
export function RequireAdmin({ children }) {
  const isAuth = useSelector(selectIsAuth);
  const role = useSelector(selectRole);

  if (!isAuth) {
    return <Navigate to="/admin/login" replace />;
  }
  if (role !== 'admin') {
    // Auth bor, lekin admin emas — o'z home page'iga yo'naltir
    return <Navigate to="/" replace />;
  }
  return children;
}

/**
 * Root redirect ('/'). Role'ga qarab to'g'ri sahifaga yo'naltiradi.
 *  - admin     → /admin
 *  - driver    → /active-trips (yoki ?accept=<id> bo'lsa /accept-trip/<id>)
 *  - passenger → /new-trip
 *  - guest     → /auth
 *
 * Telegram inline tugma URL'i `?accept=<trip_id>` bilan keladi.
 * Agar driver login bo'lgan va shu parameter bor bo'lsa — accept page'ga
 * yo'naltiramiz.
 */
export function RoleRedirect() {
  const isAuth = useSelector(selectIsAuth);
  const role = useSelector(selectRole);

  if (!isAuth) {
    // Auth flow URL parametrini saqlab qolishi kerak — AuthPage'da o'qiladi
    return <Navigate to={`/auth${window.location.search}`} replace />;
  }

  // ?accept=<trip_id> — driver inline tugmadan keldi
  if (role === 'driver') {
    try {
      const params = new URLSearchParams(window.location.search);
      const acceptId = parseInt(params.get('accept'), 10);
      if (Number.isFinite(acceptId) && acceptId > 0) {
        return <Navigate to={`/accept-trip/${acceptId}`} replace />;
      }
    } catch (_) {}
  }

  if (role === 'admin')  return <Navigate to="/admin" replace />;
  if (role === 'driver') return <Navigate to="/active-trips" replace />;
  return <Navigate to="/new-trip" replace />;
}
