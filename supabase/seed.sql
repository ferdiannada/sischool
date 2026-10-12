-- Seed Data for School AI Application
-- ==============================================================

-- =====================================================
-- ROLES
-- =====================================================
INSERT INTO public.roles (id, name, description) VALUES
    (1, 'admin', 'Administrator sistem dengan akses penuh'),
    (2, 'tu', 'Tata Usaha - mengelola administrasi sekolah'),
    (3, 'guru', 'Guru mata pelajaran'),
    (4, 'wali_kelas', 'Wali kelas - guru yang bertanggung jawab atas kelas'),
    (5, 'siswa', 'Siswa/Pelajar'),
    (6, 'wali_murid', 'Orang tua/Wali dari siswa'),
    (7, 'ketua_kelas', 'Ketua kelas - siswa yang dipilih sebagai pemimpin kelas')
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to continue after last inserted id
SELECT setval('public.roles_id_seq', (SELECT MAX(id) FROM public.roles));

-- =====================================================
-- JURUSAN (Majors/Departments)
-- =====================================================
INSERT INTO public.jurusan (id, nama, kode, deskripsi, is_active) VALUES
    (1, 'Ilmu Pengetahuan Alam', 'IPA', 'Jurusan yang fokus pada mata pelajaran sains seperti Fisika, Kimia, dan Biologi', true),
    (2, 'Ilmu Pengetahuan Sosial', 'IPS', 'Jurusan yang fokus pada mata pelajaran sosial seperti Ekonomi, Geografi, dan Sosiologi', true),
    (3, 'Bahasa dan Sastra', 'BAHASA', 'Jurusan yang fokus pada mata pelajaran bahasa dan sastra', true),
    (4, 'Teknik Komputer dan Jaringan', 'TKJ', 'Jurusan kejuruan yang fokus pada teknologi komputer dan jaringan', true),
    (5, 'Rekayasa Perangkat Lunak', 'RPL', 'Jurusan kejuruan yang fokus pada pengembangan perangkat lunak', true),
    (6, 'Multimedia', 'MM', 'Jurusan kejuruan yang fokus pada desain grafis dan multimedia', true),
    (7, 'Akuntansi', 'AKT', 'Jurusan kejuruan yang fokus pada akuntansi dan keuangan', true),
    (8, 'Administrasi Perkantoran', 'AP', 'Jurusan kejuruan yang fokus pada administrasi dan kesekretariatan', true)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence
SELECT setval('public.jurusan_id_seq', (SELECT MAX(id) FROM public.jurusan));

-- =====================================================
-- MATA PELAJARAN (Subjects)
-- =====================================================
INSERT INTO public.mata_pelajaran (id, kode, nama, deskripsi, is_active) VALUES
    -- Mata Pelajaran Umum
    (1, 'MTK', 'Matematika', 'Ilmu tentang bilangan, struktur, ruang, dan perubahan', true),
    (2, 'BIN', 'Bahasa Indonesia', 'Mata pelajaran bahasa nasional Indonesia', true),
    (3, 'BIG', 'Bahasa Inggris', 'Mata pelajaran bahasa internasional', true),
    (4, 'PKN', 'Pendidikan Kewarganegaraan', 'Pendidikan tentang kewarganegaraan dan Pancasila', true),
    (5, 'PAI', 'Pendidikan Agama Islam', 'Pendidikan agama Islam', true),
    (6, 'SBK', 'Seni Budaya dan Keterampilan', 'Mata pelajaran seni dan kreativitas', true),
    (7, 'PJK', 'Pendidikan Jasmani dan Kesehatan', 'Pendidikan olahraga dan kesehatan', true),
    (8, 'SEJ', 'Sejarah', 'Ilmu tentang peristiwa masa lalu', true),
    
    -- Mata Pelajaran IPA
    (9, 'FIS', 'Fisika', 'Ilmu tentang materi, energi, dan interaksinya', true),
    (10, 'KIM', 'Kimia', 'Ilmu tentang struktur, komposisi, dan sifat zat', true),
    (11, 'BIO', 'Biologi', 'Ilmu tentang makhluk hidup', true),
    
    -- Mata Pelajaran IPS
    (12, 'EKO', 'Ekonomi', 'Ilmu tentang produksi, distribusi, dan konsumsi', true),
    (13, 'GEO', 'Geografi', 'Ilmu tentang bumi dan lingkungannya', true),
    (14, 'SOS', 'Sosiologi', 'Ilmu tentang masyarakat dan perilaku sosial', true),
    
    -- Mata Pelajaran Kejuruan TKJ/RPL
    (15, 'DKK', 'Dasar Kompetensi Kejuruan', 'Dasar-dasar kompetensi kejuruan', true),
    (16, 'KJD', 'Komputer dan Jaringan Dasar', 'Dasar-dasar komputer dan jaringan', true),
    (17, 'PBD', 'Pemrograman Dasar', 'Dasar-dasar pemrograman komputer', true),
    (18, 'DDG', 'Desain Grafis', 'Desain visual dan grafis komputer', true),
    (19, 'PBO', 'Pemrograman Berorientasi Objek', 'Pemrograman dengan paradigma OOP', true),
    (20, 'PBW', 'Pemrograman Web', 'Pengembangan aplikasi berbasis web', true),
    (21, 'BJR', 'Administrasi Infrastruktur Jaringan', 'Pengelolaan infrastruktur jaringan', true),
    (22, 'ASJ', 'Administrasi Sistem Jaringan', 'Pengelolaan sistem jaringan komputer', true)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence
SELECT setval('public.mata_pelajaran_id_seq', (SELECT MAX(id) FROM public.mata_pelajaran));
