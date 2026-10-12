/**
 * Admin API Service
 * Handles admin-specific operations and dashboard stats
 * Refactored to use Supabase Client
 */

import { supabase } from '@/lib/supabase';
import usersAPI from '@/features/users/api/usersAPI';

export const adminService = {
    /**
     * Get admin dashboard stats
     * Optimized to use RPC or parallel queries
     */
    async getAdminStats() {
        try {
            console.log('Fetching admin dashboard stats from RPC...');
            const { data: rpcResult, error } = await supabase.rpc('get_admin_dashboard');

            if (error) {
                console.warn('Admin Dashboard RPC failed, falling back:', error.message);
                throw error;
            }

            if (rpcResult && (rpcResult.totalSiswa > 0 || rpcResult.totalGuru > 0)) {
                console.log('Admin Dashboard Stats loaded via RPC');
                return rpcResult;
            }

            console.warn('Admin Dashboard RPC returned empty/invalid data, checking fallback...');
            throw new Error('RPC empty');
        } catch (error) {
            // Fallback: Use getUsers from usersAPI (same as User Management page)
            try {
                // Parallel queries
                const [usersResult, kelasData, attendanceData] = await Promise.all([
                    usersAPI.getUsers({ limit: 1000 }), // Fetch more for fallback
                    supabase.from('kelas').select('id'),
                    supabase.from('attendances')
                        .select('status')
                        .eq('tanggal', new Date().toISOString().split('T')[0])
                ]);

                const allUsers = usersResult.data || [];
                const totalSiswa = allUsers.filter(u => u.roles.includes('siswa')).length;
                const totalGuru = allUsers.filter(u => u.roles.includes('guru')).length;

                const kelasCount = kelasData.data?.length || 0;
                const attendances = attendanceData.data || [];

                // Calculate attendance percentage
                const totalToday = attendances.length;
                const hadirToday = attendances.filter(a => a.status === 'hadir').length;
                const attendanceRate = totalToday > 0 ? ((hadirToday / totalToday) * 100).toFixed(1) : '0';

                return {
                    totalSiswa,
                    totalGuru,
                    totalKelas: kelasCount,
                    attendanceRate: `${attendanceRate}%`,
                    todayStats: {
                        hadir: hadirToday,
                        total: totalToday
                    }
                };
            } catch (fallbackError) {
                console.error('Admin stats fallback failed:', fallbackError);
                return {
                    totalSiswa: 0,
                    totalGuru: 0,
                    totalKelas: 0,
                    attendanceRate: '0%',
                    todayStats: { hadir: 0, total: 0 }
                };
            }
        }
    },

    /**
     * Get School Info
     */
    async getSchoolInfo() {
        try {
            const { data, error } = await supabase.rpc('get_school_info');
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching school info:', error);
            return [];
        }
    },

    /**
     * Update School Info
     */
    async updateSchoolInfo(data) {
        try {
            const { data: result, error } = await supabase.rpc('update_school_info', data);
            if (error) throw error;
            return result;
        } catch (error) {
            console.error('Error updating school info:', error);
            throw error;
        }
    },

    /**
     * Upload School Logo
     */
    async uploadSchoolLogo(file) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `school-logo-${Date.now()}.${fileExt}`;
            const filePath = `public/${fileName}`;

            // Try 'images' bucket first as it's common
            const BUCKET_NAME = 'images';

            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error) {
            console.error('Error uploading logo:', error);
            throw error;
        }
    }
};

export default adminService;
