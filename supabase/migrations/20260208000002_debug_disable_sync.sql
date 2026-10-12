-- Debugging: Temporarily drop the sync trigger to verify if it is the cause of user creation failure
DROP TRIGGER IF EXISTS on_user_role_change ON public.user_roles;
