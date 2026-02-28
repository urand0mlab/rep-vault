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

### 1. Start Local Database

```bash
# Start PostgreSQL via Docker Compose
npm run docker:up # or docker compose up -d
```

### 2. Start Development Server

```bash
npm run dev
```

The app runs at `http://localhost:3000`.

### 3. Database Operations

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

### 4. Seed & Import Data

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

### 5. Production Build

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
