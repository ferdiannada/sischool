-- Fix blocking constraints for user deletion

-- 1. Payments: received_by -> SET NULL
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_received_by_fkey;
ALTER TABLE public.payments ADD CONSTRAINT payments_received_by_fkey 
    FOREIGN KEY (received_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- 2. Expenses: created_by -> SET NULL
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_created_by_fkey;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Attendances: input_by -> SET NULL
ALTER TABLE public.attendances DROP CONSTRAINT IF EXISTS attendances_input_by_fkey;
ALTER TABLE public.attendances ADD CONSTRAINT attendances_input_by_fkey 
    FOREIGN KEY (input_by) REFERENCES public.users(id) ON DELETE SET NULL;

-- 4. Kelas: wali_kelas_id -> SET NULL
ALTER TABLE public.kelas DROP CONSTRAINT IF EXISTS kelas_wali_kelas_id_fkey;
ALTER TABLE public.kelas ADD CONSTRAINT kelas_wali_kelas_id_fkey 
    FOREIGN KEY (wali_kelas_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- 5. Notifications: Add FK if missing (to verify)
-- Assuming notifications.user_id should CASCADE
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey'
    ) THEN
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;
