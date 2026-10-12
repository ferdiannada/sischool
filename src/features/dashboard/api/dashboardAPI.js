/**
 * Dashboard API Service
 * @deprecated This file is deprecated. Use domain-specific services instead:
 * - adminService: Admin stats
 * - financeService: TU/Finance operations
 * - academicService: Guru, Siswa, Wali Kelas, Ketua Kelas operations
 * - attendanceAPI: Attendance operations
 */

import adminService from '@/features/admin/api/adminService';
import financeService from '@/features/finance/api/financeService';
import academicService from '@/features/academic/api/academicService';
import attendanceAPI from '@/features/attendance/api/attendanceAPI';

import notificationService from '@/features/notifications/api/notificationService';

export const dashboardAPI = {
    ...adminService,
    ...financeService,
    ...academicService,
    ...notificationService,
    getWeeklyAttendance: attendanceAPI.getWeeklyAttendance,
};

export default dashboardAPI;
