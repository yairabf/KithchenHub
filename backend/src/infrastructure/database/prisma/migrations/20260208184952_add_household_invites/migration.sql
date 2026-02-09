-- AlterTable
ALTER TABLE "users" ADD COLUMN     "joined_via_invite_id" TEXT;

-- CreateTable
CREATE TABLE "household_invites" (
    "id" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "creator_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "household_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "household_invites_code_key" ON "household_invites"("code");

-- CreateIndex
CREATE INDEX "household_invites_code_idx" ON "household_invites"("code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_joined_via_invite_id_fkey" FOREIGN KEY ("joined_via_invite_id") REFERENCES "household_invites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_invites" ADD CONSTRAINT "household_invites_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_invites" ADD CONSTRAINT "household_invites_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
