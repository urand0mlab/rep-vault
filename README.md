# Rep Vault

Rep Vault is a mobile-first workout tracker built with Next.js App Router, Prisma, and PostgreSQL. It supports passkey login, guided onboarding, workout day execution, and progress tracking.

## Features

- Daily dashboard with date navigation
- Set logging for reps and weight
- Onboarding flow for profile + lifestyle baseline
- Workout history and progress charts
- Mobile-first dark UI

## Auth Session Security

- Logout is handled by a server action (`src/app/auth/actions.ts`) that calls Auth.js `signOut` from `@/auth`.
- This ensures cookie/session-token invalidation is performed server-side and redirects users to `/login`.
- Login auth endpoints are rate-limited in `src/middleware.ts` for `/api/auth/*` POST requests (in-memory, per-process).
- Login failures return a generic message to avoid exposing provider/internal error details useful for account enumeration.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Styling | Tailwind CSS 4 |
| Auth | Auth.js v5 (Passkeys/WebAuthn) |
| Charts | Recharts |
| Icons | Lucide React |

## Environment Variables

Copy `.env.example` to `.env` and fill required values:

```bash
cp .env.example .env
```

Minimum required:

```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/postgres"
DIRECT_URL="postgresql://postgres:postgrespassword@localhost:5432/postgres"
AUTH_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_WEBAUTHN_RPID="localhost"
```

Optional auth-throttling controls:

```env
AUTH_RATE_LIMIT_IP_MAX="20"
AUTH_RATE_LIMIT_IP_WINDOW_MS="60000"
AUTH_RATE_LIMIT_IP_ROUTE_MAX="10"
AUTH_RATE_LIMIT_IP_ROUTE_WINDOW_MS="60000"
```

## Getting Started

### Docker Development (recommended)

```bash
docker compose up
```

This starts the app and Postgres, runs migrations, seeds base data, and launches the dev server.

Historical external import is opt-in. To run it on startup:

```bash
RUN_IMPORT_ON_STARTUP=true docker compose up
```

### Manual Development

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npx tsx scripts/seed.ts
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data Scripts

```bash
# Import true history (requires ANATOLY_* env vars)
npx tsx scripts/import_true_history.ts

# Quick API connectivity check (requires ANATOLY_* env vars)
npx tsx scripts/test_api.ts

# Dangerous: wipes workout/exercise/set data
CONFIRM_DELETE_ALL=YES_DELETE_ALL_DATA npx tsx scripts/delete_all.ts
```

## Knowledge Maintenance

- AI guidance source of truth: `.cursor/rules/*.mdc`
- Decision log: `DECISIONS.md`
- Dependency policy: keep `package.json` versions pinned (no `^`/`~`) and update intentionally.
- When behavior or workflow changes, update these together in the same PR:
  - `.cursor/rules/*.mdc`
  - `README.md`
  - `.env.example` (if env/scripts change)
  - `DECISIONS.md` (for significant decisions)

## PR Workflow Standard

- Commit message standard: Conventional Commits (`type(scope): short summary`)
- Common types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- Before commit: check `git status`, review `git diff`, and run relevant checks (`lint`, `typecheck`, tests as needed)
- Agent behavior:
  - By default, no commit/push unless you explicitly request it
  - Default shipping path is PR-first: branch -> commit -> push branch -> open PR to `main`
  - After PR merge: switch to `main`, pull latest `origin/main`, then create a fresh branch for the next task
  - Use direct push to `main` only when explicitly requested
  - PR template: `.github/pull_request_template.md`

## Project Structure

```text
.
├── DECISIONS.md            # Architecture and workflow decision log
├── prisma/                 # Prisma schema and migrations
├── scripts/                # Seed/import/maintenance scripts
├── src/
│   ├── app/                # Next.js App Router routes
│   │   ├── login/          # Passkey sign-in
│   │   ├── onboarding/     # 3-step onboarding
│   │   ├── history/        # User workout history
│   │   └── progress/       # User progress charts
│   ├── components/         # Reusable UI components
│   ├── lib/                # Shared utilities
│   └── types/              # Type augmentation
├── .cursor/rules/          # Cursor-native project guidance
└── docker-compose.yml      # Local app + postgres stack
```

## License

Private project.
