# Legal Documents

This folder contains versioned legal documents for the Kitchen Hub app (privacy policy and terms of service). They are the single source of truth for store listings and in-app legal links.

## Operator details (production)

**Privacy policy** (`privacy-policy-v1.md`) / **Terms** (`terms-of-service-v1.md`) and **public HTML** (`static-legal/privacy.html`, `static-legal/terms.html`, deployed via Vercel or served from the API deployment — see `static-legal/README.md`): **Yair Abramovitch** (individual developer, **Israel**), contact **yairabc@gmail.com**, app branding **FullHouse** / **Kitchen Hub**.

**Terms of service** (`terms-of-service-v1.md`): Same operator, governing law **State of Israel**, courts in **Israel**, contact **yairabc@gmail.com**.

If you incorporate a company or move jurisdiction, update these files, redeploy Vercel for the HTML, and bump legal version if the change is material.

## Versioning

- **v1** = first production version. Material changes (e.g. new data practices, new features affecting rights or liability) require a **new versioned file** (e.g. `privacy-policy-v2.md`, `terms-of-service-v2.md`).
- Keep previous versions in this folder for history. Update this README when adding new versions.
- Same philosophy as [backend API versioning](../backend/docs/api-versioning-guidelines.md): avoid breaking existing commitments; new commitments = new version.

## Files

- `privacy-policy-v1.md` — Privacy Policy (data collection, use, sharing, Supabase, store clauses, user rights).
- `terms-of-service-v1.md` — Terms of Service (acceptance, use, liability, governing law, contact).
