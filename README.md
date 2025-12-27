# satset.io

A fast, no-nonsense URL shortener. No login, no tracking, just get the job done.

**Live**: [satset.io](https://satset.io)

## Features

- **Instant** - Short links generated locally (zero network wait)
- **Offline-First** - Works without internet, syncs when back online
- **Anonymous** - No login, no tracking, no cookies
- **Custom Aliases** - Make your links readable
- **QR Codes** - One-click download
- **Auto-Expiry** - URLs auto-delete after 14 days

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Runtime** | [Bun](https://bun.sh) (dev) + [Cloudflare Workers](https://workers.cloudflare.com) (prod) |
| **Backend** | [Elysia](https://elysiajs.com) |
| **Frontend** | [React 19](https://react.dev) |
| **Routing** | [TanStack Router](https://tanstack.com/router) (file-based) |
| **Data Fetching** | [TanStack Query](https://tanstack.com/query) |
| **Forms** | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) |
| **Animations** | [Framer Motion](https://motion.dev) |
| **Database** | [Cloudflare D1](https://developers.cloudflare.com/d1) (SQLite) |
| **Cache** | [Cloudflare KV](https://developers.cloudflare.com/kv) |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              satset.io                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         Cloudflare Edge                                │ │
│  │                                                                        │ │
│  │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │ │
│  │   │   Workers   │◄──►│     D1      │    │     KV      │                │ │
│  │   │  (Elysia)   │    │  (SQLite)   │    │   (Cache)   │                │ │
│  │   └──────┬──────┘    └─────────────┘    └──────┬──────┘                │ │
│  │          │                                     │                       │ │
│  │          └──────────────────┬──────────────────┘                       │ │
│  └─────────────────────────────┼──────────────────────────────────────────┘ │
│                                │                                            │
│                                ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                           API Layer                                     ││
│  │                                                                         ││
│  │    POST /api/urls           Create short URL                            ││
│  │    GET  /api/urls/check     Check alias availability                    ││
│  │    GET  /api/redirect       Get redirect data                           ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                │                                            │
│                                ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        React Frontend                                   ││
│  │                                                                         ││
│  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  ││
│  │   │    Router    │  │    Query     │  │  Hook Form   │                  ││
│  │   │  (TanStack)  │  │  (TanStack)  │  │    + Zod     │                  ││
│  │   └──────────────┘  └──────────────┘  └──────────────┘                  ││
│  │                                                                         ││
│  │   routes/                                                               ││
│  │   ├── __root.tsx      Root layout                                       ││
│  │   ├── index.tsx       Home page (/)                                     ││
│  │   ├── privacy.tsx     Privacy page (/privacy)                           ││
│  │   └── $alias.tsx      Redirect page (/:alias)                           ││
│  │                                                                         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Offline-First Flow

The app generates short URLs **locally** for instant UX, then syncs to the backend when the user commits (copy/QR download).

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           Offline-First Architecture                         │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   1. USER PASTES URL                                                         │
│      ┌─────────────┐                                                         │
│      │  Paste URL  │                                                         │
│      └──────┬──────┘                                                         │
│             │                                                                │
│             ▼                                                                │
│   2. LOCAL GENERATION (instant, no network)                                  │
│      ┌─────────────────────────────────────────────────┐                     │
│      │  • Generate random alias locally                │                     │
│      │  • Generate QR code (canvas-based)              │                     │
│      │  • Display short URL immediately                │                     │
│      └──────────────────────┬──────────────────────────┘                     │
│                             │                                                │
│                             ▼                                                │
│   3. USER COMMITS (copy link or download QR)                                 │
│      ┌─────────────────────────────────────────────────┐                     │
│      │  • Add to localStorage sync queue               │                     │
│      │  • Trigger background sync                      │                     │
│      └──────────────────────┬──────────────────────────┘                     │
│                             │                                                │
│              ┌──────────────┴──────────────┐                                 │
│              │                             │                                 │
│              ▼                             ▼                                 │
│   ┌─────────────────┐           ┌─────────────────┐                          │
│   │     ONLINE      │           │    OFFLINE      │                          │
│   │                 │           │                 │                          │
│   │  POST /api/urls │           │  Queue in       │                          │
│   │  Sync to D1     │           │  localStorage   │                          │
│   │  Mark as synced │           │  Show warning   │                          │
│   └────────┬────────┘           └────────┬────────┘                          │
│            │                             │                                   │
│            │                             ▼                                   │
│            │                  ┌─────────────────┐                            │
│            │                  │  BACK ONLINE    │                            │
│            │                  │                 │                            │
│            │                  │  Process queue  │                            │
│            │                  │  Retry w/ exp.  │                            │
│            │                  │  backoff        │                            │
│            │                  └────────┬────────┘                            │
│            │                           │                                     │
│            └───────────┬───────────────┘                                     │
│                        ▼                                                     │
│   4. SYNCED                                                                  │
│      ┌─────────────────────────────────────────────────┐                     │
│      │  • URL stored in Cloudflare D1                  │                     │
│      │  • Cached in Cloudflare KV                      │                     │
│      │  • Redirect ready at satset.io/:alias           │                     │
│      └─────────────────────────────────────────────────┘                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Key points:**
- Alias + QR generated **client-side** (zero latency)
- Sync only happens when user **commits** (copies link or downloads QR)
- Failed syncs retry with **exponential backoff** (up to 5 attempts)
- **localStorage** persists queue across page reloads
- Online/offline listeners auto-trigger sync when connection restored

## Project Structure

```
satset.io/
├── public/                     # Static assets
│   ├── favicon.svg
│   ├── index.html
│   └── og-image.png
├── src/
│   ├── api/                    # Backend (Cloudflare Worker)
│   │   ├── worker.ts           # Elysia routes
│   │   ├── schemas.ts          # TypeBox validation schemas
│   │   ├── lib/                # Utilities (rate limit, security, etc.)
│   │   └── db/
│   │       └── schema.sql
│   ├── client/                 # Frontend (React)
│   │   ├── main.tsx            # Entry point
│   │   ├── routes/             # TanStack Router (file-based)
│   │   ├── components/         # Shared components
│   │   ├── hooks/              # Custom hooks
│   │   ├── lib/
│   │   │   ├── sync.ts         # Offline sync logic
│   │   │   ├── api.ts          # API client
│   │   │   └── ...
│   │   └── global.css          # Tailwind
│   └── index.ts                # Dev server (Bun)
├── scripts/
│   └── build.ts                # Production build
├── tsr.config.json             # TanStack Router config
├── wrangler.toml.example       # Cloudflare config template
└── package.json
```

## Setup

```bash
bun install
cp wrangler.toml.example wrangler.toml
# Edit wrangler.toml with your Cloudflare IDs
bun run db:init
bun dev
```

## Deploy

```bash
# Create Cloudflare resources
wrangler d1 create url-shortener-db
wrangler kv namespace create CACHE

# Update wrangler.toml with the IDs from above

# Initialize database
wrangler d1 execute url-shortener-db --remote --file=src/api/db/schema.sql

# Deploy
bun run deploy
```

## License

MIT
