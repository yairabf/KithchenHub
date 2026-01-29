# Database Migrations and Rollback

This document describes how to run Prisma migrations and recover from failures in a **cloud-agnostic** way (Render, GCP Cloud Run, AWS ECS, local, or any platform). For full deployment flows, see [DEPLOYMENT.md](../DEPLOYMENT.md).

## Running migrations

One command applies everywhere: **`prisma migrate deploy`** with the project schema path and a direct database URL. Use `DIRECT_URL` when your app uses a pooled `DATABASE_URL` (e.g. Supabase pooler, PgBouncer); otherwise `DATABASE_URL` is sufficient and Prisma will use it for migrations.

### Canonical command

From the backend root, with `DIRECT_URL` or `DATABASE_URL` set:

```bash
npm run prisma:deploy
```

Or explicitly:

```bash
npx prisma migrate deploy --schema=src/infrastructure/database/prisma/schema.prisma
```

- **Local / Docker:** Set `DIRECT_URL` (or `DATABASE_URL`) in `.env` or pass `-e DATABASE_URL=...` when using `docker run`.
- **CI (GitHub Actions):** The reusable `_deploy.yml` workflow runs this command inside the built Docker image using the secret `DIRECT_URL` or `DATABASE_URL`. No extra step needed for GCP Cloud Run or AWS ECS when using that workflow.
- **Render:** Set `DIRECT_URL` (or `DATABASE_URL`) in the Render service environment. Run migrations via:
  - **Render Shell:** Open Shell for the service and run `npm run prisma:deploy` (or the `npx prisma migrate deploy ...` command above) from the app root.
  - **Deploy hook or background job:** Configure a step that runs the same command before or after deploy. If migrations run on Render, you can pass `skip_migrations: true` to the `_deploy.yml` workflow when calling it from GitHub so migrations run only once (on Render).
- **GCP Cloud Run / AWS ECS:** Migrations are run by the `_deploy.yml` migrations job before the deploy step. Ensure `DIRECT_URL` or `DATABASE_URL` is passed as the corresponding GitHub secret (e.g. `STAGING_DIRECT_URL`, `PROD_DIRECT_URL`).

Schema path is always: `src/infrastructure/database/prisma/schema.prisma`.

---

## Rollback and migration recovery

Rollback has two layers: **application** (revert the running app version) and **database** (restore data or fix migration history). Use both when needed.

### 1. Application rollback

Revert the running app to a previous image or revision. This does **not** undo database schema changes.

- **General (Docker):** See [DEPLOYMENT.md – Rollback Procedure](../DEPLOYMENT.md#rollback-procedure): stop the current container and start the previous image (e.g. `ghcr.io/OWNER/kitchen-hub-api:main-<previous-sha>`).
- **GCP Cloud Run:** In the Cloud Run console, select the service → Revisions → select a previous revision → “Manage Traffic” and route 100% to that revision.
- **AWS ECS:** Update the service to use a previous task definition (previous image tag) and force a new deployment.

### 2. Database rollback (snapshots / restore)

If a migration or deploy has broken the database or you need to undo schema/data changes, use your provider’s backup and restore. Restore creates a point-in-time copy; then point the app to the restored instance (or replace the current DB) and redeploy if needed.

| Platform | How to snapshot / restore |
|----------|---------------------------|
| **Render** | Use Render’s PostgreSQL backup/restore (or the linked external DB provider’s backup/restore). In the Render dashboard, use the database’s Backups tab to create a snapshot and restore when needed. |
| **Supabase / Neon** | Use the provider’s backup and point-in-time recovery (PITR) in their dashboard or docs. Restore to a new instance or overwrite as per provider. |
| **GCP (Cloud SQL)** | Use Cloud SQL backups and PITR. Restore to a new instance or to the same instance as per Google Cloud docs; then point the app to the restored instance. |
| **AWS (RDS)** | Use RDS automated backups and PITR. Restore to a new instance; update the app’s `DATABASE_URL` / `DIRECT_URL` to the restored instance. |

After a restore, the database may be behind the latest migration history in code. See **Prisma migrate resolve** below to reconcile if needed.

### 3. Prisma migrate resolve (fix migration history)

`prisma migrate resolve` updates the `_prisma_migrations` table only; it does **not** run or revert SQL. Use it to fix migration state after a failed migration or after applying SQL by hand.

- **When to use:**
  - **`--rolled-back`:** A migration failed in production and you have fixed the migration (or reverted it). Mark it as rolled back so Prisma can re-apply it later with `prisma migrate deploy`.
  - **`--applied`:** You applied the migration SQL manually (e.g. hotfix). Mark it as applied so Prisma does not try to apply it again.

- **Migration name format:** Use the **folder name** of the migration under `src/infrastructure/database/prisma/migrations/`, e.g. `20260125000000_add_soft_delete_timestamps`.

**Mark a migration as rolled back** (so it can be re-applied):

```bash
npx prisma migrate resolve --rolled-back "20260125000000_add_soft_delete_timestamps" --schema=src/infrastructure/database/prisma/schema.prisma
```

**Mark a migration as applied** (after manual SQL or patch):

```bash
npx prisma migrate resolve --applied "20260125000000_add_soft_delete_timestamps" --schema=src/infrastructure/database/prisma/schema.prisma
```

Set `DATABASE_URL` or `DIRECT_URL` (e.g. in `.env` or environment) when running these commands.

**Typical failed-migration flow:**

1. Migration fails in production.
2. Fix the migration (or revert the change) in code.
3. Run `prisma migrate resolve --rolled-back "<migration_name>"` against the production DB.
4. Deploy the fixed code and run `prisma migrate deploy` again (or let CI run it).

**References:**

- [Prisma: Patching and hotfixing](https://www.prisma.io/docs/orm/prisma-migrate/workflows/patching-and-hotfixing)
- [Prisma: migrate resolve](https://www.prisma.io/docs/orm/reference/prisma-cli-reference#migrate-resolve)

---

## Summary

- **Run migrations:** `npm run prisma:deploy` (or equivalent `npx prisma migrate deploy ...`) with `DIRECT_URL`/`DATABASE_URL`, same on all platforms.
- **Rollback:** (1) Application: revert to previous image/revision. (2) Database: use provider backup/restore. (3) Migration history: use `prisma migrate resolve --rolled-back` or `--applied` when needed.

For deployment steps and secrets, see [DEPLOYMENT.md](../DEPLOYMENT.md).
