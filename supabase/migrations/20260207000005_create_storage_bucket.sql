-- Create the 'images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the bucket
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'images' );

-- Allow authenticated users to upload files
DROP POLICY IF EXISTS "Authenticated Users Insert" ON storage.objects;
CREATE POLICY "Authenticated Users Insert" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'images' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update files
DROP POLICY IF EXISTS "Authenticated Users Update" ON storage.objects;
CREATE POLICY "Authenticated Users Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'images' AND auth.role() = 'authenticated' );

-- Allow authenticated users to delete files
DROP POLICY IF EXISTS "Authenticated Users Delete" ON storage.objects;
CREATE POLICY "Authenticated Users Delete" ON storage.objects FOR DELETE USING ( bucket_id = 'images' AND auth.role() = 'authenticated' );
