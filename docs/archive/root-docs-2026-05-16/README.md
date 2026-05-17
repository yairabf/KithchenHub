# Archived root documentation - 2026-05-16

These files were moved out of the repository root during documentation cleanup.

## Why these files are archived

The project had too many overlapping root-level documents. Current and future agents should use the canonical documentation set instead of these historical files.

## Archived files

- `README-DETAILED.md` — older long-form project README; likely overlaps with `README.md`, `mobile/README.md`, `backend/README.md`, `docs/features/*`, and `docs/project/*`.
- `CLAUDE.md` — Claude-specific agent guidance; replaced by canonical `AGENTS.md` and Hermes project docs.
- `CATEGORY_FIX_INSTRUCTIONS.md` — one-off category migration troubleshooting note; source/tests still document category normalization behavior.
- `PR_DESCRIPTION.md` — historical PR description for swipe-to-delete behavior.
- `kitchen_hub_project_context.md` — older project-context dump; superseded by `.hermes/PROJECT_CONTEXT.md`, `docs/project/PROJECT_OVERVIEW.md`, and `docs/project/ARCHITECTURE.md`.

## Canonical docs to use instead

- `AGENTS.md` — repository rules for agents.
- `.hermes/START_HERE.md` — first-read handoff for Hermes agents.
- `.hermes/PROJECT_CONTEXT.md` — durable project context.
- `docs/project/PROJECT_OVERVIEW.md` — product overview and priorities.
- `docs/project/ARCHITECTURE.md` — high-level architecture map.
- `docs/project/RECENT_CHANGES.md` — recent workstreams and context.
- `README.md` — public project entry point.
- `mobile/README.md` — mobile app overview and commands.
- `backend/README.md` — backend overview and commands.
