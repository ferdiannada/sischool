-- Optimizing Dashboard Data Fetching

-- 1. Weekly Attendance Stats
-- Aggregates attendance counts by date for a given range
CREATE OR REPLACE FUNCTION get_weekly_attendance_stats(
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

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_weekly_attendance_stats(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_attendance_stats(DATE, DATE) TO service_role;
