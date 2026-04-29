import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box, CircularProgress } from '@mui/material';
import { SnackbarProvider } from 'notistack';

import { store } from './app/store';
import userTheme from './theme/userTheme';
import adminTheme from './theme/adminTheme';
import { I18nProvider } from './i18n';

import { RequireAuth, RequireAdmin, RoleRedirect } from './features/auth/guards';

// ─── User pages (eager — Telegram WebApp asosiy use-case) ────────────────────
import AppLayout from './components/layout/AppLayout';
import AuthPage from './pages/auth/AuthPage';
import NewTripPage from './pages/trips/NewTripPage';
import MyTripsPage from './pages/trips/MyTripsPage';
import ActiveTripsPage from './pages/trips/ActiveTripsPage';
import TripDetailPage from './pages/trips/TripDetailPage';
import AcceptTripPage from './pages/trips/AcceptTripPage';
import ProfilePage from './pages/profile/ProfilePage';

// ─── Admin pages (lazy — bundle bloat'ni oldini olish) ───────────────────────
// Admin code faqat admin foydalanuvchi uchun yuklanadi.
// Bu user (passenger/driver) initial bundle'ini ~40-60% ga kichraytiradi.
const AdminLoginPage      = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminLayout         = lazy(() => import('./components/admin/AdminLayout'));
const DashboardPage       = lazy(() => import('./pages/admin/DashboardPage'));
const TripsPage           = lazy(() => import('./pages/admin/TripsPage'));
const AdminTripDetailPage = lazy(() => import('./pages/admin/AdminTripDetailPage'));
const UsersPage           = lazy(() => import('./pages/admin/UsersPage'));
const DriversPage         = lazy(() => import('./pages/admin/DriversPage'));
const PricingPage         = lazy(() => import('./pages/admin/PricingPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 20_000,
    },
  },
});

// Suspense fallback — admin chunk yuklangunicha ko'rsatiladi
function AdminLoading() {
  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: '#f4f6f9',
    }}>
      <CircularProgress sx={{ color: '#1a1a2e' }} />
    </Box>
  );
}

/**
 * Admin'ga oid barcha route'larni qoplash uchun shell.
 * Admin theme'ni shu yerda almashtiramiz — user theme bilan to'qnashmaydi.
 */
function AdminShell({ children }) {
  return (
    <ThemeProvider theme={adminTheme}>
      <Suspense fallback={<AdminLoading />}>
        {children}
      </Suspense>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={userTheme}>
          <CssBaseline />
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            autoHideDuration={3500}
          >
            <BrowserRouter>
              <Routes>
                {/* Public */}
                <Route path="/auth" element={<AuthPage />} />

                {/* Admin login — alohida shell admin theme bilan */}
                <Route
                  path="/admin/login"
                  element={
                    <AdminShell>
                      <AdminLoginPage />
                    </AdminShell>
                  }
                />

                {/* Admin protected routes — RequireAdmin guard + admin theme */}
                <Route
                  path="/admin"
                  element={
                    <RequireAdmin>
                      <AdminShell>
                        <AdminLayout />
                      </AdminShell>
                    </RequireAdmin>
                  }
                >
                  <Route index               element={<DashboardPage />} />
                  <Route path="trips"        element={<TripsPage />} />
                  <Route path="trips/:id"    element={<AdminTripDetailPage />} />
                  <Route path="users"        element={<UsersPage />} />
                  <Route path="drivers"      element={<DriversPage />} />
                  <Route path="pricing"      element={<PricingPage />} />
                </Route>

                {/* User protected routes */}
                <Route
                  element={
                    <RequireAuth>
                      <AppLayout />
                    </RequireAuth>
                  }
                >
                  <Route path="/new-trip"     element={<NewTripPage />} />
                  <Route path="/my-trips"     element={<MyTripsPage />} />
                  <Route path="/active-trips" element={<ActiveTripsPage />} />
                  <Route path="/trips/:id"    element={<TripDetailPage />} />
                  <Route path="/profile"      element={<ProfilePage />} />
                </Route>

                {/* Accept trip — Telegram inline tugmasidan keladi.
                    AppLayout'dan tashqari (full-screen UI) lekin auth talab qiladi. */}
                <Route
                  path="/accept-trip/:id"
                  element={
                    <RequireAuth>
                      <AcceptTripPage />
                    </RequireAuth>
                  }
                />

                {/* Root redirect — role'ga qarab */}
                <Route path="/" element={<RoleRedirect />} />

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </SnackbarProvider>
        </ThemeProvider>
      </QueryClientProvider>
      </I18nProvider>
    </Provider>
  );
}
