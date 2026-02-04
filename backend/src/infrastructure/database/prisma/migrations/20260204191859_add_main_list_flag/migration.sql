-- AlterTable
ALTER TABLE "shopping_lists" ADD COLUMN     "is_main" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "shopping_lists_household_id_is_main_idx" ON "shopping_lists"("household_id", "is_main");
