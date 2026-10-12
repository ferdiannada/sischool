-- Fix jam_pelajaran id column to use the sequence by default
ALTER TABLE public.jam_pelajaran 
ALTER COLUMN id SET DEFAULT nextval('public.jam_pelajaran_id_seq');

-- Ensure the sequence is owned by the column (it was already in baseline but good to ensure)
ALTER SEQUENCE public.jam_pelajaran_id_seq OWNED BY public.jam_pelajaran.id;
