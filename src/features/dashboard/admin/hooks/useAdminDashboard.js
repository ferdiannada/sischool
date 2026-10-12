import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/features/admin/api/adminService';
import { attendanceAPI } from '@/features/attendance/api/attendanceAPI';

export const useAdminDashboard = () => {
    const [greeting] = useState(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Selamat Pagi';
        if (hour < 15) return 'Selamat Siang';
        if (hour < 18) return 'Selamat Sore';
        return 'Selamat Malam';
    });

    // Fetch Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['admin', 'stats'],
        queryFn: async () => {
            const data = await adminService.getAdminStats();
            // Process attendance rate if needed
            const rateStr = data.attendanceRate || '0';
            const rate = parseFloat(rateStr.replace('%', '')) || 0;
            return { ...data, attendanceRate: rate };
        }
    });

    // Fetch Weekly Attendance
    const { data: chartData, isLoading: chartLoading } = useQuery({
        queryKey: ['admin', 'weeklyAttendance'],
        queryFn: attendanceAPI.getWeeklyAttendance
    });

    const loading = statsLoading || chartLoading;

    return {
        loading,
        stats: stats || { totalSiswa: 0, totalGuru: 0, totalKelas: 0, attendanceRate: 0 },
        chartData: (chartData && chartData.length > 0) ? chartData : [
            { name: 'Sen', hadir: 0 },
            { name: 'Sel', hadir: 0 },
            { name: 'Rab', hadir: 0 },
            { name: 'Kam', hadir: 0 },
            { name: 'Jum', hadir: 0 },
            { name: 'Sab', hadir: 0 },
        ],
        greeting
    };
};
