-- Supabase Storage: Create bucket for menu images
-- Run this in the Supabase SQL Editor AFTER schema.sql
-- 1. Create the storage bucket
INSERT INTO storage.buckets (
        id,
        name,
        public,
        file_size_limit,
        allowed_mime_types
    )
VALUES (
        'menu-images',
        'menu-images',
        true,
        5242880,
        -- 5MB max file size
        ARRAY ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    ) ON CONFLICT (id) DO NOTHING;
-- 2. Public read access (anyone can view menu images)
CREATE POLICY "Public read menu images" ON storage.objects FOR
SELECT USING (bucket_id = 'menu-images');
-- 3. Public upload (admin can upload images)
CREATE POLICY "Public upload menu images" ON storage.objects FOR
INSERT WITH CHECK (bucket_id = 'menu-images');
-- 4. Public update
CREATE POLICY "Public update menu images" ON storage.objects FOR
UPDATE USING (bucket_id = 'menu-images');
-- 5. Public delete
CREATE POLICY "Public delete menu images" ON storage.objects FOR DELETE USING (bucket_id = 'menu-images');