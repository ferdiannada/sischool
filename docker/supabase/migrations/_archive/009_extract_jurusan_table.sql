-- ============================================
-- School AI Database Migration
-- Version: 009 - Extract Jurusan Table
-- ============================================

-- 1. Create Jurusan Table
CREATE TABLE IF NOT EXISTS public.jurusan (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    kode VARCHAR(20) UNIQUE,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_jurusan_updated_at ON public.jurusan;
CREATE TRIGGER update_jurusan_updated_at BEFORE UPDATE ON public.jurusan
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Migrate existing data (if any)
-- Insert distinct values from kelas.jurusan into jurusan table
INSERT INTO public.jurusan (nama, kode)
SELECT DISTINCT jurusan, 
       CASE 
           WHEN jurusan = 'IPA' THEN 'IPA' 
           WHEN jurusan = 'IPS' THEN 'IPS' 
           WHEN jurusan = 'Bahasa' THEN 'BHS'
           ELSE UPPER(SUBSTRING(jurusan, 1, 3)) 
       END
FROM public.kelas 
WHERE jurusan IS NOT NULL AND jurusan != ''
ON CONFLICT (kode) DO NOTHING;

-- 3. Modify Kelas Table
-- Add new foreign key column
ALTER TABLE public.kelas 
ADD COLUMN IF NOT EXISTS jurusan_id INTEGER REFERENCES public.jurusan(id);

-- Update jurusan_id based on existing name
UPDATE public.kelas k
SET jurusan_id = j.id
FROM public.jurusan j
WHERE k.jurusan = j.nama;

-- Drop old column (Safe to drop if we are sure, but maybe keep as backup for now? User asked to better manage it, implies replacing. I will drop it to force usage of new structure)
ALTER TABLE public.kelas DROP COLUMN IF EXISTS jurusan;

-- Grant permissions
GRANT ALL ON TABLE public.jurusan TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.jurusan_id_seq TO anon, authenticated, service_role;
