-- Disable RLS on the weekly_summaries bucket
-- Run this in your Supabase SQL Editor

-- First, create a policy that allows all operations for the weekly_summaries bucket
CREATE POLICY "Allow all operations on weekly_summaries" ON storage.objects
FOR ALL USING (bucket_id = 'weekly_summaries');

-- Alternative: Disable RLS entirely for this bucket (if the above doesn't work)
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Or create specific policies for each operation
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'weekly_summaries');

CREATE POLICY "Allow public insert" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'weekly_summaries');

CREATE POLICY "Allow public update" ON storage.objects
FOR UPDATE USING (bucket_id = 'weekly_summaries');

CREATE POLICY "Allow public delete" ON storage.objects
FOR DELETE USING (bucket_id = 'weekly_summaries'); 