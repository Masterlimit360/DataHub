-- Migration: Add 'cancelled' status to orders table
-- Run this on your Supabase/PostgreSQL database to add the cancelled status

-- Step 1: Drop the existing CHECK constraint on the status column
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Step 2: Add the updated CHECK constraint that includes 'cancelled'
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'paid', 'processing', 'delivered', 'failed', 'refunded', 'cancelled'));

-- Verify: Check if any pending orders exist that should be cancelled
-- (Optional) You can run this to see stale pending orders older than 1 hour:
-- SELECT id, phone_number, payment_reference, amount_ghs, created_at 
-- FROM orders 
-- WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 hour';
