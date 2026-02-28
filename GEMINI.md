# Workout Tracker Coding Standards & Practices

## Core Stack
- **Framework**: Next.js 16 (App Router)
- **Database ORM**: Prisma (PostgreSQL)
- **Styling**: Tailwind CSS 4
- **Language**: TypeScript

## Database & Environment
- **Provider**: PostgreSQL is the default database provider. Legacy SQLite (`dev.db`) is obsolete and should not be used.
- **Local Database**: Use Docker to spin up the local PostgreSQL database (`docker compose up -d db`).
- **Environment Variables**: Ensure `.env` is correctly pointing to the local Docker database during active development:
  ```env
  DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/postgres"
  DIRECT_URL="postgresql://postgres:postgrespassword@localhost:5432/postgres"
  ```
- **Prisma Workflows**: 
  - Update client after schema alteration: `npx prisma generate`
  - Apply schema and wipe local DB: `npx prisma db push --force-reset`
  - Create standard migrations: `npx prisma migrate dev --name <migration_name>`
- **Data Initialization**:
  - The database is frequently wiped and re-seeded using scripts via `tsx`.
  - Base training data: `npx tsx scripts/seed.ts`
  - True history from external API: `npx tsx scripts/import_true_history.ts`

## Design & UI Aesthetics
- **Mobile-First Paradigm**: The application is strictly built for mobile devices. All views must be optimized for touch interactions, using `BottomNav` and appropriately sized tap targets.
- **Dark Mode**: Tailwind CSS dark mode is globally enabled. All new components must gracefully support dark mode palettes (`dark:bg-slate-900`, etc.).
- **Data Visualization**: Recharts is the standard library for rendering progress graphs.

## App Architecture
- **Server Components**: Keep data fetching on the server side using direct Prisma queries.
- **Client Components**: Add `"use client"` only at the leaves of the component tree for interactive elements (such as set logging and charts).
