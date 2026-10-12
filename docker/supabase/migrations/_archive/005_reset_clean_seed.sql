-- ============================================
-- School AI Database - Clean Seed Data
-- Only creates users for each role, no other data
-- ============================================

-- ============================================
-- TRUNCATE ALL DATA TABLES (preserve schema)
-- ============================================
TRUNCATE TABLE public.notification_recipients CASCADE;
TRUNCATE TABLE public.notifications CASCADE;
TRUNCATE TABLE public.payments CASCADE;
TRUNCATE TABLE public.invoices CASCADE;
TRUNCATE TABLE public.expenses CASCADE;
TRUNCATE TABLE public.attendances CASCADE;
TRUNCATE TABLE public.attendance_daily_summary CASCADE;
TRUNCATE TABLE public.schedules CASCADE;
TRUNCATE TABLE public.siswa_wali CASCADE;
TRUNCATE TABLE public.wali_murid CASCADE;
TRUNCATE TABLE public.siswa CASCADE;
TRUNCATE TABLE public.guru CASCADE;
TRUNCATE TABLE public.kelas CASCADE;
TRUNCATE TABLE public.user_roles CASCADE;
TRUNCATE TABLE public.users CASCADE;
TRUNCATE TABLE public.tahun_ajaran CASCADE;
TRUNCATE TABLE public.mata_pelajaran CASCADE;
TRUNCATE TABLE public.payment_types CASCADE;

-- ============================================
-- ONLY CREATE USERS FOR EACH ROLE
-- ============================================

-- Admin User (password: admin123)
INSERT INTO public.users (id, email, full_name, phone, is_active, password_hash) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@school.ai', 'Administrator', '081234567890', true, crypt('admin123', gen_salt('bf')));

-- Guru User (password: guru123)
INSERT INTO public.users (id, email, full_name, phone, is_active, password_hash) VALUES
    ('00000000-0000-0000-0000-000000000002', 'guru@school.ai', 'Guru Demo', '081234567891', true, crypt('guru123', gen_salt('bf')));

-- Siswa User (password: siswa123)
INSERT INTO public.users (id, email, full_name, phone, is_active, password_hash) VALUES
    ('00000000-0000-0000-0000-000000000003', 'siswa@school.ai', 'Siswa Demo', '081234567892', true, crypt('siswa123', gen_salt('bf')));

-- TU User (password: tu123)
INSERT INTO public.users (id, email, full_name, phone, is_active, password_hash) VALUES
    ('00000000-0000-0000-0000-000000000004', 'tu@school.ai', 'Tata Usaha Demo', '081234567893', true, crypt('tu123', gen_salt('bf')));

-- Wali Kelas User (password: walikelas123)
INSERT INTO public.users (id, email, full_name, phone, is_active, password_hash) VALUES
    ('00000000-0000-0000-0000-000000000005', 'walikelas@school.ai', 'Wali Kelas Demo', '081234567894', true, crypt('walikelas123', gen_salt('bf')));

-- Wali Murid User (password: walimurid123)
INSERT INTO public.users (id, email, full_name, phone, is_active, password_hash) VALUES
    ('00000000-0000-0000-0000-000000000006', 'walimurid@school.ai', 'Wali Murid Demo', '081234567895', true, crypt('walimurid123', gen_salt('bf')));

-- Ketua Kelas User (password: ketuakelas123)
INSERT INTO public.users (id, email, full_name, phone, is_active, password_hash) VALUES
    ('00000000-0000-0000-0000-000000000007', 'ketuakelas@school.ai', 'Ketua Kelas Demo', '081234567896', true, crypt('ketuakelas123', gen_salt('bf')));

-- ============================================
-- ASSIGN ROLES TO USERS
-- ============================================

-- Admin role
INSERT INTO public.user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM public.roles WHERE name = 'admin';

-- Guru role
INSERT INTO public.user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM public.roles WHERE name = 'guru';

-- Siswa role
INSERT INTO public.user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000003', id FROM public.roles WHERE name = 'siswa';

-- TU role
INSERT INTO public.user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000004', id FROM public.roles WHERE name = 'tu';

-- Wali Kelas role (also has guru role)
INSERT INTO public.user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000005', id FROM public.roles WHERE name = 'guru';
INSERT INTO public.user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000005', id FROM public.roles WHERE name = 'wali_kelas';

-- Wali Murid role
INSERT INTO public.user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000006', id FROM public.roles WHERE name = 'wali_murid';

-- Ketua Kelas role (also has siswa role)
INSERT INTO public.user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000007', id FROM public.roles WHERE name = 'siswa';
INSERT INTO public.user_roles (user_id, role_id)
SELECT '00000000-0000-0000-0000-000000000007', id FROM public.roles WHERE name = 'ketua_kelas';

COMMIT;
