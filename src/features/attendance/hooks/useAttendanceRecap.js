import { useQuery } from '@tanstack/react-query';
import { attendanceAPI } from '@/features/attendance/api/attendanceAPI';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const useGuruClasses = (userId) => {
    return useQuery({
        queryKey: ['guru', 'classes', userId],
        queryFn: async () => {
            const data = await attendanceAPI.getGuruClasses(userId);
            return data.sort((a, b) => a.nama.localeCompare(b.nama));
        },
        enabled: !!userId,
        staleTime: 30 * 60 * 1000, // 30 mins
    });
};

export const useAttendanceRecap = (classId, monthStr) => {
    return useQuery({
        queryKey: ['attendance', 'recap', classId, monthStr],
        queryFn: async () => {
            const date = new Date(monthStr + '-01');
            const startDate = format(startOfMonth(date), 'yyyy-MM-dd');
            const endDate = format(endOfMonth(date), 'yyyy-MM-dd');
            return await attendanceAPI.getAttendanceRecap(classId, startDate, endDate);
        },
        enabled: !!classId && !!monthStr,
        placeholderData: (previousData) => previousData,
        staleTime: 5 * 60 * 1000,
    });
};
