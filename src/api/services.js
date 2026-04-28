import apiClient from './client';

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (data)          => apiClient.post('/auth/login', data),
  telegram: (data)          => apiClient.post('/auth/telegram', data),
  refresh:  (refresh_token) => apiClient.post('/auth/refresh', { refresh_token }),
};

// ─── Trips (user-side) ───────────────────────────────────────────────────────
export const tripsApi = {
  create:       (data)   => apiClient.post('/trips/', data),
  list:         (params) => apiClient.get('/trips/', { params }),
  active:       (params) => apiClient.get('/trips/active', { params }),
  get:          (id)     => apiClient.get(`/trips/${id}`),
  accept:       (id)     => apiClient.post(`/trips/${id}/accept`),
  updateStatus: (id, d)  => apiClient.patch(`/trips/${id}/status`, d),
  pricing:      ()       => apiClient.get('/trips/pricing'),
};

// ─── Users (user-side) ───────────────────────────────────────────────────────
export const usersApi = {
  me:                  ()       => apiClient.get('/users/me'),
  updateDriverProfile: (uid, d) => apiClient.put(`/users/${uid}/driver-profile`, d),
};

// ─── Admin: trips ────────────────────────────────────────────────────────────
export const adminTripsApi = {
  list:          (p)      => apiClient.get('/trips/', { params: p }),
  get:           (id)     => apiClient.get(`/trips/${id}`),
  updateStatus:  (id, d)  => apiClient.patch(`/trips/${id}/status`, d),
  pricing:       ()       => apiClient.get('/trips/pricing'),
  createPricing: (d)      => apiClient.post('/trips/pricing', d),
  updatePricing: (id, d)  => apiClient.put(`/trips/pricing/${id}`, d),
  analytics:     ()       => apiClient.get('/trips/admin/analytics'),
};

// ─── Admin: users ────────────────────────────────────────────────────────────
export const adminUsersApi = {
  list:                (p)        => apiClient.get('/users/', { params: p }),
  create:              (d)        => apiClient.post('/users/', d),
  update:              (id, d)    => apiClient.put(`/users/${id}`, d),
  createDriverProfile: (uid, d)   => apiClient.post(`/users/${uid}/driver-profile`, d),
  updateDriverProfile: (uid, d)   => apiClient.put(`/users/${uid}/driver-profile`, d),

  // Verify/reject — backend'da maxsus action endpoint'lar
  // (idempotent + Telegram notification ichkarida)
  verify:              (id)       => apiClient.post(`/users/${id}/verify`),
  reject:              (id)       => apiClient.post(`/users/${id}/reject`),
  unblock:             (id)       => apiClient.post(`/users/${id}/unblock`),
};
