
-- Ensure invoices id has a sequence if it doesn't already
DO $$
BEGIN
    -- Create sequence if it doesn't exist
    CREATE SEQUENCE IF NOT EXISTS invoices_id_seq;
    
    -- Set default value for id column to nextval of sequence
    ALTER TABLE IF EXISTS "public"."invoices" 
    ALTER COLUMN "id" SET DEFAULT nextval('invoices_id_seq');
    
    -- Sync sequence with current max id to avoid conflicts
    PERFORM setval('invoices_id_seq', COALESCE((SELECT MAX(id) FROM "public"."invoices"), 0) + 1);
END
$$;

-- Also checking expenses table just in case
DO $$
BEGIN
    -- Create sequence if it doesn't exist
    CREATE SEQUENCE IF NOT EXISTS expenses_id_seq;
    
    -- Set default value for id column to nextval of sequence
    ALTER TABLE IF EXISTS "public"."expenses" 
    ALTER COLUMN "id" SET DEFAULT nextval('expenses_id_seq');
    
    -- Sync sequence with current max id to avoid conflicts
    PERFORM setval('expenses_id_seq', COALESCE((SELECT MAX(id) FROM "public"."expenses"), 0) + 1);
END
$$;
