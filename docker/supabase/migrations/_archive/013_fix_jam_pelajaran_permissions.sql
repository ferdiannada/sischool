-- Grant permissions for jam_pelajaran table
GRANT ALL ON public.jam_pelajaran TO postgres;
GRANT ALL ON public.jam_pelajaran TO service_role;
GRANT SELECT ON public.jam_pelajaran TO anon;
GRANT SELECT ON public.jam_pelajaran TO authenticated;

-- Ensure sequences are also accessible if any (though currently UUID/manual integer)
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
