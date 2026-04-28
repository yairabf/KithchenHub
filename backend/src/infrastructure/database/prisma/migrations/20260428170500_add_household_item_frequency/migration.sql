-- CreateTable
CREATE TABLE "household_item_frequency" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "identity_key" TEXT NOT NULL,
    "catalog_item_id" TEXT,
    "custom_item_id" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "image" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "add_event_count" INTEGER NOT NULL DEFAULT 0,
    "quantity_bonus_count" INTEGER NOT NULL DEFAULT 0,
    "manual_quantity_increase_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "household_item_frequency_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "household_item_frequency_household_id_identity_key_key"
    ON "household_item_frequency"("household_id", "identity_key");

-- CreateIndex
CREATE INDEX "household_item_frequency_household_id_score_idx"
    ON "household_item_frequency"("household_id", "score");

-- CreateIndex
CREATE INDEX "household_item_frequency_catalog_item_id_idx"
    ON "household_item_frequency"("catalog_item_id");

-- CreateIndex
CREATE INDEX "household_item_frequency_custom_item_id_idx"
    ON "household_item_frequency"("custom_item_id");

-- AddForeignKey
ALTER TABLE "household_item_frequency"
    ADD CONSTRAINT "household_item_frequency_household_id_fkey"
    FOREIGN KEY ("household_id") REFERENCES "households"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_item_frequency"
    ADD CONSTRAINT "household_item_frequency_catalog_item_id_fkey"
    FOREIGN KEY ("catalog_item_id") REFERENCES "master_grocery_catalog"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_item_frequency"
    ADD CONSTRAINT "household_item_frequency_custom_item_id_fkey"
    FOREIGN KEY ("custom_item_id") REFERENCES "custom_items"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddConstraint
ALTER TABLE "household_item_frequency"
    ADD CONSTRAINT "household_item_frequency_identity_check"
    CHECK (
        (CASE WHEN "catalog_item_id" IS NULL THEN 0 ELSE 1 END) +
        (CASE WHEN "custom_item_id" IS NULL THEN 0 ELSE 1 END) = 1
    );
