-- Fix handle_attendance_notification to use new schema
-- This acts as a replacement for the function defined in 20260206000000_consolidated_baseline.sql

CREATE OR REPLACE FUNCTION "public"."handle_attendance_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_student_name TEXT;
    v_parent_ids UUID[];
    v_parent_id UUID;
    v_title TEXT;
    v_message TEXT;
    v_type TEXT := 'info';
    v_notification_id UUID;
    
    -- New details
    v_mapel TEXT;
    v_jam TEXT;
    v_inputter TEXT;
BEGIN
    -- Only trigger for non-Hadir status
    IF NEW.status IN ('hadir') THEN
        RETURN NEW;
    END IF;

    -- Get student name
    SELECT u.full_name INTO v_student_name
    FROM public.siswa s
    JOIN public.users u ON s.user_id = u.id
    WHERE s.id = NEW.siswa_id;

    -- Get detailed info (Subject, Time, Inputter)
    SELECT 
        mp.nama,
        to_char(sch.jam_mulai, 'HH24:MI') || ' - ' || to_char(sch.jam_selesai, 'HH24:MI'),
        COALESCE(u.full_name, 'Sistem')
    INTO 
        v_mapel,
        v_jam,
        v_inputter
    FROM public.schedules sch
    JOIN public.mata_pelajaran mp ON sch.mata_pelajaran_id = mp.id
    LEFT JOIN public.users u ON u.id = NEW.input_by
    WHERE sch.id = NEW.schedule_id;

    -- Fallbacks if schedule_id is missing or invalid
    v_mapel := COALESCE(v_mapel, 'pelajaran');
    v_jam := COALESCE(v_jam, '-');
    v_inputter := COALESCE(v_inputter, 'Sistem');

    -- Get Parent IDs
    SELECT array_agg(wm.user_id) INTO v_parent_ids
    FROM public.siswa_wali sw
    JOIN public.wali_murid wm ON sw.wali_id = wm.id
    WHERE sw.siswa_id = NEW.siswa_id;

    IF v_parent_ids IS NULL THEN
        RETURN NEW;
    END IF;

    -- Construct Message based on status with detailed info
    IF NEW.status = 'alpha' THEN
        v_title := 'Ketidakhadiran: Alpha';
        v_message := 'Perhatian: ' || v_student_name || ' tercatat Alpha pada ' || v_mapel || ' (' || v_jam || '). Diinput oleh: ' || v_inputter || '.';
        v_type := 'danger';
    ELSIF NEW.status = 'sakit' THEN
        v_title := 'Ketidakhadiran: Sakit';
        v_message := v_student_name || ' tercatat Sakit pada ' || v_mapel || ' (' || v_jam || '). Diinput oleh: ' || v_inputter || '.';
        v_type := 'warning';
    ELSIF NEW.status = 'izin' THEN
        v_title := 'Ketidakhadiran: Izin';
        v_message := v_student_name || ' tercatat Izin pada ' || v_mapel || ' (' || v_jam || '). Diinput oleh: ' || v_inputter || '.';
        v_type := 'info';
    ELSE
         RETURN NEW;
    END IF;

    -- Insert Notification (Centralized)
    INSERT INTO public.notifications (
        title, 
        message, 
        type, 
        category, 
        data,
        created_by
    ) VALUES (
        v_title, 
        v_message, 
        v_type, 
        'attendance', 
        jsonb_build_object(
            'attendance_id', NEW.id, 
            'student_id', NEW.siswa_id,
            'schedule_id', NEW.schedule_id
        ),
        NULL -- System created
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
