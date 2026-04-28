# Bekobod Express — Frontend (Unified)

User (passenger/driver) Telegram MiniApp + Admin panel — **bitta SPA**.

## Arxitektura

```
src/
├── App.js                          # Unified router, role-based redirect
├── theme/
│   ├── userTheme.js                # Telegram WebApp theme
│   └── adminTheme.js               # Admin panel theme
├── features/auth/
│   ├── authSlice.js                # Redux auth state (localStorage'da persist)
│   └── guards.jsx                  # RequireAuth, RequireAdmin, RoleRedirect
├── api/
│   ├── client.js                   # Yagona axios + refresh queue
│   └── services.js                 # authApi, tripsApi, usersApi + adminTripsApi, adminUsersApi
├── pages/
│   ├── auth/AuthPage.jsx           # Telegram login + role tanlash + phone register
│   ├── admin/                      # Admin sahifalari (lazy-loaded)
│   ├── trips/, profile/            # User sahifalari
└── components/
    ├── layout/AppLayout.jsx        # User layout (mobile bottom nav)
    └── admin/AdminLayout.jsx       # Admin layout (sidebar)
```

## Login flow

| Holat | Yo'l |
|-------|------|
| Telegram WebApp + admin telegram_id | `/auth` → `/auth/telegram` API → role='admin' → `navigate('/admin')` |
| Telegram WebApp + driver/passenger | `/auth` → `/auth/telegram` API → o'z home page'iga |
| Browser + admin | `/admin/login` → phone+password → `/auth/login` API → `navigate('/admin')` |
| Browser + boshqa rol | `/auth` → demo login (development) |

## Routing

| Path | Guard | Theme |
|------|-------|-------|
| `/` | — | userTheme | Role'ga qarab redirect |
| `/auth` | — | userTheme | Telegram login |
| `/admin/login` | — | adminTheme | Phone+password |
| `/admin/*` | RequireAdmin | adminTheme | Admin pages (lazy) |
| `/new-trip`, `/my-trips`, `/active-trips`, `/trips/:id`, `/profile` | RequireAuth | userTheme | User pages |

## Performance

- Admin code `React.lazy` bilan ajratilgan — yo'lovchi/haydovchi bundle'iga yuklanmaydi.
- `react-query` staleTime 20s.
- nginx gzip + `static/` long-cache (1 yil), `index.html` no-cache.

## Security

- Frontend role check faqat UX. **Backend JWT'da `role='admin'` claim'ni har admin endpoint'da tekshirishi shart.**
- Token URL'da expose qilinmaydi (eski `?token=...&refresh=...` redirect olib tashlandi).
- AdminLoginPage default credentials yo'q.

## Build & Deploy

```bash
# Development
npm install
npm start                    # http://localhost:3000

# Production
docker build -t bekobod-express:latest .
docker run -p 80:80 bekobod-express:latest
```

Healthcheck: `GET /healthz` → `200 ok`

## Env

`package.json` ichidagi `"proxy": "http://localhost:8007"` development'da CRA dev server'da ishlaydi. Production'da nginx oldida API gateway/reverse proxy `/api/*` ni backend'ga yo'naltirishi kerak.

## Backend talablari

- `POST /api/auth/login` → `{user, access_token, refresh_token}`. `user.role ∈ {admin, driver, passenger}`
- `POST /api/auth/telegram` → admin telegram_id'lar DB'da `role='admin'` belgilangan bo'lishi kerak. NEED_REGISTRATION / DRIVER_NOT_VERIFIED detail kodlari.
- `POST /api/auth/refresh` → access_token expire bo'lganda 401 → avtomatik chaqiriladi.
- Admin endpoint'lar (`/users/`, `/trips/admin/*`, `/trips/pricing` POST/PUT) JWT'da role='admin' bo'lmasa **403** qaytarish shart.
