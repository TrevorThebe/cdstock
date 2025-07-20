-- Add sender_id column to notifications table if missing
ALTER TABLE notifications
ADD COLUMN sender_id uuid;

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert if user is sender or recipient
CREATE POLICY "Allow insert for sender or recipient"
  ON notifications
  FOR INSERT
  USING (
    auth.uid() = user_id OR auth.uid() = sender_id
  );
