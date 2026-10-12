-- Create jam_pelajaran table for managing time slots
CREATE TABLE IF NOT EXISTS public.jam_pelajaran (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    urutan INTEGER NOT NULL,
    waktu_mulai TIME NOT NULL,
    waktu_selesai TIME NOT NULL,
    keterangan TEXT,
    is_istirahat BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add unique constraint on urutan to prevent duplicates
ALTER TABLE public.jam_pelajaran ADD CONSTRAINT jam_pelajaran_urutan_key UNIQUE (urutan);

-- Insert default time slots (Example based on image, though flexible)
INSERT INTO public.jam_pelajaran (urutan, waktu_mulai, waktu_selesai, keterangan, is_istirahat) VALUES
(1, '07:00', '07:45', 'Jam Ke-1', false),
(2, '07:45', '08:30', 'Jam Ke-2', false),
(3, '08:30', '09:15', 'Jam Ke-3', false),
(4, '09:15', '10:00', 'Jam Ke-4', false),
(5, '10:00', '10:15', 'Istirahat', true),
(6, '10:15', '11:00', 'Jam Ke-5', false),
(7, '11:00', '11:45', 'Jam Ke-6', false),
(8, '11:45', '12:30', 'Istirahat Sholat', true),
(9, '12:30', '13:15', 'Jam Ke-7', false),
(10, '13:15', '14:00', 'Jam Ke-8', false)
ON CONFLICT (urutan) DO NOTHING;

-- Enable RLS
ALTER TABLE public.jam_pelajaran ENABLE ROW LEVEL SECURITY;

-- Create policy for read access (all users)
CREATE POLICY "Enable read access for all users" ON public.jam_pelajaran
    FOR SELECT USING (true);

-- Create policy for write access (admin and tu only)
CREATE POLICY "Enable write access for admin and tu" ON public.jam_pelajaran
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = (current_setting('request.jwt.claim.sub', true)::uuid) AND r.name IN ('admin', 'tu')
        )
    );
