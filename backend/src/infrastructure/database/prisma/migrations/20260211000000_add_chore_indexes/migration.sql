-- CreateIndex
CREATE INDEX "chores_household_id_idx" ON "chores"("household_id");

-- CreateIndex
CREATE INDEX "chores_household_id_deleted_at_idx" ON "chores"("household_id", "deleted_at");

-- CreateIndex
CREATE INDEX "chores_household_id_is_completed_deleted_at_idx" ON "chores"("household_id", "is_completed", "deleted_at");

-- CreateIndex
CREATE INDEX "chores_due_date_idx" ON "chores"("due_date");

-- CreateIndex
CREATE INDEX "chores_assignee_id_idx" ON "chores"("assignee_id");
