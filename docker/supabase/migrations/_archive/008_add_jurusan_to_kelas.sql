-- ============================================
-- School AI Database Migration
-- Version: 008 - Add Jurusan to Kelas
-- ============================================

-- Add jurusan column to kelas table
ALTER TABLE public.kelas 
ADD COLUMN IF NOT EXISTS jurusan VARCHAR(50);

-- Update comment
COMMENT ON COLUMN public.kelas.jurusan IS 'Jurusan/Peminatan (e.g., IPA, IPS, RPL, TKJ)';
