# KitchenHub LLM Start Here

Use this file when starting a fresh session in a new LLM or after context loss.

## Read order

1. `AGENTS.md`
2. `docs/project/DOCUMENTATION_MAP.md`
3. `docs/project/PROJECT_OVERVIEW.md`
4. `docs/project/RECENT_CHANGES.md`
5. `docs/project/ARCHITECTURE.md`
6. `docs/project/STORE_COMPLIANCE.md` and `docs/project/RELEASE_STATUS.md` for app-store/release/privacy/compliance work
7. `.hermes/PROJECT_CONTEXT.md`
8. `.hermes/START_HERE.md` (this file, if opened directly you are already here)
9. `.hermes/SESSION_LOG.md`
10. relevant file(s) under `.hermes/plans/`
11. relevant feature docs under `docs/features/`
12. relevant implementation/architecture docs if the task touches deeper behavior

## What each file is for

### `AGENTS.md`
The repo-level instruction file.
Read this for:
- commands
- coding rules
- architecture placement rules
- mobile/backend validation expectations
- protected config constraints

### `.hermes/PROJECT_CONTEXT.md`
The project-local operational context.
Read this for:
- repo mental model
- stable product constraints
- guest/signed-in/catalog data-mode boundaries
- recent workstreams worth checking before changing code

### `docs/project/*.md`
Shared durable project docs for all profiles.
Important files:
- `DOCUMENTATION_MAP.md` — canonical map of current docs, archived docs, and source-backed reference paths
- `PROJECT_OVERVIEW.md` — product context and priorities
- `RECENT_CHANGES.md` — current workstreams and recent direction changes
- `ARCHITECTURE.md` — technical structure and architecture mental model
- `STORE_COMPLIANCE.md` — App Store / Google Play / legal URL / data safety context
- `RELEASE_STATUS.md` — current review status and release blockers

### `.hermes/plans/*.md`
Task or feature recovery/handoff docs.
Read the most relevant one before continuing a multi-step effort.

### `.hermes/SESSION_LOG.md`
Rolling continuity log for major LLM workstreams.
Read this when you want a quick view of important recent milestones.

### `.hermes/templates/PLAN_TEMPLATE.md`
Reusable starting template for new recovery/implementation plans.
Copy this into a new dated file under `.hermes/plans/` for future multi-step work.

## Current saved plan files

- `.hermes/plans/2026-05-11-mobile-cache-snappiness-plan.md` **(current primary plan for production stabilization / cache-first performance)**
- `.hermes/plans/2026-05-05-premium-real-sdk-go-live-plan.md` **(premium SDK production wiring; currently on hold until user resumes premium work)**
- `.hermes/plans/2026-04-28_0502-home-tab-frequent-items-recovery-plan.md`
- `.hermes/plans/2026-04-27_095926-ios-form-presentation-rework.md`
- `.hermes/plans/2026-04-27_055530-mobile-modal-keyboard-scroll-plan.md`

## Recommended restart prompt

```text
You are working in /home/claw/.hermes/hermes-agent/projects/KithchenHub.
Before proposing changes, read AGENTS.md, docs/project/DOCUMENTATION_MAP.md, docs/project/PROJECT_OVERVIEW.md, docs/project/RECENT_CHANGES.md, docs/project/ARCHITECTURE.md, and .hermes/PROJECT_CONTEXT.md.
For store/release/privacy/compliance tasks, also read docs/project/STORE_COMPLIANCE.md and docs/project/RELEASE_STATUS.md.
Then read the most relevant file under .hermes/plans/ and the matching docs/features or docs/implementation files.
After reading, summarize the current state briefly and only then plan or edit code.
```

## Notes

- If the task is cache, snappiness, loading time, startup, remote slowness, shopping edit latency, or production stabilization related, start with the 2026-05-11 mobile cache/snappiness plan.
- Premium/RevenueCat work is currently on hold; do not resume it unless the user explicitly asks.
- If the task is dashboard/home-tab related, start with the 2026-04-28 frequent-items recovery plan.
- If the task is iOS modal/form related, start with the 2026-04-27 form-presentation plans.
- If docs and code disagree, verify whether the code reflects newer approved work before reverting toward older docs.
