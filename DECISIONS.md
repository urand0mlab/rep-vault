# Rep Vault Decision Log

Use this file to capture important architectural, product, and operational decisions.

## Entry Format

```text
## YYYY-MM-DD - Short decision title
- Context:
- Decision:
- Impact:
- Follow-up:
```

## 2026-03-06 - Cursor rules as AI source of truth
- Context: Project guidance existed across `.agents/*` and `GEMINI.md`, causing drift.
- Decision: Adopt `.cursor/rules/*.mdc` as the primary persistent AI instruction set.
- Impact: Guidance is now scoped, maintainable, and aligned with Cursor behavior.
- Follow-up: Keep `GEMINI.md` as pointer doc and update rules directly for future changes.

## 2026-03-06 - Safer local startup and script operations
- Context: Historical import and destructive script usage risked accidental side effects.
- Decision: Make historical import opt-in and require explicit confirmation for destructive wipes.
- Impact: Development startup is more predictable and operations are safer.
- Follow-up: Continue enforcing env-driven credentials and guardrails in scripts.

## 2026-03-06 - Standardized solo commit and push workflow
- Context: Project is currently maintained by a single contributor and needs predictable agent commit behavior.
- Decision: Use Conventional Commits and treat explicit user phrases like "commit and push" or "ship it" as approval to commit completed changes and push the branch.
- Impact: Commits are consistent, and agent actions are clear and repeatable.
- Follow-up: Keep commit workflow guidance in `.cursor/rules/commit-and-push-workflow.mdc` and `README.md`.

## 2026-03-06 - Pin dependency versions for supply-chain control
- Context: Range-based dependency specifiers can pull unreviewed updates during installs and builds.
- Decision: Pin package versions in `package.json` (no caret/tilde ranges) and upgrade intentionally when needed.
- Impact: Dependency updates become explicit, reviewable, and less exposed to accidental or compromised upstream changes.
- Follow-up: Keep this policy in `.cursor/rules/knowledge-maintenance.mdc` and apply it to future dependency changes.

## 2026-03-06 - Adopt PR-first shipping workflow
- Context: Even as a solo contributor, shipping through PRs improves traceability and creates a consistent review checklist.
- Decision: Default to branch -> commit -> push branch -> PR to `main`, with direct push only when explicitly requested.
- Impact: Better change auditability and safer releases with standard test/docs checks captured in PRs.
- Follow-up: Maintain `.cursor/rules/pr-workflow.mdc` and `.github/pull_request_template.md`.

## 2026-03-06 - Enforce server-action logout path
- Context: Logout should invalidate auth state securely, with server-side cookie/session teardown rather than client-only state changes.
- Decision: Add a dedicated server action (`src/app/auth/actions.ts`) that calls `signOut` from `@/auth`, and route UI logout controls through it.
- Impact: Logout behavior is centralized, predictable, and aligned with Auth.js-managed session invalidation.
- Follow-up: Keep logout guidance in `.cursor/rules/auth-passkey-constraints.mdc` and `README.md`.

## 2026-03-06 - Add login anti-enumeration protections
- Context: Passkey login flow needed protection against brute-force and account enumeration signals.
- Decision: Add in-memory middleware throttling for `/api/auth/*` POST requests and make login failures use generic user-facing messages.
- Impact: Reduces high-volume auth abuse per process and minimizes information leakage from provider-specific errors.
- Follow-up: If deployed on multiple instances, replace in-memory throttling with shared storage (for example Redis) and keep limits documented in `README.md`.
