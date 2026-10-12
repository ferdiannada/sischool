/**
 * Master Data API Service
 * Handles CRUD for kelas, mata pelajaran, tahun ajaran
 * Refactored to use Supabase Client
 */

import { supabase } from '../../../lib/supabase';

export const masterDataAPI = {
    // ============================================
    // KELAS
    // ============================================

    async getKelas() {
        try {
            // simplified query
            const { data, error } = await supabase
                .from('kelas')
                .select(`
                    *,
                    jurusan (*),
                    wali_kelas:users!wali_kelas_id (full_name)
                `)
                .order('nama', { ascending: true });

            if (error) throw error;

            // Fetch student counts to populate the "Siswa" column
            const { data: siswaData, error: siswaError } = await supabase
                .from('siswa')
                .select('kelas_id');

            const studentCounts = {};

            if (!siswaError && siswaData) {
                siswaData.forEach(s => {
                    if (s.kelas_id) {
                        studentCounts[s.kelas_id] = (studentCounts[s.kelas_id] || 0) + 1;
                    }
                });
            }

            // If we need related data, do separate calls or handle nulls
            return data?.map(k => ({
                id: k.id,
                nama: k.nama,
                tingkat: k.tingkat,
                jurusan: k.jurusan?.nama || '-',
                jurusanId: k.jurusan_id,
                waliKelasId: k.wali_kelas_id,
                waliKelas: k.wali_kelas?.full_name || '-',
                ketuaKelas: '-',
                tahunAjaranId: k.tahun_ajaran_id,
                tahunAjaran: '-', // Or fetch name if needed, but ID is enough for edit form
                jumlahSiswa: studentCounts[k.id] || 0,
            })) || [];
        } catch (error) {
            console.error('Error fetching kelas:', error);
            return [];
        }
    },

    async createKelas(data) {
        const { data: result, error } = await supabase
            .from('kelas')
            .insert({
                nama: data.nama,
                tingkat: data.tingkat,
                jurusan_id: data.jurusanId || null,
                wali_kelas_id: data.waliKelasId || null,
                tahun_ajaran_id: data.tahunAjaranId || null,
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async updateKelas(id, data) {
        const payload = {};
        if (data.nama !== undefined) payload.nama = data.nama;
        if (data.tingkat !== undefined) payload.tingkat = data.tingkat;
        if (data.jurusanId !== undefined) payload.jurusan_id = data.jurusanId || null;
        if (data.waliKelasId !== undefined) payload.wali_kelas_id = data.waliKelasId || null;

        const { data: result, error } = await supabase
            .from('kelas')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async deleteKelas(id) {
        const { data, error } = await supabase
            .from('kelas')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    },

    // ============================================
    // JURUSAN
    // ============================================

    async getJurusan() {
        try {
            const { data, error } = await supabase
                .from('jurusan')
                .select('*')
                .order('nama', { ascending: true });

            if (error) throw error;

            return data?.map(j => ({
                id: j.id,
                nama: j.nama,
                kode: j.kode,
                deskripsi: j.deskripsi,
                isActive: j.is_active,
            })) || [];
        } catch (error) {
            console.error('Error fetching jurusan:', error);
            return [];
        }
    },

    async createJurusan(data) {
        const { data: result, error } = await supabase
            .from('jurusan')
            .insert({
                nama: data.nama,
                kode: data.kode,
                deskripsi: data.deskripsi || null,
                is_active: true,
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async updateJurusan(id, data) {
        const { data: result, error } = await supabase
            .from('jurusan')
            .update({
                nama: data.nama,
                kode: data.kode,
                deskripsi: data.deskripsi,
                is_active: data.isActive,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async deleteJurusan(id) {
        const { data, error } = await supabase
            .from('jurusan')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    },

    // ============================================
    // MATA PELAJARAN
    // ============================================

    async getMataPelajaran() {
        try {
            const { data, error } = await supabase
                .from('mata_pelajaran')
                .select('*')
                .order('nama', { ascending: true });

            if (error) throw error;

            return data?.map(mp => ({
                id: mp.id,
                kode: mp.kode,
                nama: mp.nama,
                deskripsi: mp.deskripsi,
                isActive: mp.is_active,
            })) || [];
        } catch (error) {
            console.error('Error fetching mata pelajaran:', error);
            return [];
        }
    },

    async createMataPelajaran(data) {
        const { data: result, error } = await supabase
            .from('mata_pelajaran')
            .insert({
                kode: data.kode,
                nama: data.nama,
                deskripsi: data.deskripsi || null,
                is_active: true,
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async updateMataPelajaran(id, data) {
        const { data: result, error } = await supabase
            .from('mata_pelajaran')
            .update({
                kode: data.kode,
                nama: data.nama,
                deskripsi: data.deskripsi,
                is_active: data.isActive,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async deleteMataPelajaran(id) {
        const { data, error } = await supabase
            .from('mata_pelajaran')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    },

    // ============================================
    // TAHUN AJARAN
    // ============================================

    async getTahunAjaran() {
        try {
            const { data, error } = await supabase
                .from('tahun_ajaran')
                .select('*')
                .order('nama', { ascending: false });

            if (error) throw error;

            return data?.map(ta => ({
                id: ta.id,
                nama: ta.nama,
                semester: ta.semester,
                tanggalMulai: ta.tanggal_mulai,
                tanggalSelesai: ta.tanggal_selesai,
                isActive: ta.is_active,
            })) || [];
        } catch (error) {
            console.error('Error fetching tahun ajaran:', error);
            return [];
        }
    },

    async createTahunAjaran(data) {
        const { data: result, error } = await supabase
            .from('tahun_ajaran')
            .insert({
                nama: data.nama,
                semester: data.semester,
                tanggal_mulai: data.tanggalMulai,
                tanggal_selesai: data.tanggalSelesai,
                is_active: data.isActive ?? false,
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async updateTahunAjaran(id, data) {
        const { data: result, error } = await supabase
            .from('tahun_ajaran')
            .update({
                nama: data.nama,
                semester: data.semester,
                tanggal_mulai: data.tanggalMulai,
                tanggal_selesai: data.tanggalSelesai,
                is_active: data.isActive,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async setActiveTahunAjaran(id) {
        // Deactivate all first
        await supabase
            .from('tahun_ajaran')
            .update({ is_active: false })
            .eq('is_active', true);

        // Activate selected
        const { data, error } = await supabase
            .from('tahun_ajaran')
            .update({ is_active: true })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteTahunAjaran(id) {
        const { data, error } = await supabase
            .from('tahun_ajaran')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    },

    // ============================================
    // JAM PELAJARAN (Time Slots)
    // ============================================

    async getJamPelajaran() {
        try {
            const { data, error } = await supabase
                .from('jam_pelajaran')
                .select('*')
                .order('day_set', { ascending: true })
                .order('urutan', { ascending: true });

            if (error) throw error;

            return data?.map(jp => ({
                id: jp.id,
                urutan: jp.urutan,
                waktuMulai: jp.waktu_mulai?.slice(0, 5), // "07:00:00" -> "07:00"
                waktuSelesai: jp.waktu_selesai?.slice(0, 5),
                keterangan: jp.keterangan || '-',
                isIstirahat: jp.is_istirahat,
                daySet: jp.day_set || 'senin_kamis',
            })) || [];
        } catch (error) {
            console.error('Error fetching jam pelajaran:', error);
            return [];
        }
    },

    async createJamPelajaran(data) {
        const { data: result, error } = await supabase
            .from('jam_pelajaran')
            .insert({
                urutan: data.urutan,
                waktu_mulai: data.waktuMulai,
                waktu_selesai: data.waktuSelesai,
                keterangan: data.keterangan || null,
                is_istirahat: data.isIstirahat || false,
                day_set: data.daySet || 'senin_kamis',
            })
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async updateJamPelajaran(id, data) {
        const { data: result, error } = await supabase
            .from('jam_pelajaran')
            .update({
                urutan: data.urutan,
                waktu_mulai: data.waktuMulai,
                waktu_selesai: data.waktuSelesai,
                keterangan: data.keterangan,
                is_istirahat: data.isIstirahat,
                day_set: data.daySet,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return result;
    },

    async deleteJamPelajaran(id) {
        const { data, error } = await supabase
            .from('jam_pelajaran')
            .delete()
            .eq('id', id)
            .select();

        if (error) throw error;
        return data;
    },

    // ============================================
    // STUDENTS BY CLASS
    // ============================================

    async getStudentsByClass(kelasId) {
        try {
            const { data, error } = await supabase
                .from('siswa')
                .select(`
                    id,
                    nis,
                    nisn,
                    jenis_kelamin,
                    status,
                    users!inner (
                        id,
                        full_name,
                        email,
                        avatar_url
                    )
                `)
                .eq('kelas_id', kelasId)
                .order('nis', { ascending: true });

            if (error) throw error;

            return data?.map((s, index) => ({
                no: index + 1,
                id: s.id,
                userId: s.users?.id,
                nama: s.users?.full_name || '-',
                email: s.users?.email || '-',
                nis: s.nis || '-',
                nisn: s.nisn || '-',
                jenisKelamin: s.jenis_kelamin === 'L' ? 'Laki-laki' : s.jenis_kelamin === 'P' ? 'Perempuan' : '-',
                jenisKelaminShort: s.jenis_kelamin || '-',
                status: s.status || 'aktif',
                avatarUrl: s.users?.avatar_url,
            })) || [];
        } catch (error) {
            console.error('Error fetching students by class:', error);
            return [];
        }
    },

    // ============================================
    // HELPERS
    // ============================================

    async getGuruList() {
        try {
            // Get all active users with role 'guru' for wali kelas selection
            // Requires join on user_roles and roles
            const { data, error } = await supabase
                .from('users')
                .select('id, full_name, user_roles!inner(roles!inner(name))')
                .eq('is_active', true)
                .eq('user_roles.roles.name', 'guru')
                .order('full_name', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching guru list:', error);
            return [];
        }
    },
};

export default masterDataAPI;
