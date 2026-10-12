-- ============================================
-- School AI Database Migration
-- Version: 003 - Add Password & Sample Users
-- ============================================

-- Add password_hash column to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- ============================================
-- Create Sample Users for All Roles
-- ============================================

-- Admin (already exists, just update password)
-- Password: admin123
UPDATE public.users 
SET password_hash = crypt('admin123', gen_salt('bf'))
WHERE email = 'admin@school.ai';

-- Create Guru users
INSERT INTO public.users (email, full_name, phone, is_active, password_hash) VALUES
    ('guru1@school.ai', 'Budi Santoso', '081234567891', true, crypt('guru123', gen_salt('bf'))),
    ('guru2@school.ai', 'Siti Rahayu', '081234567892', true, crypt('guru123', gen_salt('bf'))),
    ('guru3@school.ai', 'Ahmad Wijaya', '081234567893', true, crypt('guru123', gen_salt('bf')))
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Create guru profiles
INSERT INTO public.guru (user_id, nip, bidang_studi, tanggal_bergabung, status)
SELECT u.id, 
    CASE u.email 
        WHEN 'guru1@school.ai' THEN '198501012010011001'
        WHEN 'guru2@school.ai' THEN '198601012011012002'
        WHEN 'guru3@school.ai' THEN '198701012012011003'
    END,
    CASE u.email 
        WHEN 'guru1@school.ai' THEN 'Matematika'
        WHEN 'guru2@school.ai' THEN 'Bahasa Indonesia'
        WHEN 'guru3@school.ai' THEN 'Fisika'
    END,
    '2020-01-01',
    'aktif'
FROM public.users u
WHERE u.email IN ('guru1@school.ai', 'guru2@school.ai', 'guru3@school.ai')
ON CONFLICT (user_id) DO NOTHING;

-- Assign guru role
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u, public.roles r
WHERE u.email IN ('guru1@school.ai', 'guru2@school.ai', 'guru3@school.ai')
  AND r.name = 'guru'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign wali_kelas role to guru1 (will be wali kelas X IPA 1)
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u, public.roles r
WHERE u.email = 'guru1@school.ai'
  AND r.name = 'wali_kelas'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Update kelas to assign wali kelas
UPDATE public.kelas 
SET wali_kelas_id = (SELECT id FROM public.users WHERE email = 'guru1@school.ai')
WHERE nama = 'X IPA 1';

-- ============================================
-- Create Siswa users
-- ============================================
INSERT INTO public.users (email, full_name, phone, is_active, password_hash) VALUES
    ('siswa1@school.ai', 'Andi Pratama', '081234567801', true, crypt('siswa123', gen_salt('bf'))),
    ('siswa2@school.ai', 'Dewi Lestari', '081234567802', true, crypt('siswa123', gen_salt('bf'))),
    ('siswa3@school.ai', 'Rizki Ramadhan', '081234567803', true, crypt('siswa123', gen_salt('bf'))),
    ('siswa4@school.ai', 'Maya Sari', '081234567804', true, crypt('siswa123', gen_salt('bf'))),
    ('siswa5@school.ai', 'Fajar Nugroho', '081234567805', true, crypt('siswa123', gen_salt('bf')))
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Create siswa profiles
INSERT INTO public.siswa (user_id, nis, nisn, kelas_id, tanggal_lahir, jenis_kelamin, status)
SELECT u.id,
    CASE u.email 
        WHEN 'siswa1@school.ai' THEN '2024001'
        WHEN 'siswa2@school.ai' THEN '2024002'
        WHEN 'siswa3@school.ai' THEN '2024003'
        WHEN 'siswa4@school.ai' THEN '2024004'
        WHEN 'siswa5@school.ai' THEN '2024005'
    END,
    CASE u.email 
        WHEN 'siswa1@school.ai' THEN '0012345678901'
        WHEN 'siswa2@school.ai' THEN '0012345678902'
        WHEN 'siswa3@school.ai' THEN '0012345678903'
        WHEN 'siswa4@school.ai' THEN '0012345678904'
        WHEN 'siswa5@school.ai' THEN '0012345678905'
    END,
    (SELECT id FROM public.kelas WHERE nama = 'X IPA 1'),
    CASE u.email 
        WHEN 'siswa1@school.ai' THEN '2008-05-15'
        WHEN 'siswa2@school.ai' THEN '2008-08-20'
        WHEN 'siswa3@school.ai' THEN '2008-03-10'
        WHEN 'siswa4@school.ai' THEN '2008-11-25'
        WHEN 'siswa5@school.ai' THEN '2008-07-30'
    END::DATE,
    CASE u.email 
        WHEN 'siswa1@school.ai' THEN 'L'
        WHEN 'siswa2@school.ai' THEN 'P'
        WHEN 'siswa3@school.ai' THEN 'L'
        WHEN 'siswa4@school.ai' THEN 'P'
        WHEN 'siswa5@school.ai' THEN 'L'
    END,
    'aktif'
FROM public.users u
WHERE u.email IN ('siswa1@school.ai', 'siswa2@school.ai', 'siswa3@school.ai', 'siswa4@school.ai', 'siswa5@school.ai')
ON CONFLICT (user_id) DO NOTHING;

-- Assign siswa role
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u, public.roles r
WHERE u.email LIKE 'siswa%@school.ai'
  AND r.name = 'siswa'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Assign ketua_kelas role to siswa1
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u, public.roles r
WHERE u.email = 'siswa1@school.ai'
  AND r.name = 'ketua_kelas'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Update kelas to assign ketua kelas
UPDATE public.kelas 
SET ketua_kelas_id = (SELECT id FROM public.users WHERE email = 'siswa1@school.ai')
WHERE nama = 'X IPA 1';

