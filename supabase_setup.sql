-- 1. Add the infographic_url column to the posts table
-- This adds the column if it doesn't exist
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS infographic_url text;

-- 2. Create the 'post-images' storage bucket
-- This attempts to insert the bucket. If it exists, it does nothing (safe-ish).
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Set up Storage Security Policies (Row Level Security)

-- Policy: Allow Public Read Access
-- Anyone can view the images
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'post-images' );

-- Policy: Allow Authenticated Uploads
-- Only logged-in users can upload images
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'post-images' );

-- Policy: Allow Authenticated Updates/Deletes (Optional, if you want overwrite/delete support)
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'post-images' );

DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'post-images' );
