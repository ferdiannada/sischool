-- ============================================
-- Seed Guru Profiles
-- Creates profile entries for users with 'guru' role
-- ============================================

-- Insert Guru Profile for Guru Demo
INSERT INTO public.guru (user_id, nip, bidang_studi, status)
VALUES 
    ('00000000-0000-0000-0000-000000000002', '198001012010011001', 'Matematika', 'aktif')
ON CONFLICT (user_id) DO NOTHING;

-- Insert Guru Profile for Wali Kelas Demo (also a teacher)
INSERT INTO public.guru (user_id, nip, bidang_studi, status)
VALUES 
    ('00000000-0000-0000-0000-000000000005', '198502022010011002', 'Bahasa Indonesia', 'aktif')
ON CONFLICT (user_id) DO NOTHING;
