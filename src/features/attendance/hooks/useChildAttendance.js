import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';
import { attendanceAPI } from '@/features/attendance/api/attendanceAPI';

export const useChildAttendance = (childId, month, year) => {
    // Queries for Card Stats and History Logs
    // We combine them or keep them separate.
    // Ideally, for the "Card", we want it to update often.

    const statsQuery = useQuery({
        queryKey: ['attendance', 'stats', childId, month, year],
        queryFn: async () => {
            if (!childId) return null;
            return await dashboardAPI.getStudentAttendanceCard(childId, month, year);
        },
        enabled: !!childId,
        keepPreviousData: true,
        refetchInterval: 5 * 60 * 1000, // Poll every 5 mins
    });

    const historyQuery = useQuery({
        queryKey: ['attendance', 'history', childId], // History is usually all-time or large list
        queryFn: async () => {
            if (!childId) return null;
            if (!childId) return null;
            // Use attendanceAPI.getStudentAttendanceHistory which returns the array directly
            const data = await attendanceAPI.getStudentAttendanceHistory(childId, 100);
            // Map the data to include mapel name for easier display if needed, though view might handle it
            return data.map(item => ({
                ...item,
                mapel: item.schedule?.mata_pelajaran?.nama || 'Unknown'
            }));
        },
        enabled: !!childId,
        staleTime: 60 * 1000, // 1 min cache
        refetchInterval: 5 * 60 * 1000, // Same polling
    });

    return {
        stats: statsQuery.data?.attendance || { hadir: 0, izin: 0, sakit: 0, alpha: 0 },
        history: historyQuery.data || [],
        isLoading: statsQuery.isLoading || historyQuery.isLoading,
        error: statsQuery.error || historyQuery.error
    };
};
