import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Divider,
  Avatar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { ArrowBack, CheckCircle, Cancel } from "@mui/icons-material";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useSnackbar } from "notistack";
import { adminTripsApi as tripsApi } from "../../api/services";
import {
  DIRECTION,
  CATEGORY,
  CAR_TYPE,
  TRIP_STATUS,
  formatPrice,
  formatDate,
} from "../../utils";

export default function TripDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const {
    data: trip,
    isLoading,
    isError,
  } = useQuery(["admin-trip", id], () => tripsApi.get(id).then((r) => r.data));

  const statusMut = useMutation(
    ({ status, cancellation_reason }) =>
      tripsApi
        .updateStatus(id, {
          status,
          ...(cancellation_reason && { cancellation_reason }),
        })
        .then((r) => r.data),
    {
      onSuccess: () => {
        qc.invalidateQueries(["admin-trip", id]);
        qc.invalidateQueries("admin-trips");
        enqueueSnackbar("Статус янгиланди", { variant: "success" });
        setCancelDialog(false);
      },
      onError: (err) =>
        enqueueSnackbar(err.response?.data?.detail || "Хато", {
          variant: "error",
        }),
    },
  );

  if (isLoading)
    return (
      <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
        Юкlanmoqda...
      </Box>
    );
  if (isError || !trip)
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/admin/trips")}
        >
          Орқага
        </Button>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Эълон топилмади
        </Typography>
      </Box>
    );

  const st = TRIP_STATUS[trip.status];
  const dir = DIRECTION[trip.direction];
  const cat = CATEGORY[trip.category];
  const carType = CAR_TYPE?.[trip.car_type_preference];
  const canCancel = !["completed", "cancelled", "expired"].includes(
    trip.status,
  );
  const canComplete = ["accepted", "in_progress"].includes(trip.status);

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            variant="outlined"
            size="small"
            onClick={() => navigate("/admin/trips")}
          >
            Орқага
          </Button>
          <Box>
            <Typography variant="h6" fontWeight={700}>
              Эълон #{trip.id}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDate(trip.created_at)}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip label={`${st?.label}`} color={st?.color} />
          {canComplete && (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<CheckCircle />}
              onClick={() => statusMut.mutate({ status: "completed" })}
            >
              Якунлаш
            </Button>
          )}
          {canCancel && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<Cancel />}
              onClick={() => setCancelDialog(true)}
            >
              Бекор қилиш
            </Button>
          )}
        </Box>
      </Box>

      {trip.cancellation_reason && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <strong>Бекор қилиш сабаби:</strong> {trip.cancellation_reason}
        </Alert>
      )}

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          {/* Route */}
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                {dir?.emoji} {dir?.label}
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#f0f7ff",
                    borderRadius: 2,
                    display: "flex",
                    gap: 1.5,
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "#1a1a2e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#fff",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                      }}
                    >
                      A
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Қабул joyi
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {trip.pickup_point}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "#fff0f0",
                    borderRadius: 2,
                    display: "flex",
                    gap: 1.5,
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      bgcolor: "#e74c3c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#fff",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                      }}
                    >
                      B
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Yetkazish joyi
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {trip.dropoff_point}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>
                Тафсилотлар
              </Typography>
              <Grid container spacing={2}>
                {[
                  { label: "Сана/вақт", value: formatDate(trip.trip_date) },
                  { label: "Жойлар", value: `${trip.seats} та` },
                  { label: "Категория", value: `${cat?.emoji} ${cat?.label}` },
                  {
                    label: "Машина тури",
                    value: carType?.label || trip.car_type_preference,
                  },
                  { label: "Юк", value: trip.luggage ? "✅ Бор" : "❌ Йўқ" },
                  { label: "Яратилди", value: formatDate(trip.created_at) },
                  {
                    label: "Қабул қилинди",
                    value: formatDate(trip.accepted_at),
                  },
                  { label: "Якунланди", value: formatDate(trip.completed_at) },
                ].map((item, i) => (
                  <Grid item xs={12} sm={6} key={i}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        py: 0.75,
                        borderBottom: "1px solid #f4f6f9",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
              {trip.notes && (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    bgcolor: "#fffbf0",
                    borderRadius: 2,
                    border: "1px solid #f5a623",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    💬 {trip.notes}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Price */}
          <Card
            sx={{ mb: 2.5, bgcolor: "#f0fff4", border: "1px solid #c6f6d5" }}
          >
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                💰 Нарх
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Жой нархи
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {formatPrice(trip.price_per_seat)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Жойлар сони
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {trip.seats} ta
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" fontWeight={700}>
                    Жами
                  </Typography>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                    color="success.main"
                  >
                    {formatPrice(trip.total_price)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Passenger */}
          {trip.passenger && (
            <Card sx={{ mb: 2.5 }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                  👤 Йўловчи
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    mb: 1.5,
                  }}
                >
                  <Avatar sx={{ bgcolor: "#1a1a2e", width: 40, height: 40 }}>
                    {trip.passenger.full_name[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {trip.passenger.full_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {trip.passenger.phone}
                    </Typography>
                  </Box>
                </Box>
                {trip.passenger.username && (
                  <Typography variant="caption" color="text.secondary">
                    @{trip.passenger.username}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Driver */}
          <Card>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                🚗 Ҳайдовчи
              </Typography>
              {trip.driver ? (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 1.5,
                    }}
                  >
                    <Avatar sx={{ bgcolor: "#f5a623", width: 40, height: 40 }}>
                      {trip.driver.full_name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {trip.driver.full_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {trip.driver.phone}
                      </Typography>
                    </Box>
                  </Box>
                  {trip.driver.driver_profile && (
                    <Box sx={{ p: 1.25, bgcolor: "#f4f6f9", borderRadius: 2 }}>
                      {[
                        ["Машина", trip.driver.driver_profile.car_model],
                        ["Ранг", trip.driver.driver_profile.car_color || "—"],
                        ["Рақам", trip.driver.driver_profile.car_number],
                        [
                          "Рейтинг",
                          `⭐ ${trip.driver.driver_profile.rating?.toFixed(1)}`,
                        ],
                      ].map(([k, v]) => (
                        <Box
                          key={k}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.5,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            {k}
                          </Typography>
                          <Typography variant="caption" fontWeight={600}>
                            {v}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.disabled">
                  Ҳайдовчи бириктирилмаган
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialog}
        onClose={() => setCancelDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Бекор қилиш sababi</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Сабаб"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="Нима учун бекор қилинмоқда?"
          />
        </DialogContent>
        <DialogActions sx={{ px: 2, pb: 2 }}>
          <Button onClick={() => setCancelDialog(false)} variant="outlined">
            Орқага
          </Button>
          <Button
            onClick={() =>
              statusMut.mutate({
                status: "cancelled",
                cancellation_reason: cancelReason,
              })
            }
            variant="contained"
            color="error"
            disabled={statusMut.isLoading}
          >
            Бекор қилиш
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
