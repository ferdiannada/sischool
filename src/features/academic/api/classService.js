import { supabase } from '@/lib/supabase';

/**
 * Class Service - Handles kelas/class operations
 */
export const classService = {
    /**
     * Get all classes
     */
    async getClasses({ tahunAjaranId, tingkat } = {}) {
        let query = supabase
            .from('kelas')
            .select(`
        *,
        tahun_ajaran (nama, semester),
        wali_kelas:users!kelas_wali_kelas_id_fkey (id, full_name),
        ketua_kelas:users!kelas_ketua_kelas_id_fkey (id, full_name)
      `);

        if (tahunAjaranId) {
            query = query.eq('tahun_ajaran_id', tahunAjaranId);
        }
        if (tingkat) {
            query = query.eq('tingkat', tingkat);
        }

        const { data, error } = await query.order('tingkat').order('nama');

        if (error) throw error;
        return data;
    },

    /**
     * Get class by ID with students
     */
    async getClassById(kelasId) {
        const { data, error } = await supabase
            .from('kelas')
            .select(`
        *,
        tahun_ajaran (nama, semester),
        wali_kelas:users!kelas_wali_kelas_id_fkey (id, full_name, email),
        siswa (
          id,
          nis,
          nisn,
          jenis_kelamin,
          user:users (id, full_name, email, avatar_url)
        )
      `)
            .eq('id', kelasId)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get students in a class
     */
    async getStudentsInClass(kelasId) {
        const { data, error } = await supabase
            .from('siswa')
            .select(`
        *,
        user:users (id, full_name, email, avatar_url, phone)
      `)
            .eq('kelas_id', kelasId)
            .eq('status', 'aktif')
            .order('nis');

        if (error) throw error;
        return data;
    },

    /**
     * Create class
     */
    async createClass(classData) {
        const { data, error } = await supabase
            .from('kelas')
            .insert(classData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update class
     */
    async updateClass(kelasId, updates) {
        const { data, error } = await supabase
            .from('kelas')
            .update(updates)
            .eq('id', kelasId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Assign wali kelas
     */
    async assignWaliKelas(kelasId, userId) {
        return this.updateClass(kelasId, { wali_kelas_id: userId });
    },

    /**
     * Assign ketua kelas
     */
    async assignKetuaKelas(kelasId, userId) {
        return this.updateClass(kelasId, { ketua_kelas_id: userId });
    },

    /**
     * Get active tahun ajaran
     */
    async getActiveTahunAjaran() {
        const { data, error } = await supabase
            .from('tahun_ajaran')
            .select('*')
            .eq('is_active', true)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    /**
     * Get all tahun ajaran
     */
    async getTahunAjaran() {
        const { data, error } = await supabase
            .from('tahun_ajaran')
            .select('*')
            .order('nama', { ascending: false })
            .order('semester', { ascending: false });

        if (error) throw error;
        return data;
    },
};

export default classService;
