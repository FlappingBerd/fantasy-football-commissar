-- Set up storage policies for the recaps bucket
-- Run this in your Supabase SQL Editor

-- Allow public read access to recaps bucket
CREATE POLICY "Allow public read access to recaps" ON storage.objects
FOR SELECT USING (bucket_id = 'recaps');

-- Allow public insert to recaps bucket
CREATE POLICY "Allow public insert to recaps" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'recaps');

-- Allow public update to recaps bucket
CREATE POLICY "Allow public update to recaps" ON storage.objects
FOR UPDATE USING (bucket_id = 'recaps');

-- Allow public delete from recaps bucket
CREATE POLICY "Allow public delete from recaps" ON storage.objects
FOR DELETE USING (bucket_id = 'recaps'); 