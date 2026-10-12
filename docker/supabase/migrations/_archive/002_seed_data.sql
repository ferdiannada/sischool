-- ============================================
-- School AI Database - Seed Data
-- Sample data for development/testing
-- ============================================

-- Insert sample tahun ajaran
INSERT INTO public.tahun_ajaran (nama, semester, tanggal_mulai, tanggal_selesai, is_active) VALUES
    ('2025/2026', 1, '2025-07-14', '2025-12-20', false),
    ('2025/2026', 2, '2026-01-06', '2026-06-20', true)
ON CONFLICT DO NOTHING;

-- Insert sample mata pelajaran
INSERT INTO public.mata_pelajaran (kode, nama, deskripsi) VALUES
    ('MTK', 'Matematika', 'Pelajaran Matematika'),
    ('BIN', 'Bahasa Indonesia', 'Pelajaran Bahasa Indonesia'),
    ('BIG', 'Bahasa Inggris', 'Pelajaran Bahasa Inggris'),
    ('FIS', 'Fisika', 'Pelajaran Fisika'),
    ('KIM', 'Kimia', 'Pelajaran Kimia'),
    ('BIO', 'Biologi', 'Pelajaran Biologi'),
    ('SEJ', 'Sejarah', 'Pelajaran Sejarah'),
    ('GEO', 'Geografi', 'Pelajaran Geografi'),
    ('EKO', 'Ekonomi', 'Pelajaran Ekonomi'),
    ('SOS', 'Sosiologi', 'Pelajaran Sosiologi'),
    ('PKN', 'Pendidikan Kewarganegaraan', 'Pelajaran PKN'),
    ('PAI', 'Pendidikan Agama Islam', 'Pelajaran Agama'),
    ('PJK', 'Pendidikan Jasmani', 'Pelajaran Olahraga'),
    ('SBK', 'Seni Budaya', 'Pelajaran Seni dan Budaya'),
    ('TIK', 'Teknologi Informasi', 'Pelajaran Komputer')
ON CONFLICT (kode) DO NOTHING;

-- Insert sample payment types
INSERT INTO public.payment_types (nama, deskripsi, nominal_default, is_recurring) VALUES
    ('SPP', 'Sumbangan Pembinaan Pendidikan', 500000.00, true),
    ('Uang Bangunan', 'Biaya pengembangan gedung', 2000000.00, false),
    ('Seragam', 'Biaya seragam sekolah', 750000.00, false),
    ('Kegiatan OSIS', 'Biaya kegiatan OSIS', 150000.00, false),
    ('Praktikum', 'Biaya praktikum laboratorium', 200000.00, true),
    ('Ujian', 'Biaya ujian semester', 100000.00, true)
ON CONFLICT DO NOTHING;

-- ============================================
-- Sample Admin User (password: admin123)
-- Note: In production, create users through Supabase Auth
-- ============================================
INSERT INTO public.users (id, email, full_name, phone, is_active) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@school.ai', 'Administrator', '081234567890', true)
ON CONFLICT (id) DO NOTHING;

-- Assign admin role
INSERT INTO public.user_roles (user_id, role_id) 
SELECT '00000000-0000-0000-0000-000000000001', id FROM public.roles WHERE name = 'admin'
ON CONFLICT DO NOTHING;

-- ============================================
-- Sample Classes
-- ============================================
INSERT INTO public.kelas (nama, tingkat, tahun_ajaran_id, kapasitas) VALUES
    ('X IPA 1', 10, 2, 36),
    ('X IPA 2', 10, 2, 36),
    ('X IPS 1', 10, 2, 36),
    ('XI IPA 1', 11, 2, 34),
    ('XI IPA 2', 11, 2, 34),
    ('XI IPS 1', 11, 2, 34),
    ('XII IPA 1', 12, 2, 32),
    ('XII IPA 2', 12, 2, 32),
    ('XII IPS 1', 12, 2, 32)
ON CONFLICT DO NOTHING;

COMMIT;
