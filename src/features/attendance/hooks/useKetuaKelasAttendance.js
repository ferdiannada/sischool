import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';
import { attendanceAPI } from '@/features/attendance/api/attendanceAPI';
import { toast } from 'react-hot-toast';

export const useKetuaKelasSchedules = (userId) => {
    return useQuery({
        queryKey: ['ketua-kelas-schedules', userId],
        queryFn: async () => {
            const data = await dashboardAPI.getKetuaKelasDashboard(userId);
            return data?.success ? (data.today_tasks || []) : [];
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
};

export const useKetuaKelasClassmates = (userId) => {
    return useQuery({
        queryKey: ['ketua-kelas-classmates', userId],
        queryFn: async () => {
            const data = await dashboardAPI.getKetuaKelasClassmates(userId);
            return data?.success ? (data.classmates || []) : [];
        },
        enabled: !!userId,
        staleTime: 10 * 60 * 1000,
    });
};

export const useScheduleAttendance = (scheduleId) => {
    return useQuery({
        queryKey: ['schedule-attendance', scheduleId],
        queryFn: async () => {
            if (!scheduleId) return [];
            return await attendanceAPI.getTodayAttendance(scheduleId);
        },
        enabled: !!scheduleId,
        staleTime: 1 * 60 * 1000,
    });
};

export const useSubmitKetuaKelasAttendance = () => {
    return useMutation({
        mutationFn: ({ userId, scheduleId, attendanceData }) =>
            dashboardAPI.submitKetuaKelasAttendance(userId, scheduleId, attendanceData),
        onSuccess: (result) => {
            if (result?.success) {
                toast.success('Absensi berhasil disimpan!');
            } else {
                toast.error(result?.error || 'Gagal menyimpan absensi');
            }
        },
        onError: (error) => {
            console.error('Submit failed:', error);
            toast.error('Gagal menyimpan absensi');
        }
    });
};
