# [Feature / Task Name]

> Recovery / implementation plan for continuing this work in a fresh LLM session.

## Metadata
- **Date:** YYYY-MM-DD
- **Area:** mobile | backend | full-stack | docs | infra
- **Status:** proposed | in-progress | partially implemented | ready for verification | completed
- **Primary files:** `path/to/file`, `path/to/another/file`
- **Related docs:** `docs/...`, `.hermes/plans/...`

---

## Goal

Describe in 1-3 bullets what this task is trying to accomplish.

- Goal 1
- Goal 2
- Goal 3

---

## Why this work exists

Explain the bug, feature request, UX issue, or architectural reason behind the work.

---

## Decisions already made

Capture stable choices so a future LLM does not re-open them accidentally.

- Decision 1
- Decision 2
- Decision 3

Include explicit “do not do X” guidance if relevant.

---

## Current recovered state

Describe what is already true in the codebase right now.

### Already implemented
- Item 1
- Item 2
- Item 3

### Still missing / uncertain
- Gap 1
- Gap 2
- Gap 3

---

## Files to read first

- `AGENTS.md`
- `.hermes/PROJECT_CONTEXT.md`
- `docs/features/...`
- `docs/implementation/...`
- `mobile/src/...`
- `backend/src/...`

---

## Important code paths

List the main files/functions/components/services involved.

### UI / screen layer
- `path/to/file`
- Notes

### State / hooks / services
- `path/to/file`
- Notes

### Backend / API layer
- `path/to/file`
- Notes

---

## Constraints and guardrails

List important things that must remain true.

- Preserve RTL behavior.
- Respect guest vs signed-in vs public-catalog boundaries.
- Do not change protected app identifiers / OTA / EAS settings without approval.
- Keep changes targeted.

Add task-specific constraints here too.

---

## Step-by-step implementation plan

### Step 1 — Inspect
- Read the relevant files.
- Confirm whether docs and code agree.
- Identify the exact gap.

### Step 2 — Add or update tests first
- Add focused regression coverage.
- Verify the failing/meaningful baseline.

### Step 3 — Implement minimal changes
- Modify only the necessary files.
- Reuse existing patterns.

### Step 4 — Verify
- Run targeted checks.
- Run broader checks if the touched surface is risky.

### Step 5 — Finalize
- Update docs if behavior changed.
- Update `.hermes/SESSION_LOG.md` if this was a major workstream.

---

## Validation commands

### Mobile
```bash
cd /home/claw/.hermes/hermes-agent/projects/KithchenHub/mobile
npx tsc --noEmit
npm test -- --runInBand
```

### Backend
```bash
cd /home/claw/.hermes/hermes-agent/projects/KithchenHub/backend
npm run build
npm run lint
npm run test:unit
```

Replace with narrower commands whenever possible.

---

## Verification checklist

- [ ] The intended behavior is implemented
- [ ] No known regression was introduced
- [ ] RTL still works if UI changed
- [ ] Guest / signed-in / public-catalog boundaries were respected
- [ ] Relevant tests pass
- [ ] Relevant docs were updated
- [ ] Session log updated if this was a notable milestone

---

## Handoff prompt for another LLM

```text
Work in /home/claw/.hermes/hermes-agent/projects/KithchenHub.
Read AGENTS.md, then .hermes/PROJECT_CONTEXT.md, then this plan file, then the referenced feature/implementation docs before making changes.
After reading, summarize what is already implemented, what is still missing, and what you plan to verify first.
```

---

## Final notes

Add anything a future LLM would otherwise have to rediscover manually.
