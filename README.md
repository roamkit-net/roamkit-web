# roamkit-web — Next.js 15 App Router

Public site and customer UI for RoamKit. See [roamkit-docs](https://github.com/roamkit-net/roamkit-docs) for architecture and standards.

## Layout

```
app/           # Routes and layouts (App Router)
components/    # Reusable UI components (Faza 1+)
lib/           # API client and shared utilities
```

## Local development

Requires the API from `roamkit-api` and infra from `roamkit-infra`:

```bash
cd ../roamkit-infra/docker
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
```

Then in this repo:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page reads `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`).

Authenticated deposit UI lives at [`/me/deposit`](http://localhost:3000/me/deposit): balance, EIP-681 QR, CEX TXID verify, and Reown AppKit WalletConnect when `WALLETCONNECT_ENABLED` is on in the API and `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set for the web build.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript `--noEmit` |
| `npm test` | Unit tests (plan filters + EIP-681 helpers) |
| `npm run build` | Production build |

## CI / deploy

Workflows in `.github/workflows/` lint, typecheck, and build on every PR. On merge to `develop`, the pipeline builds and pushes `ghcr.io/roamkit-net/roamkit-web` and deploys to staging via SSH.

Staging uses `NEXT_PUBLIC_API_URL=https://api.staging.roamkit.net` (baked at Docker build time).
