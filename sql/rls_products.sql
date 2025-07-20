-- Add sender_id column to notifications table if missing
ALTER TABLE notifications
ADD COLUMN sender_id uuid;
