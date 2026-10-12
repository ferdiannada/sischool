import { supabase } from '../../../lib/supabase';
import { getStartOfWeek, getEndOfWeek } from '@/utils/format';

export const attendanceAPI = {
    /**
     * Get schedules for attendance input (for guru)
     */
    async getGuruSchedules(guruUserId, date = new Date()) {
        try {
            const dateStr = date.toISOString().split('T')[0];
            const { data, error } = await supabase.rpc('get_guru_daily_schedules', {
                p_guru_id: guruUserId,
                p_date: dateStr
            });
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('getGuruSchedules error:', error);
            throw error;
        }
    },

    /**
     * Get students for a specific class
     */
    async getStudentsByClass(kelasId) {
        try {
            const { data, error } = await supabase
                .from('siswa')
                .select('id,nis,jenis_kelamin,user:users(id,full_name)')
                .eq('kelas_id', kelasId)
                .eq('status', 'aktif')
                .order('nis', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('getStudentsByClass error:', error);
            throw error;
        }
    },

    /**
     * Get today's attendance for a schedule
     */
    async getTodayAttendance(scheduleId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('attendances')
                .select('*')
                .eq('schedule_id', scheduleId)
                .eq('tanggal', today);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('getTodayAttendance error:', error);
            throw error;
        }
    },

    /**
     * Submit attendance for multiple students
     */
    async submitAttendance(attendanceData) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const now = new Date().toISOString();

            const records = attendanceData.students.map(s => ({
                siswa_id: s.siswaId,
                schedule_id: attendanceData.scheduleId,
                tanggal: today,
                status: s.status,
                catatan: s.catatan || null,
                waktu_hadir: s.status === 'hadir' ? now : null,
                input_by: attendanceData.inputBy,
            }));

            const { data, error } = await supabase
                .from('attendances')
                .upsert(records, { onConflict: 'siswa_id,schedule_id,tanggal' })
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('submitAttendance error:', error);
            throw error;
        }
    },

    /**
     * Update single attendance record
     */
    async updateAttendance(attendanceId, data) {
        try {
            const { data: updated, error } = await supabase
                .from('attendances')
                .update(data)
                .eq('id', attendanceId)
                .select();

            if (error) throw error;
            return updated;
        } catch (error) {
            console.error('updateAttendance error:', error);
            throw error;
        }
    },

    /**
     * Get attendance summary for a class
     */
    async getClassAttendanceSummary(kelasId, startDate, endDate) {
        try {
            const [attendanceRes, studentsRes] = await Promise.all([
                supabase
                    .from('attendances')
                    .select('siswa_id,status,tanggal')
                    .gte('tanggal', startDate)
                    .lte('tanggal', endDate),
                supabase
                    .from('siswa')
                    .select('id,nis,user:users(full_name)')
                    .eq('kelas_id', kelasId)
                    .eq('status', 'aktif')
            ]);

            if (attendanceRes.error) throw attendanceRes.error;
            if (studentsRes.error) throw studentsRes.error;

            const attendance = attendanceRes.data || [];
            const students = studentsRes.data || [];

            return students.map(student => {
                const studentAttendance = attendance.filter(a => a.siswa_id === student.id);
                return {
                    siswa: student,
                    hadir: studentAttendance.filter(a => a.status === 'hadir').length,
                    izin: studentAttendance.filter(a => a.status === 'izin').length,
                    sakit: studentAttendance.filter(a => a.status === 'sakit').length,
                    alpha: studentAttendance.filter(a => a.status === 'alpha').length,
                    total: studentAttendance.length,
                };
            });
        } catch (error) {
            console.error('getClassAttendanceSummary error:', error);
            throw error;
        }
    },

    /**
     * Get attendance history for a student
     */
    async getStudentAttendanceHistory(siswaId, limit = 30) {
        try {
            const { data, error } = await supabase
                .from('attendances')
                .select('*,schedule:schedules(mata_pelajaran(nama))')
                .eq('siswa_id', siswaId)
                .order('tanggal', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('getStudentAttendanceHistory error:', error);
            throw error;
        }
    },

    /**
     * Get attendance recap for a class
     */
    async getAttendanceRecap(kelasId, startDate, endDate, mapelId = null) {
        try {
            const params = {
                p_kelas_id: kelasId,
                p_start_date: startDate,
                p_end_date: endDate
            };

            if (mapelId) {
                params.p_mata_pelajaran_id = mapelId;
            }

            const { data, error } = await supabase.rpc('get_attendance_recap', params);
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('getAttendanceRecap error:', error);
            throw error;
        }
    },

    /**
     * Get all classes taught by a guru
     */
    async getGuruClasses(guruUserId) {
        try {
            const { data, error } = await supabase.rpc('get_guru_classes', {
                p_guru_id: guruUserId
            });
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('getGuruClasses error:', error);
            throw error;
        }
    },

    /**
     * Get weekly attendance data for chart
     */
    async getWeeklyAttendance() {
        try {
            const startDate = getStartOfWeek();
            const endDate = getEndOfWeek();

            const { data: rawData, error } = await supabase.rpc('get_weekly_attendance_stats', {
                p_start_date: startDate,
                p_end_date: endDate
            });

            if (error) {
                // If the function is missing, don't crash the dashboard
                if (error.code === 'PGRST202' || error.status === 404) {
                    console.warn('RPC get_weekly_attendance_stats not found. Please run the latest migrations.');
                    return attendanceAPI._generateEmptyWeekData(startDate);
                }
                throw error;
            }

            // Generate dates for Mon-Sat to ensure no gaps in chart
            return attendanceAPI._generateWeekData(startDate, rawData || []);
        } catch (error) {
            console.error('getWeeklyAttendance error:', error);
            // Return empty data instead of throwing to keep UI alive
            return attendanceAPI._generateEmptyWeekData(getStartOfWeek());
        }
    },

    /**
     * Helper to generate full week data from raw results
     */
    _generateWeekData(startDate, rawData) {
        const dates = [];
        const daysShort = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        const monday = new Date(startDate);

        for (let i = 0; i < 6; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            const dStr = d.toISOString().split('T')[0];
            const dayName = daysShort[d.getDay()];

            const dayData = (rawData || []).find(item => item.tanggal === dStr) || {};

            dates.push({
                name: dayName,
                tanggal: dStr,
                hadir: parseInt(dayData.hadir) || 0,
                izin: parseInt(dayData.izin) || 0,
                sakit: parseInt(dayData.sakit) || 0,
                alpha: parseInt(dayData.alpha) || 0
            });
        }
        return dates;
    },

    /**
     * Helper to generate empty week data
     */
    _generateEmptyWeekData(startDate) {
        return attendanceAPI._generateWeekData(startDate, []);
    },
};

export default attendanceAPI;
