-- Seeder: Jam Pelajaran (Senin-Kamis & Jumat)
-- Clear existing data first
DELETE FROM public.jam_pelajaran;

-- Reset sequence
ALTER SEQUENCE public.jam_pelajaran_id_seq RESTART WITH 1;

-- ============================================
-- SENIN - KAMIS
-- ============================================
INSERT INTO public.jam_pelajaran (urutan, waktu_mulai, waktu_selesai, keterangan, is_istirahat, day_set) VALUES
(1,  '07:00', '07:35', 'Jam ke-1',              false, 'senin_kamis'),
(2,  '07:35', '08:10', 'Jam ke-2',              false, 'senin_kamis'),
(3,  '08:10', '08:45', 'Jam ke-3',              false, 'senin_kamis'),
(4,  '08:45', '09:20', 'Jam ke-4',              false, 'senin_kamis'),
(5,  '09:20', '09:55', 'Jam ke-5',              false, 'senin_kamis'),
(6,  '09:55', '10:25', 'Istirahat',             true,  'senin_kamis'),
(7,  '10:25', '11:00', 'Jam ke-6',              false, 'senin_kamis'),
(8,  '11:00', '11:35', 'Jam ke-7',              false, 'senin_kamis'),
(9,  '11:35', '12:10', 'Jam ke-8',              false, 'senin_kamis'),
(10, '12:10', '12:45', 'Jam ke-9',              false, 'senin_kamis'),
(11, '12:45', '13:10', 'Sholat Dhuhur/Istirahat', true,  'senin_kamis');

-- ============================================
-- JUMAT
-- ============================================
INSERT INTO public.jam_pelajaran (urutan, waktu_mulai, waktu_selesai, keterangan, is_istirahat, day_set) VALUES
(1,  '07:00', '07:35', 'Jam ke-1',   false, 'jumat'),
(2,  '07:35', '08:10', 'Jam ke-2',   false, 'jumat'),
(3,  '08:10', '08:45', 'Jam ke-3',   false, 'jumat'),
(4,  '08:45', '09:20', 'Jam ke-4',   false, 'jumat'),
(5,  '09:20', '09:50', 'Istirahat',  true,  'jumat'),
(6,  '09:50', '10:25', 'Jam ke-5',   false, 'jumat'),
(7,  '10:25', '11:00', 'Jam ke-6',   false, 'jumat');
