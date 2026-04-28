import { createSlice } from '@reduxjs/toolkit';

const load = () => {
  try { return JSON.parse(localStorage.getItem('bekobod_auth') || 'null'); }
  catch { return null; }
};

const saved = load();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: saved?.user || null,
    accessToken: saved?.accessToken || null,
    refreshToken: saved?.refreshToken || null,
    isAuthenticated: !!saved?.accessToken,
  },
  reducers: {
    setCredentials(state, { payload }) {
      state.user = payload.user;
      state.accessToken = payload.accessToken;
      state.refreshToken = payload.refreshToken;
      state.isAuthenticated = true;
      localStorage.setItem('bekobod_auth', JSON.stringify(payload));
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('bekobod_auth');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
export const selectUser = s => s.auth.user;
export const selectIsAuth = s => s.auth.isAuthenticated;
export const selectRole = s => s.auth.user?.role;
