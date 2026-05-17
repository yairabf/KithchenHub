# Mobile/UI Documentation Cleanup Notes

Date: 2026-05-16

## Source inspected

- `mobile/App.tsx`
- `mobile/src/navigation/RootNavigator.tsx`
- `mobile/src/navigation/AuthStackNavigator.tsx`
- `mobile/src/navigation/MainNavigator.tsx`
- `mobile/src/navigation/MainTabsScreen.tsx`
- `mobile/src/features/*`
- `mobile/src/common/*`
- `mobile/src/contexts/*`
- `mobile/README.md`
- `docs/features/*.md`

## Decisions

### Preserve as product/agent intent docs

- `docs/features/shopping.md`
- `docs/features/recipes.md`
- `docs/features/dashboard.md`

These are useful because they explain feature priority, UX intent, fragile areas, and what future agents should protect. They are not full source maps, so each now links to `docs/features/mobile-ui-map.md`.

### Preserve but correct source structure

- `docs/features/chores.md`
- `docs/features/settings.md`
- `docs/features/auth.md`

These had stale source headers. Corrections added:

- Auth now reflects registration, invite-code join, household onboarding, OAuth hook, token/session services, and guest-data import support.
- Chores now reflects current exported components and the broader component/service/test structure.
- Settings now reflects legal consent, import/data controls, premium/subscription, invite/member management, and account services.

### Added during this pass

- `docs/features/mobile-ui-map.md`
  - Current mobile navigation and feature-area map.
  - Intended as the first source-backed feature map for coder/reviewer/docs agents.
- `.hermes/audits/2026-05-16-mobile-ui-source-map.md`
  - Audit artifact generated from source tree.

### Updated during this pass

- `mobile/README.md`
  - Replaced stale/too-specific feature bullets with source-backed current feature summaries.
  - Linked to `docs/features/mobile-ui-map.md`.
- `docs/project/DOCUMENTATION_MAP.md`
  - Added `docs/features/mobile-ui-map.md` to the main mobile feature docs list.

## Archive/delete decision

No mobile/UI docs were archived in this pass.

Reason: the feature docs contain useful product intent and guardrails for future agents. The safer cleanup was to add a source-backed map and correct stale headers rather than deleting or heavily rewriting the intent docs.

## Follow-up gaps

- Some screenshots referenced by feature docs may be stale or missing; validate in a later screenshots/assets bucket before keeping them as canonical visual references.
- `docs/features/chores.md` is much more implementation-heavy than the newer intent-style docs. It may later be split into:
  - product/UX intent doc
  - implementation/source reference doc
- `docs/features/settings.md` should later be expanded into clearer subareas: account/privacy, household/invites, language/i18n, legal consent, premium/subscription.
- `docs/features/auth.md` should later be rewritten more fully around the current auth/onboarding flows instead of only patched at the top.
