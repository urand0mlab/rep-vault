---
name: Rep Vault Development
description: Workflow for developing, seeding, and running the Rep Vault workout tracker
---

# Rep Vault Development Skill

## Overview

Rep Vault is a mobile-first workout tracker built with Next.js 16, Prisma (PostgreSQL), and Tailwind CSS 4. This skill covers the standard development workflow.

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

The app automatically installs dependencies, applies migrations, seeds data, and runs at `http://localhost:3000`.

### 2. Database Operations

Since the app runs within Docker, background database schemas should ideally match. You can still run Prisma commands on your host machine to push schema changes and update the local generated client:

```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name <migration_name>

# Hard reset local DB and apply schema directly
npx prisma db push --force-reset

# Open Prisma Studio (visual database browser)
npx prisma studio
```

### 3. Seed & Import Data

```bash
# Seed workout templates from program definition
npx tsx scripts/seed.ts

# Import real historical data from Anatoly Fit API
npx tsx scripts/import_true_history.ts

# Generate fake workout logs for testing
npx tsx scripts/seed_fake_logs.ts

# Seed simulated past history
npx tsx scripts/seed_past_history.ts

# Delete all data (reset database)
npx tsx scripts/delete_all.ts
```

> **Note on Seeding & Passkeys (WebAuthn):**
> Running `seed.ts` creates the default user account but *not* a Passkey credential (Authenticator). 
> If you attempt to log into a freshly seeded account with `signIn('passkey')`, password managers like 1Password will silently fail because Auth.js is asking to "Authenticate" an account that has no valid passkey registered yet. 
> To fix this "Chicken and Egg" scenario, you must temporarily rename the seeded email in the database to force a "Registration" flow on the frontend, then merge the newly generated Authenticator back to the old seeded User record (see `scripts/temp_rename_seed.ts` and `scripts/merge_passkey.ts`).

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
