import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    User,
    Users,
    Grid3X3,
    List,
    X,
    Loader2,
    Crown,
    CheckCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import useAuthStore from '@/store/authStore';
import { useClassStudents, useAssignKetuaKelas, useAssignWali } from '@/features/dashboard/wali-kelas/hooks/useWaliKelasStudents';

// Component Imports
import AssignWaliModal from '@/features/dashboard/wali-kelas/components/modals/AssignWaliModal';
import AssignKetuaKelasModal from '@/features/dashboard/wali-kelas/components/modals/AssignKetuaKelasModal';
import StudentDetailModal from '@/features/dashboard/wali-kelas/components/modals/StudentDetailModal';
import StudentCard from '@/features/users/components/StudentCard';
import StudentListRow from '@/features/users/components/StudentListRow';

// Success Toast Component
const SuccessToast = ({ message, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-xl z-50 flex items-center gap-3 min-w-[300px]"
        >
            <div className="bg-green-500 rounded-full p-1">
                <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <p className="font-medium text-sm">{message}</p>
            <button onClick={onClose} className="ml-auto text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

// Main Component
const ClassDetailPage = () => {
    const { user } = useAuthStore();
    const { data: classData, isLoading: loading } = useClassStudents(user?.id);
    const assignKetuaMutation = useAssignKetuaKelas();
    const assignWaliMutation = useAssignWali();

    const data = classData?.success ? {
        kelas: classData.kelas,
        students: classData.students || [],
        total_students: classData.total_students || 0,
        male_count: classData.male_count || 0,
        female_count: classData.female_count || 0,
        ketua_kelas: classData.ketua_kelas || null
    } : {
        kelas: null,
        students: [],
        total_students: 0,
        male_count: 0,
        female_count: 0,
        ketua_kelas: null
    };

    // Derived state for filtered students
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGender, setFilterGender] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Assignment States
    const [studentToAssign, setStudentToAssign] = useState(null);
    const [studentToAssignWali, setStudentToAssignWali] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const handleAssignKetuaKelas = async () => {
        if (!studentToAssign || !data.kelas?.id) return;

        assignKetuaMutation.mutate(
            { kelasId: data.kelas.id, studentUserId: studentToAssign.user_id },
            {
                onSuccess: (result) => {
                    if (result.success) {
                        setSuccessMessage(`${studentToAssign.name} berhasil ditunjuk sebagai Ketua Kelas! 🎉`);
                        setStudentToAssign(null);
                    } else {
                        alert(result.error || 'Gagal menunjuk ketua kelas');
                    }
                },
                onError: (error) => {
                    console.error('Failed to assign ketua kelas:', error);
                    alert('Terjadi kesalahan saat menunjuk ketua kelas');
                }
            }
        );
    };

    const handleAssignWali = (userId, hubungan, newWaliData = null) => {
        if (!studentToAssignWali) return;

        assignWaliMutation.mutate(
            { studentId: studentToAssignWali.id, userId, hubungan, newWaliData },
            {
                onSuccess: (result) => {
                    if (result.success || result?.data?.success) {
                        setSuccessMessage(`Berhasil mengatur wali murid untuk ${studentToAssignWali.name}! 🎉`);
                        setStudentToAssignWali(null);
                    } else {
                        alert(result.message || result.error || 'Gagal mengatur wali murid');
                    }
                },
                onError: (error) => {
                    console.error('Failed to assign wali murid:', error);
                    alert('Terjadi kesalahan saat mengatur wali murid');
                }
            }
        );
    };

    const filteredStudents = data.students.filter(student => {
        const matchesSearch = (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (student.nis || '').includes(searchTerm);
        const matchesGender = filterGender === 'all' || student.gender === filterGender;
        const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
        return matchesSearch && matchesGender && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh]">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-500 animate-pulse">Memuat data siswa...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 -m-6 p-6 space-y-6 font-sans">
            {/* Success Toast */}
            <AnimatePresence>
                {successMessage && (
                    <SuccessToast message={successMessage} onClose={() => setSuccessMessage('')} />
                )}
            </AnimatePresence>

            {/* Modals */}
            {studentToAssign && (
                <AssignKetuaKelasModal
                    student={studentToAssign}
                    currentKetua={data.ketua_kelas}
                    loading={assignKetuaMutation.isPending}
                    onConfirm={handleAssignKetuaKelas}
                    onClose={() => setStudentToAssign(null)}
                />
            )}

            {studentToAssignWali && (
                <AssignWaliModal
                    student={studentToAssignWali}
                    loading={assignWaliMutation.isPending}
                    onConfirm={handleAssignWali}
                    onClose={() => setStudentToAssignWali(null)}
                />
            )}

            {selectedStudent && (
                <StudentDetailModal
                    student={selectedStudent}
                    isCurrentKetua={data.ketua_kelas?.user_id === selectedStudent.user_id}
                    onClose={() => setSelectedStudent(null)}
                    onAssignKetua={(student) => {
                        setSelectedStudent(null);
                        setStudentToAssign(student);
                    }}
                    onAssignWali={(student) => {
                        setSelectedStudent(null);
                        setStudentToAssignWali(student);
                    }}
                />
            )}

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Kelas {data.kelas?.nama || '-'}
                    </h1>
                    <p className="text-gray-500">
                        {data.kelas?.tingkat && `Tingkat ${data.kelas.tingkat}`}
                        {data.kelas?.jurusan && ` • Jurusan ${data.kelas.jurusan}`}
                        {data.kelas?.tahun_ajaran && ` • ${data.kelas.tahun_ajaran}`}
                    </p>
                </div>

                {/* Ketua Kelas Info Card */}
                {data.ketua_kelas ? (
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                        <div className="p-2 bg-gradient-to-r from-amber-400 to-orange-400 rounded-lg">
                            <Crown className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <div className="text-xs text-amber-600 font-medium">Ketua Kelas</div>
                            <div className="font-bold text-gray-900">{data.ketua_kelas.name}</div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                        <div className="p-2 bg-gray-200 rounded-lg">
                            <Crown className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                            <div className="text-xs text-gray-500 font-medium">Ketua Kelas</div>
                            <div className="text-sm text-gray-400">Belum ditentukan</div>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-sm border border-white/20"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{data.total_students}</div>
                            <div className="text-sm text-gray-500">Total Siswa</div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-sm border border-white/20"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{data.male_count}</div>
                            <div className="text-sm text-gray-500">Laki-laki</div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 shadow-sm border border-white/20"
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-pink-100 text-pink-600">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{data.female_count}</div>
                            <div className="text-sm text-gray-500">Perempuan</div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filter & Search Bar */}
            <Card className="border-none shadow-sm bg-white/60 backdrop-blur-md">
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama atau NIS..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <select
                            value={filterGender}
                            onChange={(e) => setFilterGender(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                            <option value="all">Semua Gender</option>
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        >
                            <option value="all">Semua Status</option>
                            <option value="aktif">Aktif</option>
                            <option value="non-aktif">Non-Aktif</option>
                        </select>

                        <div className="flex items-center bg-gray-100 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Student List */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {filteredStudents.map((student, index) => (
                            <StudentCard
                                key={student.id}
                                student={student}
                                index={index}
                                onViewDetail={setSelectedStudent}
                                onAssignKetua={setStudentToAssign}
                                isCurrentKetua={data.ketua_kelas?.user_id === student.user_id}
                            />
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Siswa</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">L/P</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Telepon</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Absensi</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <AnimatePresence>
                                    {filteredStudents.map((student, index) => (
                                        <StudentListRow
                                            key={student.id}
                                            student={student}
                                            index={index}
                                            onViewDetail={setSelectedStudent}
                                            onAssignKetua={setStudentToAssign}
                                            isCurrentKetua={data.ketua_kelas?.user_id === student.user_id}
                                        />
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Footer Info */}
            <div className="text-center text-sm text-gray-400 py-4">
                Menampilkan {filteredStudents.length} dari {data.total_students} siswa
            </div>
        </div>
    );
};

export default ClassDetailPage;
