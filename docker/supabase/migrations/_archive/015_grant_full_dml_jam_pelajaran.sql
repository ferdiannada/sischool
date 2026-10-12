-- ============================================
-- Fix Table Permissions for Jam Pelajaran
-- Grant INSERT, UPDATE, DELETE to authenticated role
-- RLS will handle the actual restriction
-- ============================================

GRANT INSERT, UPDATE, DELETE ON public.jam_pelajaran TO authenticated;
