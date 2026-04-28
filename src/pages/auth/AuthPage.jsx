import {
  Box, Card, CardContent, Typography, Button, CircularProgress, Alert,
  Avatar, TextField, InputAdornment, Stepper, Step, StepLabel, Grid,
  Select, MenuItem, FormControl, InputLabel, Stack,
} from "@mui/material";
import {
  LocalTaxi, DirectionsCar, Person, Phone, ArrowForward,
  CheckCircle, ArrowBack,
} from "@mui/icons-material";
import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { useMutation } from "react-query";
import { useNavigate } from "react-router-dom";

import { authApi } from "../../api/services";
import { setCredentials } from "../../features/auth/authSlice";
import { useTelegram } from "../../hooks/useTelegram";
import { useT } from "../../i18n";

// ─── Screens ─────────────────────────────────────────────────────────────────
const S = {
  LOADING:         "loading",
  ROLE_SELECT:     "role_select",
  PASSENGER_PHONE: "passenger_phone",
  DRIVER_PHONE:    "driver_phone",
  DRIVER_CAR:      "driver_car",
  PENDING:         "pending",
  ERROR:           "error",
};

// ─── Telefon utilities ───────────────────────────────────────────────────────
const cleanPhone = (raw) => (raw || "").replace(/\D/g, "");

const normalizePhone = (raw) => {
  const cleaned = cleanPhone(raw);
  if (!cleaned) return "";
  if (cleaned.startsWith("998")) return cleaned;
  if (cleaned.length === 9) return "998" + cleaned;
  return cleaned;
};

const isValidPhone = (raw) => {
  const n = normalizePhone(raw);
  return n.length === 12 && n.startsWith("998");
};

