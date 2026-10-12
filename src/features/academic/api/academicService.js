/**
 * Academic API Service
 * Handles academic operations: Wali Kelas, Guru, Siswa Dashboards, Classes
 * Refactored to use Supabase Client
 */

import { supabase } from '../../../lib/supabase';
import { usersAPI } from '@/features/users/api/usersAPI';
import { attendanceAPI } from '@/features/attendance/api/attendanceAPI';
import { financeService } from '@/features/finance/api/financeService';
import { getTodayStr } from '@/utils/format';
import { scheduleService } from '@/features/schedule/api/scheduleService';

export const academicService = {
    /**
     * Get guru dashboard data
     */
    async getGuruDashboard(userId) {
        try {
            const today = getTodayStr();
            const { data, error } = await supabase.rpc('get_guru_dashboard', {
                p_user_id: userId,
                p_date: today
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getGuruDashboard error:', error);
            throw error;
        }
    },

    /**
     * Get siswa dashboard data
     */
    async getSiswaDashboard(userId) {
        try {
            const { data: result, error } = await supabase.rpc('get_siswa_dashboard', { p_user_id: userId });

            if (error) throw error;
            if (!result?.success) throw new Error(result?.message || 'Gagal memuat dashboard siswa');

            return {
                siswa: result.siswa,
                schedules: result.schedules || [],
                attendance: result.attendance || { hadir: 0, izin: 0, sakit: 0, alpha: 0 }
            };
        } catch (error) {
            console.error('getSiswaDashboard error:', error);
            throw error;
        }
    },

    /**
     * Get wali kelas dashboard data
     */
    async getWaliKelasDashboard(userId) {
        try {
            const { data, error } = await supabase.rpc('get_walikelas_dashboard', { p_user_id: userId });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getWaliKelasDashboard error:', error);
            throw error;
        }
    },

    /**
     * Get all students with pagination and search
     */
    async getAllStudents(page = 1, limit = 10, search = '', classId = null, status = 'aktif') {
        try {
            const { data, error } = await supabase.rpc('get_all_students', {
                p_page: page,
                p_limit: limit,
                p_search: search,
                p_class_id: classId,
                p_status: status
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getAllStudents error:', error);
            throw error;
        }
    },

    /**
     * Get all classes
     */
    async getClasses(activeOnly = true) {
        try {
            const { data, error } = await supabase
                .from('kelas')
                .select('*')
                .order('nama', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getClasses error:', error);
            throw error;
        }
    },

    // ============================================
    // WALI KELAS SPECIFIC
    // ============================================

    async getWaliKelasClassStudents(userId) {
        try {
            const { data, error } = await supabase.rpc('get_walikelas_class_students', { p_user_id: userId });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getWaliKelasClassStudents error:', error);
            throw error;
        }
    },

    async getWaliKelasMonitoring(userId, month = null, year = null) {
        try {
            const { data, error } = await supabase.rpc('get_walikelas_attendance_monitoring', {
                p_user_id: userId,
                p_month: month,
                p_year: year
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getWaliKelasMonitoring error:', error);
            throw error;
        }
    },

    async getWaliKelasMonthlyReport(userId, month, year) {
        try {
            const { data, error } = await supabase.rpc('get_walikelas_monthly_report', {
                p_user_id: userId,
                p_month: month,
                p_year: year
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getWaliKelasMonthlyReport error:', error);
            throw error;
        }
    },

    async getWaliKelasSemesterReport(userId, semester, year) {
        try {
            const { data, error } = await supabase.rpc('get_walikelas_semester_report', {
                p_user_id: userId,
                p_semester: semester,
                p_year: year
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getWaliKelasSemesterReport error:', error);
            throw error;
        }
    },

    async getStudentAttendanceCard(siswaId, semester, year) {
        try {
            const { data, error } = await supabase.rpc('get_student_attendance_card', {
                p_siswa_id: siswaId,
                p_semester: semester,
                p_year: year
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getStudentAttendanceCard error:', error);
            throw error;
        }
    },

    async getWaliKelasProfile(userId) {
        try {
            const { data, error } = await supabase.rpc('get_walikelas_profile', { p_user_id: userId });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getWaliKelasProfile error:', error);
            throw error;
        }
    },

    async searchWaliCandidates(query) {
        try {
            const { data, error } = await supabase.rpc('search_wali_candidates', { p_query: query });
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('searchWaliCandidates error:', error);
            throw error;
        }
    },

    async createAndAssignWali(siswaId, waliData) {
        try {
            let waliUserId = null;
            const candidates = await this.searchWaliCandidates(waliData.email) || [];
            const existingUser = candidates.find(u => u.email.toLowerCase() === waliData.email.toLowerCase());

            if (existingUser) {
                waliUserId = existingUser.id;
            } else {
                const roles = await usersAPI.getRoles() || [];
                const waliRole = roles.find(r => r.name === 'wali_murid');

                const newUser = await usersAPI.createUser({
                    name: waliData.name,
                    email: waliData.email,
                    phone: waliData.phone,
                    roleIds: [waliRole?.id],
                    isActive: true,
                    password: 'password123'
                });
                waliUserId = newUser.id;
            }

            if (waliUserId) {
                const { data, error } = await supabase.rpc('create_and_assign_wali', {
                    p_siswa_id: siswaId,
                    p_user_id: waliUserId,
                    p_hubungan: waliData.hubungan,
                    p_phone: waliData.phone
                });
                if (error) throw error;
                return data;
            }
            throw new Error('Gagal mendapatkan User ID');
        } catch (error) {
            console.error('createAndAssignWali error:', error);
            throw error;
        }
    },

    async assignWaliToStudent(studentId, userId, hubungan) {
        try {
            const { data, error } = await supabase.rpc('create_and_assign_wali', {
                p_siswa_id: studentId,
                p_user_id: userId,
                p_hubungan: hubungan
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('assignWaliToStudent error:', error);
            throw error;
        }
    },

    async assignKetuaKelas(kelasId, siswaUserId) {
        try {
            const { data, error } = await supabase.rpc('assign_ketua_kelas', {
                p_kelas_id: kelasId,
                p_siswa_user_id: siswaUserId
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('assignKetuaKelas error:', error);
            throw error;
        }
    },

    async removeKetuaKelas(kelasId) {
        try {
            const { data, error } = await supabase.rpc('remove_ketua_kelas', {
                p_kelas_id: kelasId
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('removeKetuaKelas error:', error);
            throw error;
        }
    },

    // ============================================
    // KETUA KELAS FUNCTIONS
    // ============================================

    async getKetuaKelasDashboard(userId) {
        try {
            const { data, error } = await supabase.rpc('get_ketuakelas_dashboard', { p_user_id: userId });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getKetuaKelasDashboard error:', error);
            throw error;
        }
    },

    async getKetuaKelasClassmates(userId) {
        try {
            const { data, error } = await supabase.rpc('get_ketuakelas_classmates', { p_user_id: userId });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getKetuaKelasClassmates error:', error);
            throw error;
        }
    },

    async getKetuaKelasSchedule(userId) {
        try {
            const { data, error } = await supabase.rpc('get_ketuakelas_schedule', { p_user_id: userId });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getKetuaKelasSchedule error:', error);
            throw error;
        }
    },

    async getKetuaKelasProfile(userId) {
        try {
            const { data, error } = await supabase.rpc('get_ketuakelas_profile', { p_user_id: userId });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getKetuaKelasProfile error:', error);
            throw error;
        }
    },

    async submitKetuaKelasAttendance(userId, scheduleId, attendances) {
        try {
            const { data, error } = await supabase.rpc('submit_ketuakelas_attendance', {
                p_user_id: userId,
                p_schedule_id: scheduleId,
                p_attendances: attendances
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('submitKetuaKelasAttendance error:', error);
            throw error;
        }
    },

    // ============================================
    // WALI MURID SPECIFIC
    // ============================================

    async getStudentProfileDetail(studentId) {
        try {
            const { data, error } = await supabase.rpc('get_student_profile_detail', { p_student_id: studentId });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getStudentProfileDetail error:', error);
            throw error;
        }
    },

    async getWaliMuridProfile(userId) {
        try {
            const { data, error } = await supabase.rpc('get_wali_profile', { p_user_id: userId });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getWaliMuridProfile error:', error);
            throw error;
        }
    },

    /**
     * Get Wali Murid Dashboard Data
     * Aggregates data from multiple sources
     */
    async getWaliMuridDashboard(userId) {
        try {
            // 1. Get Children (using financeService to keep it central)
            const children = await financeService.getWaliMuridChildren(userId);
            if (!children || children.length === 0) {
                return {
                    student: null,
                    attendance_summary: { hadir: 0, izin: 0, sakit: 0, alpha: 0 },
                    billing_summary: { total_pending_invoices: 0, total_unpaid_amount: 0 },
                    recent_attendance: [],
                    todays_schedule: []
                };
            }

            const studentId = children[0].id;
            const studentName = children[0].full_name;

            const today = new Date();
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

            // Parallel fetch for dashboard components
            const [statsData, billableInvoices] = await Promise.all([
                attendanceAPI.getStudentAttendanceHistory(studentId, 100),
                financeService.getBillableInvoices(studentId)
            ]);

            const thisMonthStats = statsData.filter(item => item.tanggal >= firstDayOfMonth && item.tanggal <= lastDayOfMonth);
            const attendance_summary = {
                hadir: thisMonthStats.filter(i => i.status === 'hadir').length,
                izin: thisMonthStats.filter(i => i.status === 'izin').length,
                sakit: thisMonthStats.filter(i => i.status === 'sakit').length,
                alpha: thisMonthStats.filter(i => i.status === 'alpha').length,
            };

            const billing_summary = {
                total_pending_invoices: Array.isArray(billableInvoices) ? billableInvoices.length : 0,
                total_unpaid_amount: Array.isArray(billableInvoices) ? billableInvoices.reduce((sum, inv) =>
                    sum + (Number(inv.amount) || Number(inv.nominal) || 0) - (Number(inv.paid_amount) || 0), 0) : 0
            };

            const recent_attendance = statsData.slice(0, 5).map(item => ({
                id: item.id,
                tanggal: item.tanggal,
                status: item.status,
                waktu: item.waktu_hadir ? item.waktu_hadir.split('T')[1].substring(0, 5) : '-',
                child_name: studentName,
                mata_pelajaran: item.schedule?.mata_pelajaran?.nama || 'N/A',
                catatan: item.catatan
            }));

            // 2. Get Today's Schedule if student exists
            let todays_schedule = [];
            if (studentId) {
                try {
                    // Check if student object has kelas_id, otherwise we might need to fetch it
                    // Assuming get_wali_children returns kelas_id. If not, we might need a separate call or update the RPC.
                    // For now, let's try to use children[0].kelas_id or similar safely.
                    const kelasId = children[0].kelas_id || children[0].kelas?.id;

                    if (kelasId) {
                        const schedules = await scheduleService.getTodaySchedule(kelasId);

                        todays_schedule = schedules.map(s => ({
                            id: s.id,
                            subject: s.mata_pelajaran?.nama || 'Unknown Subject',
                            time: `${s.jam_mulai?.substring(0, 5)} - ${s.jam_selesai?.substring(0, 5)}`,
                            teacher: s.guru?.user?.full_name || 'Unknown Teacher',
                            room: s.ruangan || '-' // Fix typo in property name if any, assuming 'ruangan'
                        }));
                    }
                } catch (err) {
                    console.error('Error fetching student schedule:', err);
                    // Don't block the whole dashboard if schedule fails
                }
            }

            return {
                student: children[0],
                attendance_summary,
                billing_summary,
                recent_attendance,
                todays_schedule
            };

        } catch (error) {
            console.error('getWaliMuridDashboard error:', error);
            throw error;
        }
    }
};

export default academicService;
