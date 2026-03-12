-- Migration: Add email/password authentication fields
-- This adds support for email/password authentication alongside Google OAuth

-- Add password and email verification columns to users table
ALTER TABLE "users" 
  ADD COLUMN IF NOT EXISTS "password_hash" TEXT,
  ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "email_verification_token" TEXT,
  ADD COLUMN IF NOT EXISTS "email_verification_token_expiry" TIMESTAMP(3);

-- Create index on email_verification_token for faster lookups
CREATE INDEX IF NOT EXISTS "users_email_verification_token_idx" ON "users"("email_verification_token");

-- Update existing Google OAuth users to have email_verified = true
UPDATE "users" 
SET "email_verified" = true 
WHERE "google_id" IS NOT NULL AND "email_verified" = false;
