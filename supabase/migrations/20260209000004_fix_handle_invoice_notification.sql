
-- Update function to use new notification schema
CREATE OR REPLACE FUNCTION "public"."handle_invoice_notification"() RETURNS trigger
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_student_name TEXT;
    v_parent_ids UUID[];
    v_parent_id UUID;
    v_notification_id UUID;
BEGIN
    -- Get student name
    SELECT u.full_name INTO v_student_name
    FROM public.siswa s
    JOIN public.users u ON s.user_id = u.id
    WHERE s.id = NEW.siswa_id;

    -- Get Parent IDs
    SELECT array_agg(wm.user_id) INTO v_parent_ids
    FROM public.siswa_wali sw
    JOIN public.wali_murid wm ON sw.wali_id = wm.id
    WHERE sw.siswa_id = NEW.siswa_id;

    IF v_parent_ids IS NULL THEN
        RETURN NEW;
    END IF;

    -- Create Notification
    INSERT INTO public.notifications (
        title, 
        message, 
        type, 
        category, 
        data,
        created_by -- System created, maybe null or specific system user
    ) VALUES (
        'Tagihan Baru',
        'Tagihan baru sebesar Rp ' || TO_CHAR(NEW.nominal, 'FM999,999,999') || ' untuk ' || v_student_name || ' telah diterbitkan.',
        'warning',
        'billing',
        jsonb_build_object('invoice_id', NEW.id, 'student_id', NEW.siswa_id),
        NULL
    ) RETURNING id INTO v_notification_id;

    -- Create Recipients
    FOREACH v_parent_id IN ARRAY v_parent_ids
    LOOP
        INSERT INTO public.notification_recipients (notification_id, user_id)
        VALUES (v_notification_id, v_parent_id);
    END LOOP;

    RETURN NEW;
END;
$$;
