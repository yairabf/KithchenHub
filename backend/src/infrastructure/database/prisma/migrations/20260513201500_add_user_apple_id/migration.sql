-- Add Sign in with Apple provider identifier for Apple App Review compliance.
ALTER TABLE "users" ADD COLUMN "apple_id" TEXT;

CREATE UNIQUE INDEX "users_apple_id_key" ON "users"("apple_id");
