-- Migration: Add subscription_status to users table
ALTER TABLE "users" ADD COLUMN "subscription_status" varchar DEFAULT 'free';

-- Update existing users to have 'free' subscription status
UPDATE "users" SET "subscription_status" = 'free' WHERE "subscription_status" IS NULL; 