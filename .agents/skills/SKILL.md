---
name: Rep Vault Development
description: Workflow for developing, seeding, and running the Rep Vault workout tracker
---

# Rep Vault Development Skill

## Overview

Rep Vault is a mobile-first workout tracker built with Next.js 16, Prisma (PostgreSQL), and Tailwind CSS 4. This skill covers the standard development workflow.
Primary persistent agent guidance now lives in `.cursor/rules/*.mdc`.

## Prerequisites

- Node.js 20+
- npm
- Docker (for local database)

## Development Workflow

### 1. Start Local Development Environment

```bash
# Start the full stack (PostgreSQL + Next.js App) via Docker Compose
docker compose up -d --build
```

The app installs dependencies, applies migrations, seeds base data, and runs at `http://localhost:3000`.
Historical import is opt-in with `RUN_IMPORT_ON_STARTUP=true`.

### 2. Database Operations

Since the app runs within Docker, background database schemas should ideally match. You can still run Prisma commands on your host machine to push schema changes and update the local generated client:

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name <migration_name>

# Open Prisma Studio (visual database browser)
npx prisma studio
```

### 3. Seed & Import Data

```bash
# Seed workout templates from program definition
npx tsx scripts/seed.ts

# Import real historical data from Anatoly Fit API
# Requires ANATOLY_* environment variables
npx tsx scripts/import_true_history.ts

# Generate fake workout logs for testing
npx tsx scripts/seed_fake_logs.ts

# Seed simulated past history
npx tsx scripts/seed_past_history.ts

# Delete all data (reset database)
# Requires explicit confirmation env guard
npx tsx scripts/delete_all.ts
```

> **Security Note**
> Never hardcode API tokens, cookies, or personal email addresses in scripts.
> To run destructive wipe safely: `CONFIRM_DELETE_ALL=YES_DELETE_ALL_DATA npx tsx scripts/delete_all.ts`

> **Note on Seeding & Passkeys (WebAuthn):**
> User creation and onboarding completion are handled through Auth.js + onboarding flow, not by hardcoded seed users.

### 4. Production Build

```bash
npm run build
npm run start
```

## Architecture Notes

- **App Router** — All pages use Next.js App Router (`src/app/`)
- **Server Components** — Pages fetch data server-side via Prisma
- **Client Components** — Interactive elements (set logging, charts) use `"use client"`
- **Database** — PostgreSQL hosted via Docker Compose
- **Styling** — Tailwind CSS 4 with dark mode enabled globally

## Key Files

| File | Purpose |
|------|---------|
| `prisma/schema.prisma` | Database models |
| `src/app/page.tsx` | Dashboard (daily workout view) |
| `src/app/history/page.tsx` | Workout history browser |
| `src/app/progress/page.tsx` | Progress charts |
| `src/components/ExerciseList.tsx` | Exercise card with set logging |
| `src/components/BottomNav.tsx` | Mobile bottom navigation |
| `scripts/seed.ts` | Database seeder |
