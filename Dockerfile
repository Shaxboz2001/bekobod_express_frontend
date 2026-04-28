# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Cache layer: avval faqat manifest fayllar
COPY package.json ./
COPY package-lock.json* ./
RUN npm ci --no-audit --no-fund 2>/dev/null || npm install --no-audit --no-fund

# Source
COPY . .

# Build (homepage="." uchun relative path'lar; CRA'da xush kelibsiz)
RUN npm run build

# ─── Stage 2: Runtime (nginx) ────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# SPA uchun nginx config — barcha route'lar index.html'ga yo'naltiriladi
RUN rm /etc/nginx/conf.d/default.conf
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    listen [::]:80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss text/javascript;

    # Static assets — long cache (CRA hashlangan fayllar)
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
        # index.html — never cache (yangi deploy darhol yetib borsin)
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # Healthcheck
    location = /healthz {
        access_log off;
        return 200 "ok\n";
        add_header Content-Type text/plain;
    }

    # Hidden files'ni bloklash
    location ~ /\. {
        deny all;
    }
}
EOF

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
