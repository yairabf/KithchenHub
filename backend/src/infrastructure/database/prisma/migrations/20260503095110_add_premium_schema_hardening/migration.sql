-- Premium billing foundation schema hardening.
--
-- This migration is written to handle both:
-- 1. clean databases coming from main (tables do not exist yet)
-- 2. dev/shared databases that still contain the earlier experimental
--    household_subscriptions / household_entitlements tables from the
--    unmerged premium foundation branch.

-- household_subscriptions ---------------------------------------------------
CREATE TABLE IF NOT EXISTS "household_subscriptions" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "purchaser_user_id" UUID,
    "plan_key" TEXT NOT NULL,
    "billing_interval" TEXT,
    "status" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "store" TEXT,
    "provider_app_user_id" TEXT,
    "provider_customer_id" TEXT,
    "provider_subscription_id" TEXT,
    "provider_product_id" TEXT,
    "provider_entitlement_key" TEXT,
    "provider_environment" TEXT,
    "is_trial" BOOLEAN NOT NULL DEFAULT false,
    "trial_starts_at" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "current_period_starts_at" TIMESTAMP(3),
    "current_period_ends_at" TIMESTAMP(3),
    "cancel_at_period_end" BOOLEAN,
    "canceled_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_subscriptions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "household_subscriptions"
    ADD COLUMN IF NOT EXISTS "purchaser_user_id" UUID,
    ADD COLUMN IF NOT EXISTS "billing_interval" TEXT,
    ADD COLUMN IF NOT EXISTS "store" TEXT,
    ADD COLUMN IF NOT EXISTS "provider_app_user_id" TEXT,
    ADD COLUMN IF NOT EXISTS "provider_product_id" TEXT,
    ADD COLUMN IF NOT EXISTS "provider_entitlement_key" TEXT,
    ADD COLUMN IF NOT EXISTS "provider_environment" TEXT,
    ADD COLUMN IF NOT EXISTS "is_trial" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "trial_starts_at" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "cancel_at_period_end" BOOLEAN,
    ADD COLUMN IF NOT EXISTS "canceled_at" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "ends_at" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "last_synced_at" TIMESTAMP(3);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'household_subscriptions_household_id_fkey'
    ) THEN
        ALTER TABLE "household_subscriptions"
            ADD CONSTRAINT "household_subscriptions_household_id_fkey"
            FOREIGN KEY ("household_id") REFERENCES "households"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'household_subscriptions_purchaser_user_id_fkey'
    ) THEN
        ALTER TABLE "household_subscriptions"
            ADD CONSTRAINT "household_subscriptions_purchaser_user_id_fkey"
            FOREIGN KEY ("purchaser_user_id") REFERENCES "users"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "household_subscriptions_household_id_status_idx"
    ON "household_subscriptions"("household_id", "status");
CREATE INDEX IF NOT EXISTS "household_subscriptions_household_id_current_period_ends_at_idx"
    ON "household_subscriptions"("household_id", "current_period_ends_at");
CREATE INDEX IF NOT EXISTS "household_subscriptions_provider_provider_customer_id_idx"
    ON "household_subscriptions"("provider", "provider_customer_id");
CREATE INDEX IF NOT EXISTS "household_subscriptions_provider_provider_app_user_id_idx"
    ON "household_subscriptions"("provider", "provider_app_user_id");
CREATE INDEX IF NOT EXISTS "household_subscriptions_purchaser_user_id_idx"
    ON "household_subscriptions"("purchaser_user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "household_subscriptions_provider_provider_subscription_id_key"
    ON "household_subscriptions"("provider", "provider_subscription_id");

-- household_entitlement_overrides ------------------------------------------
CREATE TABLE IF NOT EXISTS "household_entitlement_overrides" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL,
    "reason" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_entitlement_overrides_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "household_entitlement_overrides"
    ADD COLUMN IF NOT EXISTS "reason" TEXT,
    ADD COLUMN IF NOT EXISTS "expires_at" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "household_entitlement_overrides_household_id_expires_at_idx"
    ON "household_entitlement_overrides"("household_id", "expires_at");
CREATE UNIQUE INDEX IF NOT EXISTS "household_entitlement_overrides_household_id_key_key"
    ON "household_entitlement_overrides"("household_id", "key");

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'household_entitlements'
    ) THEN
        INSERT INTO "household_entitlement_overrides" (
            "id",
            "household_id",
            "key",
            "is_enabled",
            "source",
            "created_at",
            "updated_at"
        )
        SELECT
            "id",
            "household_id",
            "key",
            "is_enabled",
            "source",
            "created_at",
            "updated_at"
        FROM "household_entitlements"
        ON CONFLICT ("household_id", "key") DO UPDATE
        SET
            "is_enabled" = EXCLUDED."is_enabled",
            "source" = EXCLUDED."source",
            "updated_at" = EXCLUDED."updated_at";

        DROP TABLE "household_entitlements";
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'household_entitlement_overrides_household_id_fkey'
    ) THEN
        ALTER TABLE "household_entitlement_overrides"
            ADD CONSTRAINT "household_entitlement_overrides_household_id_fkey"
            FOREIGN KEY ("household_id") REFERENCES "households"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "household_entitlement_overrides_household_id_expires_at_idx"
    ON "household_entitlement_overrides"("household_id", "expires_at");
CREATE UNIQUE INDEX IF NOT EXISTS "household_entitlement_overrides_household_id_key_key"
    ON "household_entitlement_overrides"("household_id", "key");

-- billing_provider_events ---------------------------------------------------
CREATE TABLE IF NOT EXISTS "billing_provider_events" (
    "id" TEXT NOT NULL,
    "household_id" TEXT,
    "provider" TEXT NOT NULL,
    "provider_event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "provider_app_user_id" TEXT,
    "provider_customer_id" TEXT,
    "provider_subscription_id" TEXT,
    "payload" JSONB NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "processing_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "billing_provider_events_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'billing_provider_events_household_id_fkey'
    ) THEN
        ALTER TABLE "billing_provider_events"
            ADD CONSTRAINT "billing_provider_events_household_id_fkey"
            FOREIGN KEY ("household_id") REFERENCES "households"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "billing_provider_events_household_id_received_at_idx"
    ON "billing_provider_events"("household_id", "received_at");
CREATE INDEX IF NOT EXISTS "billing_provider_events_provider_processed_at_idx"
    ON "billing_provider_events"("provider", "processed_at");
CREATE UNIQUE INDEX IF NOT EXISTS "billing_provider_events_provider_provider_event_id_key"
    ON "billing_provider_events"("provider", "provider_event_id");
