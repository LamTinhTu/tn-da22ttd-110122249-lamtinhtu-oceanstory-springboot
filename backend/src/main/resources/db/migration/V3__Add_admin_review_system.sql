-- Migration: Add admin_notes column to stories table
-- Add adminNotes field for storing admin review comments

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stories' AND column_name = 'admin_notes') THEN
    ALTER TABLE stories ADD COLUMN admin_notes TEXT;
  END IF;
END $$;

-- Create admin account: kiemduyet / Kiemduyet@12345678
-- Note: This account needs to be created via:
-- POST /api/auth/register
-- {
--   "username": "kiemduyet",
--   "email": "kiemduyet@ocean.local",
--   "password": "Kiemduyet@12345678"
-- }
-- Then run this to set role to ADMIN:
-- UPDATE users SET role = 'ADMIN' WHERE username = 'kiemduyet';

COMMIT;