// ═════════════════════════════════════════════════════════════════════════════
// Asosiy komponent
// ═════════════════════════════════════════════════════════════════════════════
export default function AuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tgUser, isInsideTelegram, haptic, ready } = useTelegram();
  const tt = useT();

  const [screen, setScreen] = useState(S.LOADING);
  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [carData, setCarData] = useState({
    car_model: "",
    car_number: "",
    car_color: "",
    car_year: "",
    car_type: "sedan",
    license_number: "",
    seats_available: 4,
  });
  const [carErrs, setCarErrs] = useState({});

  // ─── Tokenni saqlash va yo'naltirish ───────────────────────────────────────
  const saveAndRedirect = useCallback((data) => {
    dispatch(setCredentials({
      user: data.user,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }));
    const role = data.user.role;
    if (role === "admin") navigate("/admin", { replace: true });
    else if (role === "driver") navigate("/active-trips", { replace: true });
    else navigate("/new-trip", { replace: true });
  }, [dispatch, navigate]);

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const loginMut = useMutation(
    (payload) => authApi.telegram(payload).then((r) => r.data),
    { onSuccess: saveAndRedirect, onError: (err) => handleAuthError(err) },
  );

  const passengerRegMut = useMutation(
    (payload) => authApi.telegram(payload).then((r) => r.data),
    {
      onSuccess: (data) => { haptic?.("medium"); saveAndRedirect(data); },
      onError: (err) => {
        const detail = err.response?.data?.detail;
        setPhoneErr(typeof detail === "string" ? detail : tt('common.error'));
      },
    },
  );

  const driverRegMut = useMutation(
    (payload) => authApi.telegram(payload).then((r) => r.data),
    {
      onSuccess: (data) => { haptic?.("medium"); saveAndRedirect(data); },
      onError: (err) => {
        const detail = err.response?.data?.detail;
        if (detail === "DRIVER_NOT_VERIFIED") {
          haptic?.("light");
          setScreen(S.PENDING);
          return;
        }
        if (Array.isArray(detail)) {
          setErrorMsg(detail.map((e) => e.msg).join(", "));
        } else {
          setErrorMsg(typeof detail === "string" ? detail : tt('common.error'));
        }
        setScreen(S.ERROR);
      },
    },
  );

  const handleAuthError = (err) => {
    const detail = err.response?.data?.detail;
    if (detail === "NEED_REGISTRATION") { setScreen(S.ROLE_SELECT); return; }
    if (detail === "DRIVER_NOT_VERIFIED") { setScreen(S.PENDING); return; }
    setErrorMsg(typeof detail === "string" ? detail : tt('common.error'));
    setScreen(S.ERROR);
  };

  // ─── Avtomatik kirish ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;

    if (!isInsideTelegram) {
      setScreen(S.ERROR);
      setErrorMsg(tt('auth.error.notInsideTelegram'));
      return;
    }

    if (!tgUser) {
      const timer = setTimeout(() => {
        const u = window.Telegram?.WebApp?.initDataUnsafe?.user;
        if (u) tryAutoLogin(u);
        else { setErrorMsg(tt('auth.error.tgUserMissing')); setScreen(S.ERROR); }
      }, 1000);
      return () => clearTimeout(timer);
    }

    tryAutoLogin(tgUser);
    // eslint-disable-next-line
  }, [ready, isInsideTelegram, tgUser]);

  const tryAutoLogin = (user) => {
    loginMut.mutate({
      telegram_id: user.id,
      full_name: [user.first_name, user.last_name].filter(Boolean).join(" "),
      username: user.username || null,
    });
  };

  // ─── PENDING ekranida polling ──────────────────────────────────────────────
  useEffect(() => {
    if (screen !== S.PENDING || !isInsideTelegram || !tgUser) return;
    const interval = setInterval(() => tryAutoLogin(tgUser), 20_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [screen, isInsideTelegram, tgUser]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const onRoleSelect = (role) => {
    haptic?.("light");
    setPhone(""); setPhoneErr(""); setErrorMsg("");
    setScreen(role === "driver" ? S.DRIVER_PHONE : S.PASSENGER_PHONE);
  };

  const onSubmitPassengerPhone = () => {
    setPhoneErr("");
    if (!isValidPhone(phone)) { setPhoneErr(tt('auth.phone.invalid')); return; }
    haptic?.("light");
    passengerRegMut.mutate({
      telegram_id: tgUser.id,
      full_name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" "),
      username: tgUser.username || null,
      phone: normalizePhone(phone),
      role: "passenger",
    });
  };

  const onSubmitDriverPhone = () => {
    setPhoneErr("");
    if (!isValidPhone(phone)) { setPhoneErr(tt('auth.phone.invalid')); return; }
    haptic?.("light");
    setScreen(S.DRIVER_CAR);
  };

  const validateCar = () => {
    const errs = {};
    if (!carData.car_model || carData.car_model.trim().length < 2) {
      errs.car_model = tt('common.required');
    }
    if (!carData.car_number || carData.car_number.trim().length < 4) {
      errs.car_number = tt('common.required');
    }
    if (!carData.license_number || carData.license_number.trim().length < 4) {
      errs.license_number = tt('common.required');
    }
    if (carData.car_year) {
      const y = parseInt(carData.car_year, 10);
      const now = new Date().getFullYear();
      if (isNaN(y) || y < 1980 || y > now + 1) {
        errs.car_year = `1980 - ${now}`;
      }
    }
    if (!carData.seats_available || carData.seats_available < 1 || carData.seats_available > 20) {
      errs.seats_available = "1 - 20";
    }
    return errs;
  };

  const onSubmitDriverCar = () => {
    const errs = validateCar();
    if (Object.keys(errs).length) { setCarErrs(errs); return; }
    setCarErrs({});
    haptic?.("light");
    driverRegMut.mutate({
      telegram_id: tgUser.id,
      full_name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" "),
      username: tgUser.username || null,
      phone: normalizePhone(phone),
      role: "driver",
      driver_profile: {
        car_model:       carData.car_model.trim(),
        car_number:      carData.car_number.trim().toUpperCase(),
        car_color:       carData.car_color.trim() || null,
        car_year:        carData.car_year ? parseInt(carData.car_year, 10) : null,
        car_type:        carData.car_type,
        license_number:  carData.license_number.trim(),
        seats_available: parseInt(carData.seats_available, 10) || 4,
      },
    });
  };

  const retryLogin = () => {
    setErrorMsg("");
    setScreen(S.LOADING);
    if (tgUser) tryAutoLogin(tgUser);
    else setScreen(S.ROLE_SELECT);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  if (screen === S.LOADING) {
    return (
      <CenterBox>
        <LogoBox />
        <Typography variant="h6" fontWeight={700} mt={2}>{tt('app.title')}</Typography>
        <CircularProgress sx={{ mt: 3, color: "#1a1a2e" }} size={32} />
        <Typography variant="body2" color="text.secondary" mt={1.5}>
          {tt('auth.loading')}
        </Typography>
      </CenterBox>
    );
  }

  if (screen === S.ROLE_SELECT) {
    return (
      <CenterBox>
        <LogoBox />
        <Typography variant="h5" fontWeight={700} mt={2}>{tt('app.title')}</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          {tt('app.subtitle')}
        </Typography>

        {tgUser && (
          <Card sx={{ width: "100%", maxWidth: 360, mb: 2 }}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5 }}>
              <Avatar sx={{ bgcolor: "#1a1a2e", width: 40, height: 40 }}>
                {tgUser.first_name?.[0]}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  {[tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ")}
                </Typography>
                {tgUser.username && (
                  <Typography variant="caption" color="text.secondary">
                    @{tgUser.username}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        <Card sx={{ width: "100%", maxWidth: 360 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={2} textAlign="center">
              {tt('auth.role.title')}
            </Typography>
            <RoleCard
              icon={<Person sx={{ fontSize: 26, color: "#1a1a2e" }} />}
              bg="#e8f4fd"
              title={tt('auth.role.passenger')}
              desc={tt('auth.role.passenger.desc')}
              border="#1a1a2e"
              hoverBg="#f5f9ff"
              onClick={() => onRoleSelect("passenger")}
              mb={1.5}
            />
            <RoleCard
              icon={<DirectionsCar sx={{ fontSize: 26, color: "#f5a623" }} />}
              bg="#fff8e1"
              title={tt('auth.role.driver')}
              desc={tt('auth.role.driver.desc')}
              border="#f5a623"
              hoverBg="#fffdf5"
              onClick={() => onRoleSelect("driver")}
            />
          </CardContent>
        </Card>
      </CenterBox>
    );
  }

  if (screen === S.PASSENGER_PHONE) {
    return (
      <CenterBox>
        <LogoBox small />
        <Typography variant="h6" fontWeight={700} mt={2}>{tt('auth.passenger.title')}</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {tt('auth.passenger.subtitle')}
        </Typography>
        <Card sx={{ width: "100%", maxWidth: 360 }}>
          <CardContent sx={{ p: 2.5 }}>
            {tgUser && <UserCard tgUser={tgUser} bg="#f0f9ff" border="#cce7f9" tt={tt} accentColor="#1a1a2e" />}
            <PhoneField
              phone={phone}
              setPhone={(v) => { setPhone(v); setPhoneErr(""); }}
              phoneErr={phoneErr}
              onEnter={onSubmitPassengerPhone}
              tt={tt}
            />
            <Button
              fullWidth variant="contained" size="large"
              onClick={onSubmitPassengerPhone}
              disabled={passengerRegMut.isLoading || !phone}
              endIcon={passengerRegMut.isLoading
                ? <CircularProgress size={18} color="inherit" />
                : <ArrowForward />}
              sx={{ bgcolor: "#1a1a2e", borderRadius: 3, py: 1.5, mb: 1 }}
            >
              {passengerRegMut.isLoading ? tt('auth.loading') : tt('common.continue')}
            </Button>
            <Button
              fullWidth variant="text" size="small" startIcon={<ArrowBack />}
              onClick={() => setScreen(S.ROLE_SELECT)}
              sx={{ color: "text.secondary" }}
            >
              {tt('common.back')}
            </Button>
          </CardContent>
        </Card>
      </CenterBox>
    );
  }

  if (screen === S.DRIVER_PHONE) {
    return (
      <CenterBox>
        <LogoBox small />
        <Typography variant="h6" fontWeight={700} mt={2}>{tt('auth.driver.title')}</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {tt('auth.driver.step1')}
        </Typography>
        <Card sx={{ width: "100%", maxWidth: 360 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stepper activeStep={0} sx={{ mb: 2.5 }}>
              <Step><StepLabel>{tt('auth.driver.step.phone')}</StepLabel></Step>
              <Step><StepLabel>{tt('auth.driver.step.car')}</StepLabel></Step>
              <Step><StepLabel>{tt('auth.driver.step.confirm')}</StepLabel></Step>
            </Stepper>
            {tgUser && <UserCard tgUser={tgUser} bg="#fff8e1" border="#ffe082" tt={tt} accentColor="#f5a623" />}
            <PhoneField
              phone={phone}
              setPhone={(v) => { setPhone(v); setPhoneErr(""); }}
              phoneErr={phoneErr}
              onEnter={onSubmitDriverPhone}
              tt={tt}
            />
            <Button
              fullWidth variant="contained" size="large"
              onClick={onSubmitDriverPhone}
              disabled={!phone}
              endIcon={<ArrowForward />}
              sx={{ bgcolor: "#1a1a2e", borderRadius: 3, py: 1.5, mb: 1 }}
            >
              {tt('common.next')}
            </Button>
            <Button
              fullWidth variant="text" size="small" startIcon={<ArrowBack />}
              onClick={() => setScreen(S.ROLE_SELECT)}
              sx={{ color: "text.secondary" }}
            >
              {tt('common.back')}
            </Button>
          </CardContent>
        </Card>
      </CenterBox>
    );
  }

  if (screen === S.DRIVER_CAR) {
    const carTypes = [
      { value: 'sedan',     label: tt('auth.driver.car.type.sedan') },
      { value: 'minivan',   label: tt('auth.driver.car.type.minivan') },
      { value: 'cargo_van', label: tt('auth.driver.car.type.cargo') },
    ];
    return (
      <CenterBox>
        <LogoBox small />
        <Typography variant="h6" fontWeight={700} mt={2}>{tt('auth.driver.car.title')}</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          {tt('auth.driver.step2')}
        </Typography>
        <Card sx={{ width: "100%", maxWidth: 420 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Stepper activeStep={1} sx={{ mb: 2.5 }}>
              <Step completed><StepLabel>{tt('auth.driver.step.phone')}</StepLabel></Step>
              <Step active><StepLabel>{tt('auth.driver.step.car')}</StepLabel></Step>
              <Step><StepLabel>{tt('auth.driver.step.confirm')}</StepLabel></Step>
            </Stepper>
            <Grid container spacing={1.5}>
              <Grid item xs={12}>
                <TextField
                  label={`${tt('auth.driver.car.model')} *`}
                  placeholder={tt('auth.driver.car.model.ph')}
                  value={carData.car_model}
                  onChange={(e) => setCarData({ ...carData, car_model: e.target.value })}
                  error={!!carErrs.car_model}
                  helperText={carErrs.car_model || " "}
                  fullWidth
                />
              </Grid>
              <Grid item xs={7}>
                <TextField
                  label={`${tt('auth.driver.car.number')} *`}
                  placeholder="01A123BC"
                  value={carData.car_number}
                  onChange={(e) => setCarData({ ...carData, car_number: e.target.value.toUpperCase() })}
                  error={!!carErrs.car_number}
                  helperText={carErrs.car_number || " "}
                  fullWidth
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  label={tt('auth.driver.car.year')}
                  type="number"
                  placeholder="2020"
                  value={carData.car_year}
                  onChange={(e) => setCarData({ ...carData, car_year: e.target.value })}
                  error={!!carErrs.car_year}
                  helperText={carErrs.car_year || " "}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label={tt('auth.driver.car.color')}
                  placeholder={tt('auth.driver.car.color.ph')}
                  value={carData.car_color}
                  onChange={(e) => setCarData({ ...carData, car_color: e.target.value })}
                  fullWidth
                  helperText=" "
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>{tt('auth.driver.car.type')}</InputLabel>
                  <Select
                    value={carData.car_type}
                    label={tt('auth.driver.car.type')}
                    onChange={(e) => setCarData({ ...carData, car_type: e.target.value })}
                  >
                    {carTypes.map((t) => (
                      <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={7}>
                <TextField
                  label={`${tt('auth.driver.car.license')} *`}
                  placeholder="AA1234567"
                  value={carData.license_number}
                  onChange={(e) => setCarData({ ...carData, license_number: e.target.value.toUpperCase() })}
                  error={!!carErrs.license_number}
                  helperText={carErrs.license_number || " "}
                  fullWidth
                />
              </Grid>
              <Grid item xs={5}>
                <TextField
                  label={`${tt('auth.driver.car.seats')} *`}
                  type="number"
                  value={carData.seats_available}
                  onChange={(e) => setCarData({ ...carData, seats_available: e.target.value })}
                  error={!!carErrs.seats_available}
                  helperText={carErrs.seats_available || " "}
                  fullWidth
                  inputProps={{ min: 1, max: 20 }}
                />
              </Grid>
            </Grid>
            <Box sx={{ p: 1.5, bgcolor: "#fff8e1", borderRadius: 2, mb: 2, mt: 1, border: "1px solid #ffe082" }}>
              <Typography variant="caption" color="text.secondary">
                ⚠️ {tt('auth.driver.car.notice')}
              </Typography>
            </Box>
            <Stack spacing={1}>
              <Button
                fullWidth variant="contained" size="large"
                onClick={onSubmitDriverCar}
                disabled={driverRegMut.isLoading}
                endIcon={driverRegMut.isLoading
                  ? <CircularProgress size={18} color="inherit" />
                  : <CheckCircle />}
                sx={{ bgcolor: "#1a1a2e", borderRadius: 3, py: 1.5 }}
              >
                {driverRegMut.isLoading ? tt('auth.loading') : tt('common.submit')}
              </Button>
              <Button
                fullWidth variant="text" size="small" startIcon={<ArrowBack />}
                onClick={() => setScreen(S.DRIVER_PHONE)}
                sx={{ color: "text.secondary" }}
              >
                {tt('common.back')}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </CenterBox>
    );
  }

  if (screen === S.PENDING) {
    return (
      <CenterBox>
        <Box sx={{
          width: 80, height: 80, bgcolor: "#fff8e1", borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center", mb: 2,
        }}>
          <DirectionsCar sx={{ fontSize: 44, color: "#f5a623" }} />
        </Box>
        <Typography variant="h6" fontWeight={700} mb={1} textAlign="center">
          {tt('auth.pending.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3} textAlign="center" sx={{ maxWidth: 280 }}>
          {tt('auth.pending.body')}
        </Typography>
        <Card sx={{ width: "100%", maxWidth: 300, bgcolor: "#f4f6f9" }}>
          <CardContent sx={{ py: 2 }}>
            {[
              tt('auth.pending.step1'),
              tt('auth.pending.step2'),
              tt('auth.pending.step3'),
            ].map((t, i) => (
              <Typography key={i} variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                {t}
              </Typography>
            ))}
          </CardContent>
        </Card>
        <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
          <CircularProgress size={12} sx={{ color: "text.secondary" }} />
          <Typography variant="caption">{tt('auth.pending.checking')}</Typography>
        </Box>
        <Button
          variant="outlined"
          sx={{ mt: 2, borderRadius: 3, borderColor: "#1a1a2e", color: "#1a1a2e" }}
          onClick={retryLogin}
        >
          {tt('auth.pending.checkNow')}
        </Button>
      </CenterBox>
    );
  }

  // ERROR
  return (
    <CenterBox>
      <Typography sx={{ fontSize: 56, mb: 2 }}>😕</Typography>
      <Typography variant="h6" fontWeight={700} mb={1}>{tt('auth.error.title')}</Typography>
      <Alert severity="error" sx={{ mb: 3, maxWidth: 360 }}>{errorMsg}</Alert>
      <Button
        variant="contained"
        sx={{ bgcolor: "#1a1a2e", borderRadius: 3 }}
        onClick={retryLogin}
      >
        {tt('common.retry')}
      </Button>
    </CenterBox>
  );
}

// ─── Yordamchi komponentlar ──────────────────────────────────────────────────

function CenterBox({ children }) {
  return (
    <Box sx={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", p: 2.5, bgcolor: "#f4f6f9",
    }}>
      {children}
    </Box>
  );
}

function LogoBox({ small }) {
  const size = small ? 56 : 72;
  return (
    <Box sx={{
      width: size, height: size, bgcolor: "#1a1a2e", borderRadius: 3,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <LocalTaxi sx={{ color: "#f5a623", fontSize: small ? 32 : 40 }} />
    </Box>
  );
}

function RoleCard({ icon, bg, title, desc, border, hoverBg, onClick, mb }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2, borderRadius: 3, border: "2px solid #e8e8e8", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 2, mb,
        transition: "all 0.15s",
        "&:hover": {
          borderColor: border, bgcolor: hoverBg,
          transform: "translateY(-2px)", boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
        },
        "&:active": { transform: "scale(0.98)" },
      }}
    >
      <Box sx={{
        width: 48, height: 48, bgcolor: bg, borderRadius: 2,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={700}>{title}</Typography>
        <Typography variant="caption" color="text.secondary">{desc}</Typography>
      </Box>
      <ArrowForward sx={{ ml: "auto", color: "text.disabled", fontSize: 18 }} />
    </Box>
  );
}

function UserCard({ tgUser, bg, border, accentColor, tt }) {
  return (
    <Box sx={{
      display: "flex", alignItems: "center", gap: 1.5, mb: 2,
      p: 1.5, bgcolor: bg, borderRadius: 2,
      border: `1px solid ${border}`,
    }}>
      <Avatar sx={{ bgcolor: accentColor, width: 36, height: 36 }}>
        {tgUser.first_name?.[0]}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} noWrap>
          {[tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ")}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {tt('auth.error.fromTelegram')}
        </Typography>
      </Box>
    </Box>
  );
}

function PhoneField({ phone, setPhone, phoneErr, onEnter, tt }) {
  return (
    <TextField
      label={tt('auth.phone.label')}
      value={phone}
      onChange={(e) => setPhone(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onEnter()}
      fullWidth
      placeholder={tt('auth.phone.placeholder')}
      error={!!phoneErr}
      helperText={phoneErr || " "}
      autoFocus
      type="tel"
      inputMode="numeric"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Phone fontSize="small" color="action" />
            <Typography variant="body2" sx={{ ml: 0.5, mr: 0.5, color: "text.secondary" }}>
              +998
            </Typography>
          </InputAdornment>
        ),
      }}
      sx={{ mb: 1.5 }}
    />
  );
}
