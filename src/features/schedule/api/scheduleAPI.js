/**
 * Schedule API Service
 * Handles CRUD for jadwal pelajaran
 * Refactored to use Supabase Client
 */

import { supabase } from '../../../lib/supabase';

export const scheduleAPI = {
    /**
     * Get all schedules with relations
     */
    async getSchedules(filters = {}) {
        try {
            // Use !inner to allow filtering by tahun_ajaran properties
            let query = supabase
                .from('schedules')
                .select(`
                    *,
                    kelas (id, nama),
                    mata_pelajaran (id, kode, nama),
                    guru (id, user:users (full_name)),
                    tahun_ajaran!inner (nama, is_active)
                `);

            if (filters.kelasId) {
                query = query.eq('kelas_id', filters.kelasId);
            }
            if (filters.guruId) {
                query = query.eq('guru_id', filters.guruId);
            }
            if (filters.hari) {
                query = query.eq('hari', filters.hari);
            }

            // Filter by Tahun Ajaran
            if (filters.tahunAjaranId) {
                query = query.eq('tahun_ajaran_id', filters.tahunAjaranId);
            } else {
                // Default: Only show active academic year
                query = query.eq('tahun_ajaran.is_active', true);
            }

            const { data, error } = await query.order('hari', { ascending: true }).order('jam_mulai', { ascending: true });

            if (error) throw error;

            return data?.map(s => ({
                id: s.id,
                kelasId: s.kelas_id,
                kelasNama: s.kelas?.nama || '-',
                mapelId: s.mata_pelajaran_id,
                mapelKode: s.mata_pelajaran?.kode,
                mapelNama: s.mata_pelajaran?.nama || '-',
                guruId: s.guru_id,
                guruNama: s.guru?.user?.full_name || '-',
                hari: s.hari,
                hariNama: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'][s.hari - 1],
                jamMulai: s.jam_mulai,
                jamSelesai: s.jam_selesai,
                ruangan: s.ruangan,
                tahunAjaran: s.tahun_ajaran?.nama,
            })) || [];
        } catch (error) {
            console.error('Error fetching schedules:', error);
            return [];
        }
    },

    /**
     * Get schedule by ID
     */
    async getScheduleById(id) {
        try {
            const { data, error } = await supabase
                .from('schedules')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching schedule by id:', error);
            return null;
        }
    },

    /**
     * Create new schedule
     */
    async createSchedule(data) {
        const { data: result, error } = await supabase
            .from('schedules')
            .insert({
                kelas_id: data.kelasId,
                mata_pelajaran_id: data.mapelId,
                guru_id: data.guruId,
                hari: data.hari,
                jam_mulai: data.jamMulai,
                jam_selesai: data.jamSelesai,
                ruangan: data.ruangan || null,
                tahun_ajaran_id: data.tahunAjaranId || null,
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Update schedule
     */
    async updateSchedule(id, data) {
        const { data: result, error } = await supabase
            .from('schedules')
            .update({
                kelas_id: data.kelasId,
                mata_pelajaran_id: data.mapelId,
                guru_id: data.guruId,
                hari: data.hari,
                jam_mulai: data.jamMulai,
                jam_selesai: data.jamSelesai,
                ruangan: data.ruangan,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    /**
     * Delete schedule
     */
    async deleteSchedule(id) {
        const { data, error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    },

    /**
     * Check for schedule conflicts (Class, Teacher, Room)
     * Returns error message string if conflict exists, or null if safe.
     */
    async checkConflict(data, excludeId = null) {
        const { kelasId, guruId, hari, jamMulai, jamSelesai, ruangan } = data;

        try {
            // Ensure time format is HH:MM:SS for accurate string comparison with DB
            const formatTime = (t) => {
                if (!t) return '00:00:00';
                return t.length === 5 ? `${t}:00` : t;
            };

            const start = formatTime(jamMulai);
            const end = formatTime(jamSelesai);

            // Base query logic: Same day AND Time Overlap
            // Time Overlap: (start1 < end2) AND (end1 > start2)
            // Here: (jam_mulai < jamSelesai) AND (jam_selesai > jamMulai)

            // 1. Check Class Conflict
            let classQuery = supabase
                .from('schedules')
                .select('id, mata_pelajaran(nama), guru(user:users(full_name))')
                .eq('kelas_id', kelasId)
                .eq('hari', hari)
                .lt('jam_mulai', end)
                .gt('jam_selesai', start);

            if (excludeId) classQuery = classQuery.neq('id', excludeId);

            const { data: classConflict, error: classError } = await classQuery;

            if (!classError && classConflict?.length > 0) {
                const conflictItem = classConflict[0];
                const mapelName = conflictItem.mata_pelajaran?.nama || 'Mapel tidak diketahui';
                const guruName = conflictItem.guru?.user?.full_name || 'Guru tidak diketahui';
                return `Jadwal bentrok dengan ${mapelName} (${guruName}) di kelas ini.`;
            }

            // 2. Check Teacher Conflict
            let teacherQuery = supabase
                .from('schedules')
                .select('id, kelas(nama), mata_pelajaran(nama)')
                .eq('guru_id', guruId)
                .eq('hari', hari)
                .lt('jam_mulai', end)
                .gt('jam_selesai', start);

            if (excludeId) teacherQuery = teacherQuery.neq('id', excludeId);

            const { data: teacherConflict, error: teacherError } = await teacherQuery;

            if (!teacherError && teacherConflict?.length > 0) {
                const conflictClass = teacherConflict[0].kelas?.nama || 'kelas lain';
                const mapelName = teacherConflict[0].mata_pelajaran?.nama || '';
                return `Guru sedang mengajar ${mapelName} di ${conflictClass} pada jam tersebut.`;
            }

            // 3. Check Room Conflict (if room is specified)
            if (ruangan) {
                let roomQuery = supabase
                    .from('schedules')
                    .select('id, kelas(nama)')
                    .eq('ruangan', ruangan)
                    .eq('hari', hari)
                    .lt('jam_mulai', end)
                    .gt('jam_selesai', start);

                if (excludeId) roomQuery = roomQuery.neq('id', excludeId);

                const { data: roomConflict, error: roomError } = await roomQuery;

                if (!roomError && roomConflict?.length > 0) {
                    const conflictClass = roomConflict[0].kelas?.nama || 'kelas lain';
                    return `Ruangan ${ruangan} sedang digunakan oleh ${conflictClass}.`;
                }
            }

            return null; // No conflict

        } catch (error) {
            console.error('Error checking conflicts:', error);
            // Fail safe: return null or error? 
            // Better to not block if check fails, but log it.
            return null;
        }
    },

    /**
     * Get schedule summary per kelas
     */
    async getScheduleSummary() {
        try {
            const { data, error } = await supabase
                .from('schedules')
                .select('kelas_id,kelas(nama)')
                .order('kelas_id');

            if (error) throw error;

            // Group by kelas
            const summary = {};
            data?.forEach(s => {
                if (!summary[s.kelas_id]) {
                    summary[s.kelas_id] = {
                        kelasId: s.kelas_id,
                        kelasNama: s.kelas?.nama,
                        jumlahJadwal: 0,
                    };
                }
                summary[s.kelas_id].jumlahJadwal++;
            });

            return Object.values(summary);
        } catch (error) {
            console.error('Error fetching schedule summary:', error);
            return [];
        }
    },

    // Helper: Get all kelas for dropdown
    async getKelasList() {
        try {
            const { data, error } = await supabase
                .from('kelas')
                .select('id,nama')
                .order('nama', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching kelas list:', error);
            return [];
        }
    },

    // Helper: Get all mapel for dropdown
    async getMapelList() {
        try {
            const { data, error } = await supabase
                .from('mata_pelajaran')
                .select('id,kode,nama')
                .eq('is_active', true)
                .order('nama', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching mapel list:', error);
            return [];
        }
    },

    // Helper: Get all guru for dropdown
    async getGuruList() {
        try {
            const { data, error } = await supabase
                .from('guru')
                .select('id,user:users(full_name)')
                .eq('status', 'aktif');

            if (error) throw error;

            return data?.map(g => ({
                id: g.id,
                nama: g.user?.full_name || 'N/A',
            })) || [];
        } catch (error) {
            console.error('Error fetching guru list:', error);
            return [];
        }
    },
};

export default scheduleAPI;
