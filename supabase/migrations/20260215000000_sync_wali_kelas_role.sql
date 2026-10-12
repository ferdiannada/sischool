-- Migration: Auto-sync wali_kelas role when assigned/unassigned in kelas table
-- When a teacher is assigned as wali_kelas for a class, this trigger
-- automatically adds the 'wali_kelas' role to their user_roles entry.
-- When unassigned, it removes the role IF they're not wali_kelas for any other class.

CREATE OR REPLACE FUNCTION sync_wali_kelas_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wali_kelas_role_id INTEGER;
BEGIN
    -- Get the role_id for 'wali_kelas'
    SELECT id INTO v_wali_kelas_role_id FROM public.roles WHERE name = 'wali_kelas';

    IF v_wali_kelas_role_id IS NULL THEN
        RAISE WARNING 'Role wali_kelas not found in roles table';
        RETURN NEW;
    END IF;

    -- Handle OLD wali_kelas being removed or changed
    IF TG_OP = 'UPDATE' AND OLD.wali_kelas_id IS NOT NULL 
       AND (NEW.wali_kelas_id IS NULL OR NEW.wali_kelas_id != OLD.wali_kelas_id) THEN
        -- Check if old teacher is still wali_kelas for any OTHER class
        IF NOT EXISTS (
            SELECT 1 FROM public.kelas
            WHERE wali_kelas_id = OLD.wali_kelas_id
              AND id != NEW.id
        ) THEN
            -- No longer wali_kelas for any class -> remove role
            DELETE FROM public.user_roles
            WHERE user_id = OLD.wali_kelas_id
              AND role_id = v_wali_kelas_role_id;
        END IF;
    END IF;

    -- Handle NEW wali_kelas being assigned
    IF NEW.wali_kelas_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (NEW.wali_kelas_id, v_wali_kelas_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trg_sync_wali_kelas_role ON public.kelas;

CREATE TRIGGER trg_sync_wali_kelas_role
    AFTER INSERT OR UPDATE OF wali_kelas_id
    ON public.kelas
    FOR EACH ROW
    EXECUTE FUNCTION sync_wali_kelas_role();

-- Also handle kelas DELETE: remove wali_kelas role if teacher is not wali for other classes
CREATE OR REPLACE FUNCTION sync_wali_kelas_role_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_wali_kelas_role_id INTEGER;
BEGIN
    IF OLD.wali_kelas_id IS NULL THEN
        RETURN OLD;
    END IF;

    SELECT id INTO v_wali_kelas_role_id FROM public.roles WHERE name = 'wali_kelas';
    IF v_wali_kelas_role_id IS NULL THEN
        RETURN OLD;
    END IF;

    -- Check if teacher is still wali_kelas for any other class
    IF NOT EXISTS (
        SELECT 1 FROM public.kelas
        WHERE wali_kelas_id = OLD.wali_kelas_id
          AND id != OLD.id
    ) THEN
        DELETE FROM public.user_roles
        WHERE user_id = OLD.wali_kelas_id
          AND role_id = v_wali_kelas_role_id;
    END IF;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_wali_kelas_role_on_delete ON public.kelas;

CREATE TRIGGER trg_sync_wali_kelas_role_on_delete
    AFTER DELETE
    ON public.kelas
    FOR EACH ROW
    EXECUTE FUNCTION sync_wali_kelas_role_on_delete();
