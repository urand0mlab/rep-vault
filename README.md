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

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

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
