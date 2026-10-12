-- Fix attendances id column to use the sequence by default
ALTER TABLE public.attendances 
ALTER COLUMN id SET DEFAULT nextval('public.attendances_id_seq');

-- Ensure the sequence is owned by the column
ALTER SEQUENCE public.attendances_id_seq OWNED BY public.attendances.id;
