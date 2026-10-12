-- Migration: Fix Missing Weekly Attendance RPC
-- Purpose: Ensure get_weekly_attendance_stats function exists with correct permissions

CREATE OR REPLACE FUNCTION public.get_weekly_attendance_stats(
    p_start_date DATE DEFAULT (CURRENT_DATE - INTERVAL '6 days'),
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    tanggal DATE,
    hadir BIGINT,
    izin BIGINT,
    sakit BIGINT,
    alpha BIGINT,
    total BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.tanggal,
        COUNT(*) FILTER (WHERE a.status = 'hadir') AS hadir,
        COUNT(*) FILTER (WHERE a.status = 'izin') AS izin,
        COUNT(*) FILTER (WHERE a.status = 'sakit') AS sakit,
        COUNT(*) FILTER (WHERE a.status = 'alpha') AS alpha,
        COUNT(*) AS total
    FROM
        attendances a
    WHERE
        a.tanggal BETWEEN p_start_date AND p_end_date
    GROUP BY
        a.tanggal
    ORDER BY
        a.tanggal;
END;
$$;

-- Grant permissions explicitly to all relevant roles
GRANT EXECUTE ON FUNCTION public.get_weekly_attendance_stats(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_attendance_stats(DATE, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_weekly_attendance_stats(DATE, DATE) TO anon; -- Fallback if auth context is fuzzy
