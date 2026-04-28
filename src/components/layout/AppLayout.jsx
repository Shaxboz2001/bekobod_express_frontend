import { Box, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { AddCircleOutline, ListAlt, Person, DirectionsCar } from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectRole } from '../../features/auth/authSlice';
import { useT } from '../../i18n';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = useSelector(selectRole);
  const tt = useT();

  const passengerTabs = [
    { labelKey: 'nav.newTrip',  icon: <AddCircleOutline />, path: '/new-trip' },
    { labelKey: 'nav.myTrips',  icon: <ListAlt />,           path: '/my-trips' },
    { labelKey: 'nav.profile',  icon: <Person />,             path: '/profile' },
  ];

  const driverTabs = [
    { labelKey: 'nav.activeTrips', icon: <ListAlt />,        path: '/active-trips' },
    { labelKey: 'nav.driverTrips', icon: <DirectionsCar />,  path: '/my-trips' },
    { labelKey: 'nav.profile',     icon: <Person />,          path: '/profile' },
  ];

  const tabs = role === 'driver' ? driverTabs : passengerTabs;
  const current = tabs.findIndex((t) => location.pathname.startsWith(t.path));

  return (
    <Box sx={{ pb: '72px', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Outlet />
      <Paper
        elevation={0}
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }}
      >
        <BottomNavigation
          value={current === -1 ? false : current}
          onChange={(_, i) => navigate(tabs[i].path)}
        >
          {tabs.map((t) => (
            <BottomNavigationAction
              key={t.path}
              label={tt(t.labelKey)}
              icon={t.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
