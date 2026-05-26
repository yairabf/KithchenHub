# Support ticket backend intake docs notes — 2026-05-26

## Task
Kanban task `t_31e19c3e`: document QA-passed backend-first support ticket submission after coder/reviewer/QA completion.

## Sources inspected
- `backend/src/modules/support/controllers/support-tickets.controller.ts`
- `backend/src/modules/support/dtos/create-support-ticket.dto.ts`
- `backend/src/modules/support/services/support-tickets.service.ts`
- `backend/src/modules/support/guards/support-ticket-rate-limit.guard.ts`
- `backend/src/modules/support/services/support-ticket-rate-limit.service.ts`
- `mobile/src/features/support/supportTicketApi.ts`
- `mobile/src/features/support/screens/SupportTicketScreen.tsx`
- Kanban reviewer and QA evidence on `t_31e19c3e`

## Source-backed facts recorded
- Signed-in mobile primary support submission is backend-first via `mobile/src/features/support/supportTicketApi.ts`, which calls `POST /api/v1/support/tickets` through the shared versioned mobile API client.
- Backend support intake is protected by the global JWT guard and a support-ticket rate-limit guard; the in-process token bucket allows burst 3 and refills 3 submissions/hour per authenticated user before email is sent.
- Backend sends support tickets by Resend from configured `EMAIL_FROM` to `yair.solutions.19@gmail.com` with `reply_to` set to the submitted contact email.
- No support-ticket database persistence was added; success returns `referenceId` and `submittedAt`.
- Mobile clears the saved draft after backend success and keeps the draft with a visible error on backend/offline/unauthenticated failure. `Email support instead` remains a mailto fallback.

## Docs updated
- `docs/api/backend-endpoints.md`
- `docs/api/mobile-api-client-integration.md`
- `docs/features/settings.md`
- `docs/features/mobile-ui-map.md`
- `docs/project/DOCUMENTATION_MAP.md`
- `docs/project/RECENT_CHANGES.md`
- `docs/project/RELEASE_STATUS.md`
- `.hermes/PROJECT_CONTEXT.md`
- shared Obsidian note: `/mnt/obsidian-vault/Projects/KitchenHub/README.md`

## Open questions / limits
- No live Resend delivery or deployed backend request was executed during QA/docs to avoid credentials and real support-mailbox side effects.
- Rate limiting is currently in-process; if backend deployment moves to multiple replicas/serverless instances or support abuse increases, future work should consider a shared limiter.
- Public static support pages remain mailto-backed; do not document them as backend-submitting unless source changes.
- Deployed `/support` still needs HTTP verification before it is treated as store metadata-ready.
