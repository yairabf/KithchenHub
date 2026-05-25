# Support intake docs notes — 2026-05-24

## Task
Kanban task `t_11745f23`: document QA-passed support email migration and guided support issue submission flow after same-ticket designer → coder → reviewer → QA completion.

## Sources inspected
- Kanban comments and QA pass handoff for `t_11745f23`.
- `mobile/src/features/support/supportTicket.ts`.
- `mobile/src/features/support/screens/SupportTicketScreen.tsx`.
- `mobile/src/features/settings/screens/SettingsScreen.tsx`.
- `website/support.html`.
- `static-legal/support.html`.
- `website/validate-landing.mjs`.
- Existing project docs: `docs/project/DOCUMENTATION_MAP.md`, `docs/project/RECENT_CHANGES.md`, `docs/project/ARCHITECTURE.md`, `docs/project/STORE_COMPLIANCE.md`, `docs/project/RELEASE_STATUS.md`, `docs/features/mobile-ui-map.md`, `docs/features/settings.md`, `.hermes/PROJECT_CONTEXT.md`, and `website/README.md`.

## Source-backed facts recorded
- Confirmed support email: `yair.solutions.19@gmail.com`.
- Recommended Gmail routing label/folder for future support-agent processing: `KitchenHub/Support/Issues/New`.
- Current implementation is `mailto:`-backed, not a backend support-ticket API.
- Mobile Settings opens `SupportTicket`; the support screen persists drafts in `AsyncStorage` under `fullhouse.supportTicketDraft.v1` and preserves the draft when no email app can open the generated mailto URL.
- Public support pages exist in both `website/` and `static-legal/`.
- QA passed the public support form layout at `b0f8038`, including Topic/Details/Context/Review action-control overlap checks.

## Docs updated
- `.hermes/PROJECT_CONTEXT.md`.
- `docs/project/DOCUMENTATION_MAP.md`.
- `docs/project/RECENT_CHANGES.md`.
- `docs/project/ARCHITECTURE.md`.
- `docs/project/STORE_COMPLIANCE.md`.
- `docs/project/RELEASE_STATUS.md`.
- `docs/features/mobile-ui-map.md`.
- `docs/features/settings.md`.
- `website/README.md`.
- `/mnt/obsidian-vault/Projects/KitchenHub/README.md`.

## Open questions / limits
- Deployed `/support` still needs HTTP verification before it is treated as store metadata-ready.
- No backend support-intake service exists yet; do not document support submissions as server-side tickets.
- Reviewer noted optional mobile quality-nudge strings in `supportTicket.ts` remain English; this is a future localization polish item, not a QA blocker for the current flow.
- Native mobile navigation was validated by tests/TypeScript rather than a physical device or emulator run.
