# Deployment Guide (Proxmox)

## Prerequisites

- Proxmox VE 8.x
- LXC container or VM with Debian 12 / Ubuntu 22.04
- Docker + Docker Compose installed in the container
- Port 3000 accessible on your network (or via nginx reverse proxy)

## Container Setup

```bash
# In your Proxmox LXC (as root or sudo user)
apt update && apt install -y docker.io docker-compose-plugin git curl
systemctl enable docker && systemctl start docker
```

## Application Setup

```bash
git clone <repo-url> /opt/coles-dashboard
cd /opt/coles-dashboard

# Copy and fill in environment
cp .env.example .env
nano .env
```

### Required `.env` values

```bash
# Generate password hash (run on your Mac, paste result here)
npx tsx scripts/generate-password-hash.ts yourpassword

# Generate a random session secret
openssl rand -base64 32
```

## First Run

```bash
cd /opt/coles-dashboard
docker compose up -d
```

The container will:

1. Run `prisma migrate deploy` (creates/migrates the SQLite DB)
2. Start the Next.js server on port 3000

Check health:

```bash
curl http://localhost:3000/api/health
# → {"status":"ok","timestamp":"..."}
```

## nginx Reverse Proxy (optional but recommended for HTTPS)

```nginx
server {
    listen 80;
    server_name dashboard.local;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name dashboard.local;

    ssl_certificate /etc/ssl/certs/dashboard.crt;
    ssl_certificate_key /etc/ssl/private/dashboard.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Updating

```bash
cd /opt/coles-dashboard
git pull
docker compose up -d --build
```

## Backup

The SQLite database is stored in the `dashboard_data` Docker volume. Backup with:

```bash
docker run --rm \
  -v coles-personal-dashboard-picker_dashboard_data:/data \
  -v /backup:/backup \
  alpine tar czf /backup/dashboard-$(date +%Y%m%d).tar.gz /data
```

## Google Tasks Setup (if LIST_PROVIDER=google_tasks)

See [Google OAuth Setup](#google-oauth-setup) below.

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the Google Tasks API
3. Create OAuth2 credentials (Desktop app type)
4. On your Mac, run: `npx tsx scripts/google-oauth-setup.ts`
5. Follow the printed URL, authorize, paste the code
6. Copy the printed refresh token to `.env` as `GOOGLE_REFRESH_TOKEN`
7. Get your task list ID: `npx tsx scripts/google-oauth-setup.ts --list-tasks`
