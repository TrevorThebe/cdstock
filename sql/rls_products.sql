-- Enable RLS if not already enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert/update
CREATE POLICY "Allow insert/update for authenticated users"
  ON products
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
