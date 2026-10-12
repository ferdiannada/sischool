
-- Ensure payment_types id has a sequence if it doesn't already
DO $$
BEGIN
    -- Create sequence if it doesn't exist
    CREATE SEQUENCE IF NOT EXISTS payment_types_id_seq;
    
    -- Set default value for id column to nextval of sequence
    ALTER TABLE IF EXISTS "public"."payment_types" 
    ALTER COLUMN "id" SET DEFAULT nextval('payment_types_id_seq');
    
    -- Sync sequence with current max id to avoid conflicts
    PERFORM setval('payment_types_id_seq', COALESCE((SELECT MAX(id) FROM "public"."payment_types"), 0) + 1);
END
$$;
