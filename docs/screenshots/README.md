# Screenshot Reference

This directory contains developer-facing screenshots used by feature docs and the root README.

## Current files

- `auth/auth-login.png` — 1024x768
- `dashboard/dashboard-main.png` — 1024x768
- `shopping/shopping-main.png` — 1024x768
- `shopping/shopping-quick-add-modal.png` — 1024x768
- `shopping/shopping-search-dropdown.png` — 2400x1626
- `shopping/shopping-category-modal.png` — 2400x1626
- `shopping/shopping-all-items-modal.png` — 2400x1626
- `shopping/shopping-new-list-modal.png` — 2400x1626
- `recipes/recipes-main.png` — 1024x768
- `recipes/recipes-detail.png` — 1024x768
- `recipes/recipes-add-modal.png` — 2400x1626
- `chores/chores-main.png` — 1024x768
- `chores/chores-edit-modal.png` — 2400x1626
- `chores/chores-quick-add-modal.png` — 2400x1626
- `settings/settings-main.png` — 1024x768
- `settings/settings-household-modal.png` — 1024x768

## Source-of-truth rule

Screenshots are visual references only. Do not use them as proof of current app behavior. For behavior, verify current source under `mobile/src/`, tests, or live app state.

## Freshness notes

- These images exist and are referenced by README/feature docs, but this pass did not run the app and re-capture them.
- Several modal screenshots are 2400x1626 while main-screen screenshots are 1024x768; keep this mixed sizing in mind when embedding them in docs.
- Store submission screenshots live separately under `mobile/store-screenshots/` and are tracked in `docs/project/STORE_COMPLIANCE.md` and `docs/project/RELEASE_STATUS.md`.

## When to refresh

Refresh affected screenshots after UI changes to:

- navigation or tab structure
- dashboard/shopping/recipes/chores/settings/auth main screens
- modals shown in feature docs
- store screenshots or app-review evidence

Record the source used to capture new screenshots: branch/commit, platform, viewport/device, data mode, and account/data fixture.
