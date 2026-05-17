# KitchenHub Session Log

Use this file as a rolling changelog / continuity log for major project-level LLM work.

## Purpose

This is **not** a git changelog and **not** a substitute for detailed implementation plans.
It is a lightweight continuity layer for future LLM sessions.

Log here:
- major planning/setup milestones
- important project-local documentation changes
- meaningful architecture/workflow decisions
- references to plan files or PRs worth reading first

Do **not** dump every tiny edit here.

---

## Entry Template

```md
## YYYY-MM-DD — Short title

**Summary**
- What changed
- Why it matters

**Files / references**
- `path/to/file`
- `another/path`

**Follow-up**
- What a future LLM should check next
```

---

## 2026-05-15 — Store release/compliance context pack added

**Summary**
- Added standardized project docs for architecture, store compliance, and release status.
- Documented Android accepted/live status and Apple review pending status.
- Documented Google Play Data Safety/account deletion URL decisions and screenshot locations.
- Updated the start-here/read-order docs so coder/reviewer/docs profiles can find the shared context.

**Files / references**
- `docs/project/ARCHITECTURE.md`
- `docs/project/STORE_COMPLIANCE.md`
- `docs/project/RELEASE_STATUS.md`
- `docs/project/RECENT_CHANGES.md`
- `.hermes/START_HERE.md`
- `.hermes/PROJECT_CONTEXT.md`

**Follow-up**
- The docs profile should audit README files and expand project docs as needed.
- After Apple review returns, update `STORE_COMPLIANCE.md`, `RELEASE_STATUS.md`, and `RECENT_CHANGES.md`.

## 2026-05-11 — Premium paused; mobile cache/snappiness promoted

**Summary**
- Synced `main` through `471b9d7` and documented the latest icon/cache/catalog stabilization state.
- Put premium/RevenueCat work on hold until the user explicitly resumes it.
- Promoted mobile cache-first startup/snappiness as the current primary production-stabilization workstream.
- Added a dedicated investigation plan focused on startup work, device cache coverage, remote query reduction, and high-frequency shopping edit latency.

**Files / references**
- `.hermes/plans/2026-05-11-mobile-cache-snappiness-plan.md`
- `.hermes/START_HERE.md`
- `.hermes/PROJECT_CONTEXT.md`
- `docs/project/RECENT_CHANGES.md`

**Follow-up**
- Before implementing, inspect startup/auth/bootstrap providers, tab mounting, repository cache rules, focus refresh behavior, catalog/display-name caching, and shopping edit optimistic flows.
- Make one small performance PR at a time, starting with the confirmed root cause that most affects first-open or shopping-edit snappiness.

## 2026-04-28 — Established project-local LLM context structure

**Summary**
- Added a project-local context system for KitchenHub so fresh LLM sessions can resume with less rediscovery.
- Kept `AGENTS.md` as the main repo instruction file.
- Added `.hermes/PROJECT_CONTEXT.md` as the durable project context snapshot.
- Added `.hermes/START_HERE.md` as the fast handoff / restart file.
- Updated `AGENTS.md` to explicitly point future agents at these `.hermes/*` context files.

**Files / references**
- `.hermes/PROJECT_CONTEXT.md`
- `.hermes/START_HERE.md`
- `AGENTS.md`

**Follow-up**
- Keep these files updated when major project conventions or active workstreams change.
- When starting a new large effort, add a dedicated plan under `.hermes/plans/`.

## 2026-04-28 — Added dashboard home-tab recovery plan

**Summary**
- Added a recovery/handoff plan for the home-tab dashboard refactor so another LLM can restart from a saved plan.
- Captured the intended direction: remove Suggested Items and quick stats from the dashboard, add a dashboard-native Frequently Added section, derive frequency from shopping activity, preserve placeholder state and RTL behavior.

**Files / references**
- `.hermes/plans/2026-04-28_0502-home-tab-frequent-items-recovery-plan.md`

**Follow-up**
- Re-verify code vs docs if continuing dashboard work.
- Check whether `docs/features/dashboard.md` needs an update to match the newer approved direction.

## 2026-04-28 — Added continuity files for future sessions

**Summary**
- Added a rolling session log and a reusable plan template to standardize future LLM handoffs.
- This makes it easier to preserve context across model switches and token-limit resets.

**Files / references**
- `.hermes/SESSION_LOG.md`
- `.hermes/templates/PLAN_TEMPLATE.md`

**Follow-up**
- When a future task becomes a multi-step effort, copy the template and create a new dated plan file under `.hermes/plans/`.
