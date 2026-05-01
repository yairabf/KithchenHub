# KitchenHub LLM Start Here

Use this file when starting a fresh session in a new LLM or after context loss.

## Read order

1. `AGENTS.md`
2. `.hermes/PROJECT_CONTEXT.md`
3. `.hermes/START_HERE.md` (this file, if opened directly you are already here)
4. `.hermes/SESSION_LOG.md`
5. relevant file(s) under `.hermes/plans/`
6. relevant feature docs under `docs/features/`
7. relevant implementation/architecture docs if the task touches deeper behavior

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

- `.hermes/plans/2026-04-28_0502-home-tab-frequent-items-recovery-plan.md`
- `.hermes/plans/2026-04-27_095926-ios-form-presentation-rework.md`
- `.hermes/plans/2026-04-27_055530-mobile-modal-keyboard-scroll-plan.md`

## Recommended restart prompt

```text
You are working in /home/claw/.hermes/hermes-agent/projects/KithchenHub.
Before proposing changes, read AGENTS.md, then docs/project/PROJECT_OVERVIEW.md, then docs/project/RECENT_CHANGES.md, then the most relevant file under .hermes/plans/, then the matching docs/features or docs/implementation files.
After reading, summarize the current state briefly and only then plan or edit code.
```

## Notes

- If the task is dashboard/home-tab related, start with the 2026-04-28 frequent-items recovery plan.
- If the task is iOS modal/form related, start with the 2026-04-27 form-presentation plans.
- If docs and code disagree, verify whether the code reflects newer approved work before reverting toward older docs.
