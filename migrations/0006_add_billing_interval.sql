-- Migration: Add billing_interval to users table
ALTER TABLE "users" ADD COLUMN "billing_interval" varchar DEFAULT 'monthly';

-- Update existing users to have 'monthly' billing interval
UPDATE "users" SET "billing_interval" = 'monthly' WHERE "billing_interval" IS NULL; 