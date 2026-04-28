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
 *  - driver    → /active-trips
 *  - passenger → /new-trip
 *  - guest     → /auth
 */
export function RoleRedirect() {
  const isAuth = useSelector(selectIsAuth);
  const role = useSelector(selectRole);

  if (!isAuth) return <Navigate to="/auth" replace />;
  if (role === 'admin')  return <Navigate to="/admin" replace />;
  if (role === 'driver') return <Navigate to="/active-trips" replace />;
  return <Navigate to="/new-trip" replace />;
}
