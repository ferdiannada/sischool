-- Fix missing ID sequences and default values for payments, expense_categories, and roles

-- 1. Fix payments table
DO $$
BEGIN
    -- Create sequence if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'payments_id_seq') THEN
        CREATE SEQUENCE payments_id_seq;
    END IF;
    
    -- Set default value
    ALTER TABLE IF EXISTS "public"."payments" 
    ALTER COLUMN "id" SET DEFAULT nextval('payments_id_seq');
    
    -- Sync sequence
    PERFORM setval('payments_id_seq', COALESCE((SELECT MAX(id) FROM "public"."payments"), 0) + 1);
END
$$;

-- 2. Fix expense_categories table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'expense_categories_id_seq') THEN
        CREATE SEQUENCE expense_categories_id_seq;
    END IF;
    
    ALTER TABLE IF EXISTS "public"."expense_categories" 
    ALTER COLUMN "id" SET DEFAULT nextval('expense_categories_id_seq');
    
    PERFORM setval('expense_categories_id_seq', COALESCE((SELECT MAX(id) FROM "public"."expense_categories"), 0) + 1);
END
$$;

-- 3. Fix roles table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'roles_id_seq') THEN
        CREATE SEQUENCE roles_id_seq;
    END IF;
    
    -- Sync sequence with current max id BEFORE setting default if table has data
    PERFORM setval('roles_id_seq', COALESCE((SELECT MAX(id) FROM "public"."roles"), 100));

    ALTER TABLE IF EXISTS "public"."roles" 
    ALTER COLUMN "id" SET DEFAULT nextval('roles_id_seq');
END
$$;
