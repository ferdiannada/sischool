-- Optimasi Database Indexing (Revisi berdasar skema saat ini)
-- Migration ini fokus pada index yang BELUM ada di 20260221000000_optimize_walikelas_queries.sql
-- 1. Index untuk tabel 'siswa'
-- (idx_siswa_kelas_id dan idx_siswa_status sudah ada)
CREATE INDEX IF NOT EXISTS idx_siswa_user_id ON public.siswa(user_id);
-- 2. Index untuk pencarian teks di tabel 'users' (Sangat berguna untuk Admin User Management)
-- Menggunakan ekstensi pg_trgm (Trigram) untuk mempercepat pencarian teks parsial (ilike)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_users_full_name_trgm ON public.users USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_trgm ON public.users USING gin (email gin_trgm_ops);
-- 3. Index untuk tabel 'user_roles' (Sering di-join oleh Admin saat memfilter role tertentu)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);