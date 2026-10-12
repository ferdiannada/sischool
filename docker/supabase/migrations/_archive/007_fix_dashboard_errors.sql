-- ============================================
-- Fix RPC and Views Migration
-- Version: 007 - Fix verify_user_password type mismatch and missing dashboard objects
-- ============================================

-- 1. Fix verify_user_password (cast varchar[] to text[])
-- Drop both signatures to be safe
DROP FUNCTION IF EXISTS public.verify_user_password(VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS public.verify_user_password(TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.verify_user_password(
    user_email TEXT,
    user_password TEXT
)
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    full_name VARCHAR,
    phone VARCHAR,
    avatar_url TEXT,
    roles TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.phone,
        u.avatar_url,
        ARRAY_AGG(r.name)::TEXT[] as roles  -- Cast to TEXT[] to match return type
    FROM public.users u
    LEFT JOIN public.user_roles ur ON u.id = ur.user_id
    LEFT JOIN public.roles r ON ur.role_id = r.id
    WHERE u.email = user_email
      AND u.is_active = true
      AND u.password_hash = crypt(user_password, u.password_hash)
    GROUP BY u.id, u.email, u.full_name, u.phone, u.avatar_url;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_user_password(TEXT, TEXT) TO anon, authenticated, service_role;

-- 2. Ensure Dashboard Views exist (Retrying creation from 006)

-- Admin Dashboard Summary View
CREATE OR REPLACE VIEW public.v_admin_dashboard_summary AS
SELECT 
    (SELECT COUNT(*) FROM public.siswa WHERE status = 'aktif') as total_siswa,
    (SELECT COUNT(*) FROM public.guru WHERE status = 'aktif') as total_guru,
    (SELECT COUNT(*) FROM public.kelas) as total_kelas,
    COALESCE(
        (SELECT ROUND(
            COUNT(*) FILTER (WHERE status = 'hadir')::DECIMAL / 
            NULLIF(COUNT(*), 0) * 100, 1
        )
        FROM public.attendances 
        WHERE tanggal = CURRENT_DATE), 0
    )::TEXT || '%' as attendance_rate_today;

GRANT SELECT ON public.v_admin_dashboard_summary TO anon, authenticated, service_role;

-- Weekly Attendance Summary View
CREATE OR REPLACE VIEW public.v_weekly_attendance AS
SELECT 
    tanggal,
    EXTRACT(DOW FROM tanggal) as day_of_week,
    COUNT(*) FILTER (WHERE status = 'hadir') as hadir,
    COUNT(*) FILTER (WHERE status = 'izin') as izin,
    COUNT(*) FILTER (WHERE status = 'sakit') as sakit,
    COUNT(*) FILTER (WHERE status = 'alpha') as alpha,
    COUNT(*) as total
FROM public.attendances
WHERE tanggal >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY tanggal
ORDER BY tanggal;

GRANT SELECT ON public.v_weekly_attendance TO anon, authenticated, service_role;

-- Class Attendance Summary View
CREATE OR REPLACE VIEW public.v_class_attendance_summary AS
SELECT 
    k.id as kelas_id,
    k.nama as kelas_nama,
    COUNT(DISTINCT s.id) as total_siswa,
    COUNT(*) FILTER (WHERE a.status = 'hadir') as total_hadir,
    COUNT(*) FILTER (WHERE a.status = 'izin') as total_izin,
    COUNT(*) FILTER (WHERE a.status = 'sakit') as total_sakit,
    COUNT(*) FILTER (WHERE a.status = 'alpha') as total_alpha
FROM public.kelas k
LEFT JOIN public.siswa s ON s.kelas_id = k.id AND s.status = 'aktif'
LEFT JOIN public.attendances a ON a.siswa_id = s.id
GROUP BY k.id, k.nama
ORDER BY k.nama;

GRANT SELECT ON public.v_class_attendance_summary TO anon, authenticated, service_role;

-- 3. Ensure get_admin_dashboard exists
CREATE OR REPLACE FUNCTION public.get_admin_dashboard()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSON;
    today_date DATE := CURRENT_DATE;
    total_attendance INTEGER;
    hadir_count INTEGER;
BEGIN
    -- Get today's attendance counts
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'hadir')
    INTO total_attendance, hadir_count
    FROM public.attendances
    WHERE tanggal = today_date;

    SELECT json_build_object(
        'totalSiswa', (SELECT COUNT(*) FROM public.siswa WHERE status = 'aktif'),
        'totalGuru', (SELECT COUNT(*) FROM public.guru WHERE status = 'aktif'),
        'totalKelas', (SELECT COUNT(*) FROM public.kelas),
        'attendanceRate', CASE 
            WHEN total_attendance > 0 
            THEN ROUND((hadir_count::DECIMAL / total_attendance) * 100, 1)::TEXT || '%'
            ELSE '0%'
        END,
        'todayStats', json_build_object(
            'hadir', hadir_count,
            'total', total_attendance
        )
    ) INTO result;
    
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard() TO anon, authenticated, service_role;
