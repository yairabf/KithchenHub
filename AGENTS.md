# AGENTS.md
Operational guide for coding agents in the Kitchen Hub monorepo.
Follow this unless the user gives explicit overrides.

## 1) Repo at a Glance
- Apps: `mobile/` (Expo React Native, TypeScript strict) and `backend/` (NestJS + Prisma, TypeScript).
- Root scripts orchestrate multi-app dev flows.
- Mobile architecture: feature-based (`mobile/src/features/*`) + shared (`mobile/src/common/*`).
- Backend architecture: module-based (`backend/src/modules/*`) + shared (`backend/src/common/*`, `backend/src/infrastructure/*`).

## 2) Build/Lint/Test Commands

### Root orchestration (run from repo root)
```bash
npm run dev:mock
npm run dev:backend
npm run dev:backend:ios
npm run dev:backend:android
```

### Mobile commands (run from `mobile/`)
```bash
npm start
npm run ios
npm run android
npm run web
npx tsc --noEmit
npm test
npm test -- --watch
npm test -- --coverage
```

Single mobile test file:
```bash
npm test -- src/features/recipes/services/recipeService.spec.ts
```

Single mobile test by test-name pattern:
```bash
npm test -- -t "maps API item correctly"
```

### Backend commands (run from `backend/`)
```bash
npm run start:dev
npm run build
npm run start:prod
npm run lint
npm run lint:fix
npm run typecheck
npm test
npm run test:unit
npm run test:watch
npm run test:cov
npm run test:e2e
npm run test:rls
npm run test:all
```

Single backend test file:
```bash
npm run test:unit -- src/modules/recipes/services/recipes.service.spec.ts
```

Single backend test by test-name pattern:
```bash
npm run test:unit -- -t "should return recipe details"
```

Single backend e2e file:
```bash
npm run test:e2e -- test/recipes.e2e-spec.ts
```

## 3) Pre-Commit Expectations
- Hooks are expected (`scripts/setup-git-hooks.sh`).
- Backend pre-commit checks: `npm run build`, `npm run lint`, `npm run test:unit`.
- Mobile pre-commit checks: `npx tsc --noEmit`, `npm test`.

## 4) Code Style Guidelines

### TypeScript
- Prefer explicit types at boundaries (DTOs, service interfaces, exported functions).
- Avoid `any`; use `unknown` plus narrowing.
- Keep mobile strictness intact; do not weaken tsconfig strict settings.
- Backend has some legacy relaxed flags; still write strict-leaning new code.

### Formatting and linting
- Backend formatter rules are authoritative: single quotes + trailing commas.
- Follow existing style in touched files; avoid unrelated reformatting.
- Keep functions small and focused; extract helpers for complex branching.

### Imports
- Group imports: external -> internal -> type-only.
- Use `import type` for type-only imports when practical.
- Mobile generally uses relative imports inside features.
- Backend supports `@/*` alias to `backend/src/*`.

### Naming
- `PascalCase`: React components, classes, Nest providers/controllers, DTO classes.
- `camelCase`: variables, functions, methods, hooks (`useX`).
- `UPPER_SNAKE_CASE`: constants.
- Test naming conventions: `*.spec.ts`, `*.test.ts`, `*.e2e-spec.ts`.

### Architecture placement
- Mobile feature code -> `mobile/src/features/<feature>/...`.
- Mobile shared/reusable code -> `mobile/src/common/...`.
- Mobile screens -> `mobile/src/features/<feature>/screens/...`.
- Backend feature code -> `backend/src/modules/<feature>/...`.
- Backend shared concerns -> `backend/src/common/...`.
- Maintain/update barrel exports (`index.ts`) when exposing feature APIs.

### Error handling
- Backend: throw Nest exceptions (`BadRequestException`, `NotFoundException`, `ForbiddenException`, etc.).
- Backend success envelope is centralized by `TransformInterceptor`; do not invent ad-hoc response envelopes.
- Backend error envelope is normalized by `HttpExceptionFilter`; keep messages clear.
- Mobile: validate inputs early and explicitly handle expected API/network failure cases.

### Backend data patterns
- Soft-delete is standard for user-owned entities via `deletedAt`.
- Use `ACTIVE_RECORDS_FILTER` in active-record queries.
- Do not manually set `updatedAt`; let Prisma manage it.
- Prefer repository delete/restore methods where present.

## 5) Cursor Rules in This Repo
Rules folder: `.cursor/rules/`

- `consult_skills_and_rules.mdc`
  - At task start, inspect relevant skills/rules before implementation.
  - Apply only relevant rules, not everything.

- `coding_rule.mdc`
  - Emphasizes readability, decomposition, edge-case handling, and pre-commit checks.
  - Includes expectations around strong typing and planning workflow.

