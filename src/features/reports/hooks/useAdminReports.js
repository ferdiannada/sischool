import { useQuery } from '@tanstack/react-query';
import { reportAPI } from '@/features/reports/api/reportAPI';
import { masterDataAPI } from '@/features/master-data/api/masterDataAPI';

/**
 * Hook for Admin Reports
 * Handles fetching class list and report data based on filters
 */
export const useAdminReports = (filters) => {
    // 1. Fetch Class List (Reference Data)
    const { data: kelasList = [] } = useQuery({
        queryKey: ['reports', 'kelasList'],
        queryFn: masterDataAPI.getKelas,
        staleTime: Infinity,
    });

    // 2. Fetch Report Data
    // Only fetch if filters are valid (start & end date exist)
    const enabled = !!filters.start && !!filters.end;

    const { data: overallStats, isLoading: loadingStats } = useQuery({
        queryKey: ['reports', 'overall', filters.start, filters.end],
        queryFn: () => reportAPI.getOverallStats(filters.start, filters.end),
        enabled: enabled,
        keepPreviousData: true,
    });

    const { data: classSummary = [], isLoading: loadingClass } = useQuery({
        queryKey: ['reports', 'class', filters.start, filters.end],
        queryFn: () => reportAPI.getClassAttendanceSummary(filters.start, filters.end),
        enabled: enabled,
        keepPreviousData: true,
    });

    const { data: studentSummary = [], isLoading: loadingStudent } = useQuery({
        queryKey: ['reports', 'student', filters.start, filters.end, filters.classId],
        queryFn: async () => {
            if (!filters.classId) return [];
            return reportAPI.getStudentAttendanceSummary(filters.classId, filters.start, filters.end);
        },
        enabled: enabled && !!filters.classId,
        keepPreviousData: true,
    });

    // Export Helpers
    const downloadCSV = (type) => {
        if (type === 'student' && studentSummary.length > 0) {
            const columns = [
                { key: 'nis', label: 'NIS' },
                { key: 'nama', label: 'Nama Siswa' },
                { key: 'hadir', label: 'Hadir' },
                { key: 'izin', label: 'Izin' },
                { key: 'sakit', label: 'Sakit' },
                { key: 'alpha', label: 'Alpha' },
                { key: 'persentase', label: 'Persentase (%)' },
            ];
            const csv = reportAPI.generateCSV(studentSummary, columns);
            reportAPI.downloadCSV(csv, `laporan_kehadiran_siswa_${filters.start}_${filters.end}.csv`);
        } else if (type === 'class' && classSummary.length > 0) {
            const columns = [
                { key: 'kelasNama', label: 'Kelas' },
                { key: 'total', label: 'Total' },
                { key: 'hadir', label: 'Hadir' },
                { key: 'izin', label: 'Izin' },
                { key: 'sakit', label: 'Sakit' },
                { key: 'alpha', label: 'Alpha' },
                { key: 'persentaseHadir', label: 'Persentase (%)' },
            ];
            const csv = reportAPI.generateCSV(classSummary, columns);
            reportAPI.downloadCSV(csv, `laporan_kehadiran_kelas_${filters.start}_${filters.end}.csv`);
        }
    };

    return {
        kelasList,
        overallStats,
        classSummary,
        studentSummary,
        isLoading: loadingStats || loadingClass || loadingStudent,
        downloadCSV
    };
};
