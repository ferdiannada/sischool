-- Fix schedules id column to use the sequence by default
ALTER TABLE public.schedules 
ALTER COLUMN id SET DEFAULT nextval('public.schedules_id_seq');

-- Ensure the sequence is owned by the column
ALTER SEQUENCE public.schedules_id_seq OWNED BY public.schedules.id;
