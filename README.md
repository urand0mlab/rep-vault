# 🏋️ Rep Vault

A mobile-first workout tracker built with **Next.js 16**, **Prisma**, and **Tailwind CSS 4**. Track your daily workouts, log sets & reps in real-time, and visualize your progress over time.

## Features

- **Daily Dashboard** — View today's workout with date navigation
- **Set Logging** — Log weight and reps for each set with one tap
- **Workout History** — Browse past workouts and completed sessions
- **Progress Charts** — Visualize strength gains with Recharts
- **Dark Mode** — Sleek dark UI optimized for gym use
- **Mobile-First** — Bottom navigation, touch-friendly design

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | SQLite via Prisma ORM |
| Styling | Tailwind CSS 4 |
| Charts | Recharts |
| Icons | Lucide React |

## Environment Variables

Create a `.env` file in the root based on your Supabase project (for Vercel deployment):

```env
# Connect to Supabase via connection pooling with Supavisor (Transaction Mode)
# This is required for serverless environments like Vercel
DATABASE_URL="postgres://postgres.xxxxxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database. Used for CLI migrations (npx prisma migrate)
DIRECT_URL="postgres://postgres.xxxxxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

## Getting Started

### Local Development via Docker (Recommended)

The easiest way to run the app and database locally without configuring PostgreSQL is using Docker Compose.

```bash
# Start the app and the Postgres database
# This automatically runs migrations and seeds the database
docker compose up
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Local Development (Manual Setup)

If you prefer running without Docker but still using Supabase:

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations to Supabase
npx prisma migrate dev --name init

# Seed the database with workout templates
npx tsx scripts/seed.ts
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Import Historical Data

```bash
# Import from Anatoly Fit workout CSV
npx tsx scripts/import_true_history.ts
```

## Project Structure

```
├── base_training/       # Training data exports (CSV)
├── prisma/              # Database schema & migrations
├── scripts/             # Seed & import utilities
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── history/     # Workout history page
│   │   └── progress/    # Progress charts page
│   ├── components/      # Reusable UI components
│   └── lib/             # Shared utilities
└── public/              # Static assets
```

## License

Private project.
