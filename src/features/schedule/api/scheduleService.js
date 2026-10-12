import { supabase } from '@/lib/supabase';

/**
 * Schedule Service - Handles schedule/jadwal operations
 */
export const scheduleService = {
    /**
     * Get schedules for a class
     */
    async getClassSchedule(kelasId) {
        const { data, error } = await supabase
            .from('schedules')
            .select(`
        *,
        mata_pelajaran (id, kode, nama),
        guru (
          id,
          nip,
          user:users (full_name)
        )
      `)
            .eq('kelas_id', kelasId)
            .order('hari')
            .order('jam_mulai');

        if (error) throw error;
        return data;
    },

    /**
     * Get schedules for a teacher (guru)
     */
    async getTeacherSchedule(guruId) {
        const { data, error } = await supabase
            .from('schedules')
            .select(`
        *,
        kelas (id, nama, tingkat),
        mata_pelajaran (id, kode, nama)
      `)
            .eq('guru_id', guruId)
            .order('hari')
            .order('jam_mulai');

        if (error) throw error;
        return data;
    },

    /**
     * Get today's schedule for a class
     */
    async getTodaySchedule(kelasId) {
        const today = new Date().getDay() || 7; // Convert Sunday (0) to 7

        const { data, error } = await supabase
            .from('schedules')
            .select(`
        *,
        mata_pelajaran (id, kode, nama),
        guru (
          id,
          user:users (full_name)
        )
      `)
            .eq('kelas_id', kelasId)
            .eq('hari', today)
            .order('jam_mulai');

        if (error) throw error;
        return data;
    },

    /**
     * Create schedule
     */
    async createSchedule(scheduleData) {
        const { data, error } = await supabase
            .from('schedules')
            .insert(scheduleData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update schedule
     */
    async updateSchedule(scheduleId, updates) {
        const { data, error } = await supabase
            .from('schedules')
            .update(updates)
            .eq('id', scheduleId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Delete schedule
     */
    async deleteSchedule(scheduleId) {
        const { error } = await supabase
            .from('schedules')
            .delete()
            .eq('id', scheduleId);

        if (error) throw error;
    },

    /**
     * Get all mata pelajaran
     */
    async getMataPelajaran() {
        const { data, error } = await supabase
            .from('mata_pelajaran')
            .select('*')
            .eq('is_active', true)
            .order('nama');

        if (error) throw error;
        return data;
    },

    /**
     * Bulk create schedules
     */
    async bulkCreateSchedule(schedules) {
        const { data, error } = await supabase
            .from('schedules')
            .insert(schedules)
            .select();

        if (error) throw error;
        return data;
    },
};

export default scheduleService;
