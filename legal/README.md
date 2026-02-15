# Legal Documents

This folder contains versioned legal documents for the Kitchen Hub app (privacy policy and terms of service). They are the single source of truth for store listings and in-app legal links.

## Placeholders to Replace Before Store Submission

Before submitting to the App Store or Google Play, replace these placeholders in **both** `privacy-policy-v1.md` and `terms-of-service-v1.md`:

| Placeholder        | Where it appears                    | What to use |
|--------------------|-------------------------------------|-------------|
| `[Operator Name]`  | "Who we are" / data controller; parties | Your registered legal entity name, or "Kitchen Hub" with your full legal name as operator, or your full legal name if solo developer. |
| `[Jurisdiction]`   | Governing law; regulatory references    | Your country/state (e.g. California, United States or Israel). |

Contact email and effective date are already set to `support@kitchenhub.com` and the publication date in the documents.

## Versioning

- **v1** = first production version. Material changes (e.g. new data practices, new features affecting rights or liability) require a **new versioned file** (e.g. `privacy-policy-v2.md`, `terms-of-service-v2.md`).
- Keep previous versions in this folder for history. Update this README when adding new versions.
- Same philosophy as [backend API versioning](../backend/docs/api-versioning-guidelines.md): avoid breaking existing commitments; new commitments = new version.

## Files

- `privacy-policy-v1.md` — Privacy Policy (data collection, use, sharing, Supabase, store clauses, user rights).
- `terms-of-service-v1.md` — Terms of Service (acceptance, use, liability, governing law, contact).
