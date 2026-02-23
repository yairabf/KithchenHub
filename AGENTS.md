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

Validation scripts for locked mobile config (run from `mobile/`):
```bash
npm run verify:identifiers
npm run verify:ota
npm run verify:eas
```

## 6) Copilot Rules
- No `.github/copilot-instructions.md` was found in this repo.

## 7) Agent Defaults
- Make small, targeted changes; avoid broad refactors unless requested.
- Respect existing module boundaries and architecture.
- Never change app IDs, OTA runtime policy, or EAS channel/build semantics without explicit approval.
- Run relevant checks for each changed surface (mobile/backend) before finishing.
- If workflows or commands change, update this file.
