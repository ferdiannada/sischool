import { supabase } from '@/lib/supabase';

/**
 * Attendance Service - Handles attendance operations
 */
export const attendanceService = {
    /**
     * Get attendance records
     */
    async getAttendance({ kelasId, tanggal, siswaId, page = 1, limit = 50 } = {}) {
        let query = supabase
            .from('attendances')
            .select(`
        *,
        siswa (
          id,
          nis,
          user:users (full_name)
        ),
        schedule:schedules (
          id,
          jam_mulai,
          jam_selesai,
          mata_pelajaran (nama)
        )
      `, { count: 'exact' });

        if (kelasId) {
            query = query.eq('siswa.kelas_id', kelasId);
        }
        if (tanggal) {
            query = query.eq('tanggal', tanggal);
        }
        if (siswaId) {
            query = query.eq('siswa_id', siswaId);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await query
            .range(from, to)
            .order('tanggal', { ascending: false });

        if (error) throw error;
        return { data, count, page, limit };
    },

    /**
     * Input single attendance
     */
    async inputAttendance(attendanceData) {
        const { data, error } = await supabase
            .from('attendances')
            .upsert(attendanceData, {
                onConflict: 'siswa_id,schedule_id,tanggal',
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Bulk input attendance (for ketua kelas)
     */
    async bulkInputAttendance(attendanceList) {
        const { data, error } = await supabase
            .from('attendances')
            .upsert(attendanceList, {
                onConflict: 'siswa_id,schedule_id,tanggal',
            })
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * Get daily summary for a class
     */
    async getDailySummary(kelasId, tanggal) {
        const { data, error } = await supabase
            .from('attendance_daily_summary')
            .select('*')
            .eq('kelas_id', kelasId)
            .eq('tanggal', tanggal)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore not found error
        return data;
    },

    /**
     * Get attendance statistics for a student
     */
    async getStudentStats(siswaId, startDate, endDate) {
        const { data, error } = await supabase
            .from('attendances')
            .select('status')
            .eq('siswa_id', siswaId)
            .gte('tanggal', startDate)
            .lte('tanggal', endDate);

        if (error) throw error;

        const stats = {
            hadir: 0,
            izin: 0,
            sakit: 0,
            alpha: 0,
            total: data.length,
        };

        data.forEach((item) => {
            if (stats[item.status] !== undefined) {
                stats[item.status]++;
            }
        });

        stats.persentase = stats.total > 0
            ? Math.round((stats.hadir / stats.total) * 100)
            : 0;

        return stats;
    },

    /**
     * Get class attendance report
     */
    async getClassReport(kelasId, month, year) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('attendance_daily_summary')
            .select('*')
            .eq('kelas_id', kelasId)
            .gte('tanggal', startDate)
            .lte('tanggal', endDate)
            .order('tanggal');

        if (error) throw error;
        return data;
    },

    /**
     * Verify attendance (for wali kelas)
     */
    async verifyAttendance(attendanceId, verifiedBy) {
        const { data, error } = await supabase
            .from('attendances')
            .update({ verified_by: verifiedBy })
            .eq('id', attendanceId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },
};

export default attendanceService;
