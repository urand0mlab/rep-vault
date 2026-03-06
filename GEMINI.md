# Rep Vault Agent Guidance (Cursor)

This project now uses Cursor-native rules as the source of truth for AI behavior.

## Source Of Truth

- `.cursor/rules/project-architecture.mdc`
- `.cursor/rules/onboarding-invariants.mdc`
- `.cursor/rules/auth-passkey-constraints.mdc`
- `.cursor/rules/ui-mobile-darkmode.mdc`
- `.cursor/rules/prisma-and-scripts-safety.mdc`
- `.cursor/rules/knowledge-maintenance.mdc`
- `.cursor/rules/commit-and-push-workflow.mdc`
- `.cursor/rules/pr-workflow.mdc`

## How To Maintain

- Update rule files in `.cursor/rules/` when standards change.
- Keep `README.md` and `.env.example` aligned with runtime setup and scripts.
- Record significant decisions and rationale in `DECISIONS.md`.
- Avoid duplicating normative instructions across multiple docs.

## Legacy Note

This file is retained as a pointer for compatibility. Rules should be added or edited in `.cursor/rules/*.mdc`, not here.
