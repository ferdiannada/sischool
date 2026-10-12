import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceAPI } from '@/features/attendance/api/attendanceAPI';
import { toast } from 'react-hot-toast';

export const useGuruSchedules = (userId) => {
    return useQuery({
        queryKey: ['guru-schedules', userId],
        queryFn: () => attendanceAPI.getGuruSchedules(userId),
        enabled: !!userId,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

export const useClassStudentsForAttendance = (classId) => {
    return useQuery({
        queryKey: ['class-students-attendance', classId],
        queryFn: () => attendanceAPI.getStudentsByClass(classId),
        enabled: !!classId,
        staleTime: 10 * 60 * 1000,
    });
};

export const useTodayAttendance = (scheduleId) => {
    return useQuery({
        queryKey: ['today-attendance', scheduleId],
        queryFn: () => attendanceAPI.getTodayAttendance(scheduleId),
        enabled: !!scheduleId,
        staleTime: 1 * 60 * 1000,
    });
};

export const useSubmitAttendance = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (attendanceData) => attendanceAPI.submitAttendance(attendanceData),
        onSuccess: (data, variables) => {
            toast.success('Data absensi berhasil disimpan!');
            queryClient.invalidateQueries({ queryKey: ['today-attendance', variables.scheduleId] });
            // Optionally invalidate other related queries
        },
        onError: (error) => {
            console.error('Error submitting attendance:', error);
            toast.error('Gagal menyimpan absensi');
        }
    });
};
