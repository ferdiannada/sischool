/**
 * Siswa API Service
 * Handles student profile management and class assignment
 */

import { supabase } from '../../../lib/supabase';

export const siswaAPI = {
    /**
     * Get all siswa with user info
     */
    async getAllSiswa() {
        try {
            const { data, error } = await supabase
                .from('siswa')
                .select(`
                    id,
                    user_id,
                    nis,
                    nisn,
                    jenis_kelamin,
                    tanggal_lahir,
                    status,
                    alamat,
                    kelas_id,
                    user:users (
                        id,
                        full_name,
                        email
                    ),
                    kelas (
                        id,
                        nama
                    )
                `)
                .order('nis', { ascending: true });

            if (error) throw error;

            return data?.map(s => ({
                id: s.id,
                userId: s.user_id,
                nis: s.nis,
                nisn: s.nisn,
                nama: s.user?.full_name || 'N/A',
                email: s.user?.email || '',
                kelasId: s.kelas_id,
                kelasNama: s.kelas?.nama || null,
                jenisKelamin: s.jenis_kelamin,
                tanggalLahir: s.tanggal_lahir,
                status: s.status,
            })) || [];
        } catch (error) {
            console.error('Error fetching siswa:', error);
            return [];
        }
    },

    /**
     * Get siswa by kelas ID
     */
    async getSiswaByKelas(kelasId) {
        try {
            const { data, error } = await supabase
                .from('siswa')
                .select(`
                    id,
                    user_id,
                    nis,
                    user:users (
                        full_name,
                        email
                    )
                `)
                .eq('kelas_id', kelasId)
                .order('nis', { ascending: true });

            if (error) throw error;

            return data?.map(s => ({
                id: s.id,
                userId: s.user_id,
                nis: s.nis,
                nama: s.user?.full_name || 'N/A',
                email: s.user?.email || '',
            })) || [];
        } catch (error) {
            console.error('Error fetching siswa by kelas:', error);
            return [];
        }
    },

    /**
     * Get siswa without class assignment
     */
    async getUnassignedSiswa() {
        try {
            const { data, error } = await supabase
                .from('siswa')
                .select(`
                    id,
                    user_id,
                    nis,
                    user:users (
                        full_name,
                        email
                    )
                `)
                .is('kelas_id', null)
                .order('nis', { ascending: true });

            if (error) throw error;

            return data?.map(s => ({
                id: s.id,
                userId: s.user_id,
                nis: s.nis,
                nama: s.user?.full_name || 'N/A',
                email: s.user?.email || '',
            })) || [];
        } catch (error) {
            console.error('Error fetching unassigned siswa:', error);
            return [];
        }
    },

    /**
     * Create siswa profile for a user
     */
    async createSiswa(data) {
        // Use RPC to bypass potential RLS issues and validation
        const { data: result, error } = await supabase.rpc('create_siswa_profile', {
            p_user_id: data.userId,
            p_nis: data.nis,
            p_nisn: data.nisn || null,
            p_kelas_id: data.kelasId || null,
            p_jenis_kelamin: data.jenisKelamin || null,
            p_tanggal_lahir: data.tanggalLahir || null,
            p_alamat: data.alamat || null
        });

        if (error) throw error;
        return result;
    },

    /**
     * Assign single siswa to a kelas
     */
    async assignToKelas(siswaId, kelasId) {
        const { data, error } = await supabase
            .from('siswa')
            .update({ kelas_id: kelasId })
            .eq('id', siswaId)
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * Bulk assign multiple siswa to a kelas
     * Optimization: Use single query instead of loop
     */
    async bulkAssignToKelas(siswaIds, kelasId) {
        try {
            const { data, error } = await supabase
                .from('siswa')
                .update({ kelas_id: kelasId })
                .in('id', siswaIds)
                .select();

            if (error) throw error;

            return { success: data.length, failed: 0 };
        } catch (error) {
            console.error('Bulk assign error:', error);
            // If completely failed
            return { success: 0, failed: siswaIds.length, error };
        }
    },

    /**
     * Remove siswa from kelas (set kelas_id to null)
     */
    async removeFromKelas(siswaId) {
        const { data, error } = await supabase
            .from('siswa')
            .update({ kelas_id: null })
            .eq('id', siswaId)
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * Get siswa by user ID
     */
    async getSiswaByUserId(userId) {
        try {
            const { data, error } = await supabase
                .from('siswa')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data || null;
        } catch (error) {
            console.error('Error fetching siswa by user:', error);
            return null;
        }
    },

    /**
     * Update siswa profile
     */
    async updateSiswa(siswaId, data) {
        const { data: updated, error } = await supabase
            .from('siswa')
            .update({
                nis: data.nis,
                nisn: data.nisn,
                kelas_id: data.kelasId,
                jenis_kelamin: data.jenisKelamin,
                tanggal_lahir: data.tanggalLahir,
                alamat: data.alamat,
            })
            .eq('id', siswaId)
            .select();

        if (error) throw error;
        return updated;
    },

    /**
     * Check if user has siswa profile
     */
    async hasSiswaProfile(userId) {
        const siswa = await this.getSiswaByUserId(userId);
        return siswa !== null;
    },

    // ============================================
    // NEW RPC FUNCTIONS FOR SISWA DASHBOARD
    // ============================================

    /**
     * Get weekly schedule for siswa
     */
    async getSchedule(userId) {
        try {
            const { data, error } = await supabase.rpc('get_siswa_schedule', {
                p_user_id: userId
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching siswa schedule:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get attendance history for siswa
     */
    async getAttendanceHistory(userId, month = null, year = null) {
        try {
            const { data, error } = await supabase.rpc('get_siswa_attendance_history', {
                p_user_id: userId,
                p_month: month,
                p_year: year
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching siswa attendance history:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get complete profile for siswa
     */
    async getProfile(userId) {
        try {
            const { data, error } = await supabase.rpc('get_siswa_profile', {
                p_user_id: userId
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching siswa profile:', error);
            return { success: false, error: error.message };
        }
    },
};

export default siswaAPI;
