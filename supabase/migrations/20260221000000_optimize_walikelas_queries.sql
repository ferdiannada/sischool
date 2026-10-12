-- Migration: Optimize Wali Kelas Queries
-- Created: 2026-02-21
-- Description: Adds strategic B-Tree indexes to frequent JOIN and WHERE clauses to optimize Wali Kelas Dashboard and Reports queries.

-- 1. Index on `attendances`
SELECT pg_sleep(0.1); -- Safety pause

CREATE INDEX IF NOT EXISTS idx_attendances_siswa_id ON public.attendances(siswa_id);
CREATE INDEX IF NOT EXISTS idx_attendances_tanggal ON public.attendances(tanggal);
CREATE INDEX IF NOT EXISTS idx_attendances_status ON public.attendances(status);
CREATE INDEX IF NOT EXISTS idx_attendances_schedule_id ON public.attendances(schedule_id);

-- Composite index for the most common lookup (a student's attendance on a specific date range)
CREATE INDEX IF NOT EXISTS idx_attendances_siswa_tanggal ON public.attendances(siswa_id, tanggal);

-- 2. Index on `siswa`
CREATE INDEX IF NOT EXISTS idx_siswa_kelas_id ON public.siswa(kelas_id);
CREATE INDEX IF NOT EXISTS idx_siswa_status ON public.siswa(status);

-- 3. Index on `kelas`
CREATE INDEX IF NOT EXISTS idx_kelas_wali_kelas_id ON public.kelas(wali_kelas_id);
CREATE INDEX IF NOT EXISTS idx_kelas_tahun_ajaran_id ON public.kelas(tahun_ajaran_id);

-- 4. Index on `schedules`
CREATE INDEX IF NOT EXISTS idx_schedules_kelas_id ON public.schedules(kelas_id);
CREATE INDEX IF NOT EXISTS idx_schedules_guru_id ON public.schedules(guru_id);

-- Run VACUUM ANALYZE to update the postgres statistics analyzer to make use of new indexes
-- VACUUM ANALYZE public.attendances;
-- VACUUM ANALYZE public.siswa;
-- VACUUM ANALYZE public.kelas;
