-- CreateTable
CREATE TABLE "household_subscriptions" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "plan_key" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "provider" TEXT,
    "provider_customer_id" TEXT,
    "provider_subscription_id" TEXT,
    "trial_ends_at" TIMESTAMP(3),
    "current_period_starts_at" TIMESTAMP(3),
    "current_period_ends_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_entitlements" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "household_subscriptions_household_id_status_idx" ON "household_subscriptions"("household_id", "status");

-- CreateIndex
CREATE INDEX "household_subscriptions_household_id_updated_at_idx" ON "household_subscriptions"("household_id", "updated_at");

-- CreateIndex
CREATE INDEX "household_entitlements_household_id_idx" ON "household_entitlements"("household_id");

-- CreateIndex
CREATE UNIQUE INDEX "household_entitlements_household_id_key_key" ON "household_entitlements"("household_id", "key");

-- AddForeignKey
ALTER TABLE "household_subscriptions" ADD CONSTRAINT "household_subscriptions_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_entitlements" ADD CONSTRAINT "household_entitlements_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

