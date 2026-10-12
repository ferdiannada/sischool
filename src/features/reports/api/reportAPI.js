/**
 * Report API Service
 * Handles report generation and statistics
 * Refactored to use Supabase Client
 */

import { supabase } from '../../../lib/supabase';

export const reportAPI = {
    /**
     * Get overall attendance statistics for a date range
     */
    async getOverallStats(startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('attendances')
                .select('status')
                .gte('tanggal', startDate)
                .lte('tanggal', endDate);

            if (error) throw error;

            if (!data) {
                return { hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0 };
            }

            return {
                hadir: data.filter(d => d.status === 'hadir').length,
                izin: data.filter(d => d.status === 'izin').length,
                sakit: data.filter(d => d.status === 'sakit').length,
                alpha: data.filter(d => d.status === 'alpha').length,
                total: data.length
            };
        } catch (error) {
            console.error('Error fetching overall stats:', error);
            return { hadir: 0, izin: 0, sakit: 0, alpha: 0, total: 0 };
        }
    },

    /**
     * Get attendance breakdown by class
     */
    async getClassAttendanceSummary(startDate, endDate) {
        try {
            // Fetch all classes
            const { data: classes, error: classError } = await supabase
                .from('kelas')
                .select('id,nama')
                .order('nama', { ascending: true });

            if (classError) throw classError;
            if (!classes) return [];

            // Fetch all attendance for range
            const { data: allAttendance, error: attendanceError } = await supabase
                .from('attendances')
                .select('status,siswa(kelas_id)')
                .gte('tanggal', startDate)
                .lte('tanggal', endDate);

            if (attendanceError) throw attendanceError;

            return classes.map(kelas => {
                const classAttendance = allAttendance?.filter(a => a.siswa?.kelas_id === kelas.id) || [];
                const total = classAttendance.length;

                return {
                    id: kelas.id,
                    kelas: kelas.nama,
                    hadir: classAttendance.filter(a => a.status === 'hadir').length,
                    izin: classAttendance.filter(a => a.status === 'izin').length,
                    sakit: classAttendance.filter(a => a.status === 'sakit').length,
                    alpha: classAttendance.filter(a => a.status === 'alpha').length,
                    persentase: total > 0
                        ? Math.round((classAttendance.filter(a => a.status === 'hadir').length / total) * 100)
                        : 0,
                };
            });
        } catch (error) {
            console.error('Error fetching class attendance summary:', error);
            return [];
        }
    },

    /**
     * Get detailed attendance report
     */
    async getAttendanceReport(filters = {}) {
        try {
            let query = supabase
                .from('attendances')
                .select(`
                    *,
                    siswa (
                        nis,
                        user:users (full_name),
                        kelas (id, nama)
                    )
                `);

            if (filters.startDate) {
                query = query.gte('tanggal', filters.startDate);
            }
            if (filters.endDate) {
                query = query.lte('tanggal', filters.endDate);
            }

            const { data, error } = await query.order('tanggal', { ascending: false });

            if (error) throw error;

            // Client-side filter for kelas (since it's a nested relation filter which is tricky in one go without inner join)
            // Or use inner join on siswa if performance needed: .not('siswa', 'is', null) 
            // For now keep client side filter to match logic
            let filteredData = data || [];
            if (filters.kelasId) {
                filteredData = filteredData.filter(item => item.siswa?.kelas?.id === filters.kelasId);
            }

            return filteredData.map(item => ({
                id: item.id,
                tanggal: item.tanggal,
                nis: item.siswa?.nis || '-',
                nama: item.siswa?.user?.full_name || 'Unknown',
                kelas: item.siswa?.kelas?.nama || '-',
                status: item.status,
                keterangan: item.catatan || '-', // Mapped from database 'catatan' field
            }));
        } catch (error) {
            console.error('Error fetching attendance report:', error);
            return [];
        }
    },

    /**
     * Get daily attendance trend
     */
    async getDailyTrend(startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('attendances')
                .select('tanggal,status')
                .gte('tanggal', startDate)
                .lte('tanggal', endDate);

            if (error) throw error;

            const grouped = {};
            data?.forEach(item => {
                if (!grouped[item.tanggal]) {
                    grouped[item.tanggal] = { tanggal: item.tanggal, hadir: 0, total: 0 };
                }
                grouped[item.tanggal].total++;
                if (item.status === 'hadir') grouped[item.tanggal].hadir++;
            });

            return Object.values(grouped)
                .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
                .map(item => ({
                    tanggal: item.tanggal,
                    persentase: item.total > 0 ? Math.round((item.hadir / item.total) * 100) : 0,
                }));

        } catch (error) {
            console.error('Error fetching trend:', error);
            return [];
        }
    },

    /**
     * Generate CSV content
     */
    generateCSV(data, columns) {
        if (!data || !data.length) return '';

        const headers = columns.map(col => col.header).join(',');
        const rows = data.map(row => {
            return columns.map(col => {
                let cell = row[col.key] || '';
                // Handle commas in content
                if (cell.toString().includes(',')) {
                    cell = `"${cell}"`;
                }
                return cell;
            }).join(',');
        });

        return [headers, ...rows].join('\n');
    },

    /**
     * Trigger CSV download
     */
    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};

export default reportAPI;
