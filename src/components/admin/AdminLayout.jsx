import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Avatar, Divider, AppBar, Toolbar, IconButton,
  useMediaQuery, useTheme,
} from "@mui/material";
import {
  Dashboard, ListAlt, People, DirectionsCar, AttachMoney, Logout,
  LocalTaxi, Menu as MenuIcon, Close as CloseIcon,
} from "@mui/icons-material";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect, useCallback } from "react";
import { logout, selectUser } from "../../features/auth/authSlice";
import { useT } from "../../i18n";

const W = 260;

const NAV = [
  { labelKey: "admin.nav.dashboard", icon: <Dashboard />,     path: "/admin" },
  { labelKey: "admin.nav.trips",     icon: <ListAlt />,       path: "/admin/trips" },
  { labelKey: "admin.nav.users",     icon: <People />,        path: "/admin/users" },
  { labelKey: "admin.nav.drivers",   icon: <DirectionsCar />, path: "/admin/drivers" },
  { labelKey: "admin.nav.pricing",   icon: <AttachMoney />,   path: "/admin/pricing" },
];

// ─── Custom mobile drawer ────────────────────────────────────────────────────
// MUI Drawer'ni temporary mode'da Telegram WebApp'da ishlamaydi (Modal/Backdrop
// Telegram'ning WebView overlay'i bilan to'qnashadi).
// Yechim: o'zimizning sodda implementation'imiz — pure CSS transform + overlay.
//
// Afzalliklari:
//  • Modal/Portal yo'q — Telegram'da to'g'ri yopiladi
//  • CSS transition tabiiy
//  • body scroll-lock yo'q (Telegram'ga halaqit bermaydi)
//  • z-index aniq belgilangan (1300 — MUI standard)
//
function MobileDrawer({ open, onClose, children, width }) {
  // ESC tugmasi bilan yopish
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Body scroll lock — Telegram WebApp'da native scroll'ga halaqit bermasligi uchun
  // tap-friendly pattern: scroll position'ni saqlaymiz, fixed qilamiz, keyin tiklaymiz
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  return (
    <>
      {/* Backdrop overlay */}
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed',
          inset: 0,
          bgcolor: 'rgba(0,0,0,0.5)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 225ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1299,
          // iOS Safari fix
          WebkitTapHighlightColor: 'transparent',
        }}
      />
      {/* Drawer panel */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width,
          maxWidth: '85vw',
          bgcolor: '#1a1a2e',
          color: '#fff',
          transform: open ? 'translateX(0)' : `translateX(-${width + 10}px)`,
          transition: 'transform 225ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1300,
          boxShadow: open ? '0 8px 32px rgba(0,0,0,0.4)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          // iOS overscroll fix
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </Box>
    </>
  );
}

// ─── Sidebar content ─────────────────────────────────────────────────────────
function SidebarContent({ onClose, showCloseButton }) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const tt = useT();

  const handleNavClick = useCallback((path) => {
    // Drawer'ni AVVAL yopamiz — animation boshlanadi
    onClose?.();
    // Keyin navigate (oz vaqtga kechiktiramiz, hatto frame yo'q bo'lsa ham)
    if (location.pathname !== path) {
      // requestAnimationFrame — Drawer state update'i flush bo'lguncha kutadi
      requestAnimationFrame(() => navigate(path));
    }
  }, [location.pathname, navigate, onClose]);

  const handleLogout = useCallback(() => {
    onClose?.();
    requestAnimationFrame(() => {
      dispatch(logout());
      navigate('/admin/login', { replace: true });
    });
  }, [dispatch, navigate, onClose]);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{
        px: 2.5, py: 2.5,
        display: "flex", alignItems: "center", gap: 1.5,
      }}>
        <Box sx={{
          width: 36, height: 36, bgcolor: "#f5a623", borderRadius: 2,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <LocalTaxi sx={{ color: "#fff", fontSize: 20 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={700} color="#fff" variant="body1">
            Bekobod Express
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
            Admin Panel
          </Typography>
        </Box>
        {showCloseButton && (
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      <List sx={{ px: 1.5, pt: 1.5, flex: 1 }}>
        {NAV.map((item) => {
          const active =
            item.path === "/admin"
              ? location.pathname === "/admin"
              : location.pathname.startsWith(item.path);

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                sx={{
                  borderRadius: 2, px: 2, py: 1,
                  bgcolor: active ? "rgba(245,166,35,0.15)" : "transparent",
                  "&:hover": {
                    bgcolor: active
                      ? "rgba(245,166,35,0.2)"
                      : "rgba(255,255,255,0.06)",
                  },
                  // iOS tap feedback
                  WebkitTapHighlightColor: 'rgba(255,255,255,0.1)',
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 36,
                  color: active ? "#f5a623" : "rgba(255,255,255,0.55)",
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={tt(item.labelKey)}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: active ? 600 : 400,
                    color: active ? "#f5a623" : "rgba(255,255,255,0.85)",
                  }}
                />
                {active && (
                  <Box sx={{
                    width: 6, height: 6, borderRadius: "50%", bgcolor: "#f5a623",
                  }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Avatar sx={{
          width: 32, height: 32, bgcolor: "#f5a623",
          fontSize: "0.8rem", flexShrink: 0,
        }}>
          {user?.full_name?.[0]}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} color="#fff" noWrap>
            {user?.full_name}
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }} noWrap>
            {user?.phone}
          </Typography>
        </Box>
        <IconButton
          size="small"
          onClick={handleLogout}
          sx={{ color: "rgba(255,255,255,0.5)" }}
        >
          <Logout fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}

// ─── Asosiy layout ───────────────────────────────────────────────────────────
export default function AdminLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Defence-in-depth: route o'zgarganda majburiy yopish
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Mobile/desktop switch'da state'ni reset qilish
  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const closeDrawer = useCallback(() => setMobileOpen(false), []);

  const handleAppBarLogout = useCallback(() => {
    setMobileOpen(false);
    dispatch(logout());
    navigate('/admin/login', { replace: true });
  }, [dispatch, navigate]);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f6f9" }}>
      {/* Desktop — permanent MUI Drawer (Modal yo'q, muammosiz) */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: W,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: W,
              backgroundColor: '#1a1a2e',
              color: '#fff',
            },
          }}
        >
          <SidebarContent />
        </Drawer>
      )}

      {/* Mobile — custom drawer (MUI Modal ishlatmaydi, Telegram WebApp'da ishlaydi) */}
      {isMobile && (
        <MobileDrawer
          open={mobileOpen}
          onClose={closeDrawer}
          width={W}
        >
          <SidebarContent
            onClose={closeDrawer}
            showCloseButton
          />
        </MobileDrawer>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {isMobile && (
          <AppBar
            position="static"
            elevation={0}
            sx={{
              bgcolor: "#fff",
              borderBottom: "1px solid #e0e0e0",
              color: "text.primary",
            }}
          >
            <Toolbar>
              <IconButton onClick={() => setMobileOpen(true)} edge="start">
                <MenuIcon />
              </IconButton>
              <Typography fontWeight={700} sx={{ ml: 1 }}>
                Bekobod Express
              </Typography>
              <Box sx={{ flex: 1 }} />
              <IconButton onClick={handleAppBarLogout}>
                <Logout />
              </IconButton>
            </Toolbar>
          </AppBar>
        )}

        <Box sx={{ p: { xs: 2, md: 3 }, flex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