- `app_identifiers_rule.mdc` (locked)
  - In `mobile/app.json`, do not change `expo.ios.bundleIdentifier` or `expo.android.package` without explicit approval.
  - Canonical value: `com.kitchenhub.app`.

- `runtime_version_ota_rule.mdc` (locked)
  - Keep `expo.runtimeVersion.policy = appVersion`.
  - Product version source of truth is repo-root `version.json`.

- `eas_update_channels_rule.mdc` (locked)
  - Keep preview channel `develop` and production channel `main` unless explicitly approved.
  - Keep preview/internal/APK and production/store/app-bundle semantics.

- `COMPOSER_WORKFLOW.md`
  - For explicit Composer/Plan tasks, follow structured plan/summary docs under `.cursor/tasks/...`.

Validation scripts for locked mobile/release config (run from `mobile/`):
```bash
npm run verify:identifiers
npm run verify:ota
npm run verify:eas
npm run verify:store-version
```

## 6) Copilot Rules
- No `.github/copilot-instructions.md` was found in this repo.

## 7) Project-Local Context Files
- This repo lives under the shared Hermes projects workspace: `/home/claw/.hermes/hermes-agent/projects/KithchenHub`.
- All Hermes profiles should treat project-local docs as the shared source of truth; profile-private memory is not canonical for project facts.
- Read `docs/project/DOCUMENTATION_MAP.md` for the canonical documentation map and source-backed reference paths.
- Read `docs/project/PROJECT_OVERVIEW.md` at the start of a fresh session for durable product overview and stable product constraints.
- Read `docs/project/RECENT_CHANGES.md` for the most relevant recent workstreams and documentation pointers.
- Read `docs/project/ARCHITECTURE.md` for the high-level technical architecture map.
- For store/release/privacy/compliance work, read `docs/project/STORE_COMPLIANCE.md` and `docs/project/RELEASE_STATUS.md`.
- Read `.hermes/START_HERE.md` when resuming after context loss or when handing the repo to a different LLM.
- Read `.hermes/SESSION_LOG.md` for a rolling record of major recent LLM milestones.
- Use `.hermes/templates/PLAN_TEMPLATE.md` as the starting point for new dated files under `.hermes/plans/`.
- Check `.hermes/plans/*.md` for task-specific recovery plans before continuing a multi-step effort.
- If project conventions or active workstreams change materially, update the relevant docs/project and `.hermes/*` context files.

## 8) Agent Defaults
- Make small, targeted changes; avoid broad refactors unless requested.
- Respect existing module boundaries and architecture.
- Never change app IDs, OTA runtime policy, or EAS channel/build semantics without explicit approval.
- Run relevant checks for each changed surface (mobile/backend) before finishing.
- If workflows or commands change, update this file.

## 9) KitchenHub Product Priorities and UX Bias
- Prioritize **mobile UX** first. Tablet support still matters, but mobile is the primary usage mode.
- Tablet should remain functional and polished, but do not optimize tablet at the expense of mobile responsiveness, smoothness, or correctness.
- Product priority order is: **shopping first, then recipes, then chores, then dashboard/home**.
- Treat the dashboard as a lightweight utility surface for quick access and quick add, not the main value of the app.
- Preserve a **native iOS/Android feel**. Avoid solutions that feel web-like, clunky, or overbuilt.
- Optimize for **speed, snappiness, and low loading time** wherever practical.

## 10) Preferred Implementation Style
- Prefer small, targeted edits over broad rewrites.
- Reuse existing components and patterns before creating new ones.
- Prefer **abstraction over duplication** when it improves readability and maintainability.
- Keep code human-readable: small focused functions, clear naming, and straightforward control flow.
- Favor maintainable structure that follows SOLID-style reasoning where appropriate.
- Avoid unnecessary new files unless they clearly improve the design.

## 11) What to Verify After UI Changes
- Mobile layouts still behave correctly and remain responsive.
- Animations still work as expected and feel smooth.
- Interaction performance remains fast and snappy.
- State persistence still works across sessions/app restarts when relevant.
- Tablet layouts still function correctly, even if mobile remains the higher priority.
- Changes do not break scrolling, modal behavior, keyboard interactions, or other surrounding UI flows.

## 12) What to Avoid
- Duplicate code paths.
- Hard-to-read or hard-to-maintain code.
- Unnecessary new files or abstractions that do not pay for themselves.
- Regressions in persistence, animation smoothness, responsiveness, or perceived performance.
- Letting dashboard/home work overshadow more important shopping/recipe/chore flows.

## 13) Ambiguity Rule
- If a task is ambiguous or an important product/UX decision is unclear, ask Yair instead of guessing.
- When unsure, preserve current behavior unless there is a clear reason to change it.