-- ============================================
-- Create Wali Murid users
-- ============================================
INSERT INTO public.users (email, full_name, phone, is_active, password_hash) VALUES
    ('walimurid1@school.ai', 'Pak Pratama', '081234567701', true, crypt('wali123', gen_salt('bf'))),
    ('walimurid2@school.ai', 'Bu Lestari', '081234567702', true, crypt('wali123', gen_salt('bf')))
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Create wali murid profiles
INSERT INTO public.wali_murid (user_id, pekerjaan, hubungan)
SELECT u.id,
    CASE u.email 
        WHEN 'walimurid1@school.ai' THEN 'Wiraswasta'
        WHEN 'walimurid2@school.ai' THEN 'PNS'
    END,
    CASE u.email 
        WHEN 'walimurid1@school.ai' THEN 'Ayah'
        WHEN 'walimurid2@school.ai' THEN 'Ibu'
    END
FROM public.users u
WHERE u.email IN ('walimurid1@school.ai', 'walimurid2@school.ai')
ON CONFLICT (user_id) DO NOTHING;

-- Assign wali_murid role
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u, public.roles r
WHERE u.email LIKE 'walimurid%@school.ai'
  AND r.name = 'wali_murid'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Link wali murid to siswa
INSERT INTO public.siswa_wali (siswa_id, wali_id, is_primary)
SELECT s.id, w.id, true
FROM public.siswa s
JOIN public.users su ON s.user_id = su.id
JOIN public.wali_murid w ON true
JOIN public.users wu ON w.user_id = wu.id
WHERE (su.email = 'siswa1@school.ai' AND wu.email = 'walimurid1@school.ai')
   OR (su.email = 'siswa2@school.ai' AND wu.email = 'walimurid2@school.ai')
ON CONFLICT (siswa_id, wali_id) DO NOTHING;

-- ============================================
-- Create TU (Tata Usaha) user
-- ============================================
INSERT INTO public.users (email, full_name, phone, is_active, password_hash) VALUES
    ('tu@school.ai', 'Dewi Kusuma', '081234567601', true, crypt('tu123', gen_salt('bf')))
ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Assign TU role
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u, public.roles r
WHERE u.email = 'tu@school.ai'
  AND r.name = 'tu'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ============================================
-- Create Sample Schedules
-- ============================================
INSERT INTO public.schedules (kelas_id, mata_pelajaran_id, guru_id, hari, jam_mulai, jam_selesai, ruangan, tahun_ajaran_id)
SELECT 
    k.id,
    mp.id,
    g.id,
    day_num,
    start_time::TIME,
    end_time::TIME,
    'Ruang ' || k.nama,
    ta.id
FROM public.kelas k
CROSS JOIN (
    VALUES 
        (1, '07:30', '08:15', 'MTK'),
        (1, '08:15', '09:00', 'BIN'),
        (1, '09:15', '10:00', 'BIG'),
        (2, '07:30', '08:15', 'FIS'),
        (2, '08:15', '09:00', 'MTK'),
        (2, '09:15', '10:00', 'BIN'),
        (3, '07:30', '08:15', 'BIG'),
        (3, '08:15', '09:00', 'FIS'),
        (3, '09:15', '10:00', 'MTK')
) AS schedule(day_num, start_time, end_time, mapel_kode)
JOIN public.mata_pelajaran mp ON mp.kode = schedule.mapel_kode
JOIN public.guru g ON (
    (mapel_kode = 'MTK' AND g.bidang_studi = 'Matematika') OR
    (mapel_kode IN ('BIN', 'BIG') AND g.bidang_studi = 'Bahasa Indonesia') OR
    (mapel_kode = 'FIS' AND g.bidang_studi = 'Fisika')
)
JOIN public.tahun_ajaran ta ON ta.is_active = true
WHERE k.nama = 'X IPA 1'
ON CONFLICT DO NOTHING;

-- ============================================
-- Create Sample Attendance (today)
-- ============================================
INSERT INTO public.attendances (siswa_id, schedule_id, tanggal, status, waktu_hadir, input_by)
SELECT 
    s.id,
    sch.id,
    CURRENT_DATE,
    CASE (random() * 10)::int % 4
        WHEN 0 THEN 'hadir'
        WHEN 1 THEN 'hadir'
        WHEN 2 THEN 'hadir'
        WHEN 3 THEN 'izin'
    END,
    CASE WHEN (random() * 10)::int % 4 != 3 THEN NOW() ELSE NULL END,
    (SELECT id FROM public.users WHERE email = 'guru1@school.ai')
FROM public.siswa s
CROSS JOIN (
    SELECT id FROM public.schedules 
    WHERE kelas_id = (SELECT id FROM public.kelas WHERE nama = 'X IPA 1')
    LIMIT 3
) sch
WHERE s.kelas_id = (SELECT id FROM public.kelas WHERE nama = 'X IPA 1')
ON CONFLICT (siswa_id, schedule_id, tanggal) DO NOTHING;

-- ============================================
-- Create Sample Invoices
-- ============================================
INSERT INTO public.invoices (siswa_id, payment_type_id, bulan, tahun, nominal, status, jatuh_tempo)
SELECT 
    s.id,
    pt.id,
    1, -- Januari
    2026,
    pt.nominal_default,
    'unpaid',
    '2026-01-15'
FROM public.siswa s
CROSS JOIN public.payment_types pt
WHERE s.kelas_id = (SELECT id FROM public.kelas WHERE nama = 'X IPA 1')
  AND pt.nama = 'SPP'
ON CONFLICT DO NOTHING;

COMMIT;
