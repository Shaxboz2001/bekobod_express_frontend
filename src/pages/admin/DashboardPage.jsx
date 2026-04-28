import { Grid, Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import { ListAlt, CheckCircle, Cancel, AttachMoney, DirectionsCar, Today } from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts';
import { useQuery } from 'react-query';
import { adminTripsApi as tripsApi } from '../../api/services';
import { formatPrice } from '../../utils';

function StatCard({ title, value, icon, color, subtitle }) {
  const colors = { primary:'#1a1a2e', secondary:'#f5a623', success:'#27ae60', error:'#e74c3c', info:'#2980b9', warning:'#f39c12' };
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ my: 0.5 }}>{value ?? '—'}</Typography>
            {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
          </Box>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: colors[color] || colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: a, isLoading } = useQuery('analytics', () => tripsApi.analytics().then(r => r.data), { refetchInterval: 60_000 });

  const barData = a ? [
    { name: "Фаол",       val: a.active_trips,    fill: '#f39c12' },
    { name: "Якунланди",  val: a.completed_trips, fill: '#27ae60' },
    { name: "Бекор",      val: a.cancelled_trips, fill: '#e74c3c' },
    { name: "Жами",       val: a.total_trips,     fill: '#1a1a2e' },
  ] : [];

  const dirData = a ? [
    { name: 'B→T', value: a.bekobod_to_tashkent, fill: '#1a1a2e' },
    { name: 'T→B', value: a.tashkent_to_bekobod, fill: '#f5a623' },
  ] : [];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>📊 Бошқарув панели</Typography>

      <Grid container spacing={2.5} mb={3}>
        {[
          { title: "Жами эълонлар",    value: a?.total_trips,     icon: <ListAlt />,       color: 'primary',   subtitle: `Бугун: ${a?.trips_today ?? 0}` },
          { title: 'Якунланган',        value: a?.completed_trips, icon: <CheckCircle />,   color: 'success',   subtitle: formatPrice(a?.total_revenue) },
          { title: 'Фаол (кутилмоқда)',value: a?.active_trips,    icon: <Today />,         color: 'warning' },
          { title: 'Бекор қилинган',   value: a?.cancelled_trips, icon: <Cancel />,        color: 'error' },
          { title: 'Бугунги даромад',  value: formatPrice(a?.revenue_today), icon: <AttachMoney />, color: 'secondary' },
          { title: 'Ҳайдовчилар',     value: `${a?.active_drivers ?? 0}/${a?.total_drivers ?? 0}`, icon: <DirectionsCar />, color: 'info', subtitle: 'Фаол/Жами' },
        ].map((s, i) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
            {isLoading ? <Card><CardContent><Skeleton height={80} /></CardContent></Card> : <StatCard {...s} />}
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Эълонлар статистикаси</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barSize={48}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', border: 'none' }} />
                  <Bar dataKey="val" name="Эълонлар" radius={[8, 8, 0, 0]}>
                    {barData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Йўналишлар</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={dirData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                    {dirData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>{a?.bekobod_to_tashkent ?? '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">🚀 B→T</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={700}>{a?.tashkent_to_bekobod ?? '—'}</Typography>
                  <Typography variant="caption" color="text.secondary">🏠 T→B</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
