# Household Dashboard

A wall-mounted iPad grocery dashboard for Coles and IGA. Shows your most commonly purchased items sorted by repurchase priority. Tap an item to add it to your shared Apple Reminders or Google Tasks list.

## Features

- Product tiles sorted by repurchase urgency (overdue items first)
- Coles and IGA tabs with separate product lists
- Light / dark mode
- Admin panel: search Coles products, curate your dashboard
- Apple Reminders integration (via iOS Shortcuts) or Google Tasks
- Password-protected, runs in Docker on Proxmox

## Quick Start

```bash
# 1. Clone and install
git clone <repo>
cd coles-personal-dashboard-picker
npm install

# 2. Configure environment
cp .env.example .env
npx tsx scripts/generate-password-hash.ts yourpassword
# Paste the output as APP_PASSWORD_HASH in .env
# Fill in remaining .env values

# 3. Set up database
mkdir -p data
npx prisma migrate deploy

# 4. Start
npm run dev          # development
# or
docker-compose up -d # production (after build)
```

## Scripts

| Script                     | Description                     |
| -------------------------- | ------------------------------- |
| `npm run dev`              | Start development server        |
| `npm run build`            | Build for production            |
| `npm run lint`             | Run ESLint                      |
| `npm run type-check`       | Run TypeScript compiler         |
| `npm run test`             | Run unit tests                  |
| `npm run test:integration` | Run integration tests           |
| `npm run test:e2e`         | Run Playwright E2E tests        |
| `npm run test:coverage`    | Unit tests with coverage report |
| `npm run db:migrate`       | Run pending migrations (dev)    |
| `npm run db:studio`        | Open Prisma Studio              |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [API Reference](docs/API.md)
- [Apple Shortcuts Setup](docs/SHORTCUTS_SETUP.md)
- [Contributing](CONTRIBUTING.md)

## Tech Stack

Next.js 14 · React 18 · TypeScript · SQLite (Prisma) · Tailwind CSS · Docker
