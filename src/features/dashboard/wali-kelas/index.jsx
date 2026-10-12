import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    ClipboardList,
    User,
    TrendingUp,
    AlertCircle,
    Loader2,
    Search,
    Filter,
    MoreVertical,
    Calendar,
    Clock,
    UserCheck,
    UserX,
    UserMinus,
    ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';
import useAuthStore from '../../../store/authStore';
import { useWaliKelasDashboard } from './hooks/useWaliKelasDashboard';

// --- Custom Components for this Dashboard ---

import StatsCard from '../../../components/shared/StatsCard';

const AbsentStudentItem = ({ student, index }) => {
    const statusColors = {
        sakit: "bg-blue-100 text-blue-700 border-blue-200",
        izin: "bg-yellow-100 text-yellow-700 border-yellow-200",
        alpha: "bg-red-100 text-red-700 border-red-200",
        belum_absen: "bg-gray-100 text-gray-500 border-gray-200",
    };

    const statusLabels = {
        sakit: "Sakit",
        izin: "Izin",
        alpha: "Alpha",
        belum_absen: "Belum Absen",
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="group p-4 hover:bg-gray-50 rounded-xl transition-colors border-b border-gray-100 last:border-0"
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {student.avatar_url ? (
                            <img src={student.avatar_url} alt={student.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            (student.name || 'S').charAt(0)
                        )}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800">{student.name}</h4>
                        <p className="text-xs text-gray-500">NIS: {student.nis}</p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[student.status] || statusColors.belum_absen}`}>
                    {statusLabels[student.status] || student.status}
                </span>
            </div>
            {/* Subjects Missed */}
            {student.subjects_missed && student.subjects_missed.length > 0 && (
                <div className="ml-14 mt-2 space-y-1">
                    {student.subjects_missed.map((subject, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                            <span className="font-medium text-gray-700">{subject.subject}</span>
                            <span className="text-gray-400">({subject.time})</span>
                        </div>
                    ))}
                </div>
            )}
            {student.status === 'belum_absen' && (
                <div className="ml-14 mt-2 text-xs text-gray-400 italic">
                    Belum ada absensi tercatat hari ini
                </div>
            )}
        </motion.div>
    );
};


const WaliKelasDashboard = () => {
    const navigate = useNavigate();
    const { user, getAllRoles, switchRole } = useAuthStore();
    const isGuru = getAllRoles().includes('guru');

    const handleSwitchRole = () => {
        switchRole('guru');
        navigate('/guru/dashboard');
    };

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const { data: dashboardData, isLoading: loading } = useWaliKelasDashboard(user?.id);

    const data = {
        kelas: dashboardData?.kelas || (dashboardData?.success ? null : dashboardData), // Handle potential structure mismatch fallback
        stats: dashboardData?.stats || dashboardData?.attendance || { hadir: 0, sakit: 0, izin: 0, alpha: 0, total_students: 0, belum_absen: 0 },
        absent_students: dashboardData?.absent_students || [],
        recent_attendance: dashboardData?.recent_attendance || []
    };

    // Fallback if data is raw class object (legacy behavior check)
    if (dashboardData && !dashboardData.kelas && !dashboardData.stats && dashboardData.id) {
        data.kelas = dashboardData;
    }

    const filteredAbsentStudents = data.absent_students.filter(student => {
        const matchesSearch = (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.nis?.includes(searchTerm);
        const matchesFilter = filterStatus === 'all' || student.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh]">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-500 animate-pulse">Memuat data kelas...</p>
            </div>
        );
    }

    if (!data.kelas) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
                <div className="bg-red-50 p-6 rounded-full mb-6">
                    <UserX className="h-12 w-12 text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Tidak Ada Data Kelas</h2>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                    Anda belum ditetapkan sebagai Wali Kelas untuk tahun ajaran ini.
                    Silakan hubungi administrator jika ini kesalahan.
                </p>
                {isGuru && (
                    <button
                        onClick={handleSwitchRole}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                        Kembali ke Dashboard Guru
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 -m-6 p-6 space-y-8 font-sans">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 mb-2"
                    >
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">
                            Wali Kelas
                        </span>
                        <span className="text-gray-400 text-sm">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl font-bold text-gray-900"
                    >
                        Kelas {data.kelas.nama}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-gray-500"
                    >
                        Jurusan {data.kelas.jurusan || '-'} • Tingkat {data.kelas.tingkat || '-'}
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex gap-3"
                >
                    {isGuru && (
                        <button
                            onClick={handleSwitchRole}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-sm shadow-sm"
                        >
                            <ArrowRight className="w-4 h-4 rotate-180" />
                            Dashboard Guru
                        </button>
                    )}
                </motion.div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Siswa"
                    value={data.stats.total_students || 0}
                    icon={Users}
                    color="blue"
                    delay={0.1}
                />
                <StatsCard
                    title="Hadir Hari Ini"
                    value={data.stats.hadir || 0}
                    subtext={`${((data.stats.hadir / (data.stats.total_students || 1)) * 100).toFixed(0)}% Kehadiran`}
                    icon={UserCheck}
                    color="green"
                    delay={0.2}
                />
                <StatsCard
                    title="Tidak Hadir"
                    value={(data.stats.sakit || 0) + (data.stats.izin || 0) + (data.stats.alpha || 0)}
                    subtext={`${data.stats.sakit || 0} Sakit, ${data.stats.izin || 0} Izin, ${data.stats.alpha || 0} Alpha`}
                    icon={UserMinus}
                    color="yellow"
                    delay={0.3}
                />
                <StatsCard
                    title="Belum Absen"
                    value={data.stats.belum_absen || 0}
                    icon={Clock}
                    color="purple"
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Student List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <UserMinus className="w-5 h-5 text-red-500" />
                                Siswa Tidak Hadir Hari Ini
                            </h2>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari siswa..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-full sm:w-64 transition-all"
                                    />
                                </div>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                                >
                                    <option value="all">Semua Status</option>
                                    <option value="sakit">Sakit</option>
                                    <option value="izin">Izin</option>
                                    <option value="alpha">Alpha</option>
                                    <option value="belum_absen">Belum Absen</option>
                                </select>
                            </div>
                        </div>

                        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                            {filteredAbsentStudents.length > 0 ? (
                                <div>
                                    {filteredAbsentStudents.map((student, idx) => (
                                        <AbsentStudentItem key={student.id} student={student} index={idx} />
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <div className="bg-green-50 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <UserCheck className="w-8 h-8 text-green-500" />
                                    </div>
                                    <p className="font-semibold text-gray-700">Semua Siswa Hadir!</p>
                                    <p className="text-sm text-gray-400 mt-1">Tidak ada siswa yang tidak hadir hari ini</p>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 text-center">
                            {filteredAbsentStudents.length} siswa tidak hadir dari {data.stats.total_students} total siswa
                        </div>
                    </div>
                </motion.div>

                {/* Sidebar Content */}
                <div className="space-y-6">
                    {/* Attendance Chart */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                    >
                        <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-indigo-600" />
                            Trend Kehadiran
                        </h3>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.recent_attendance}>
                                    <defs>
                                        <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { weekday: 'short' })}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="percentage"
                                        stroke="#4F46E5"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorHadir)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Quick Info / Warning */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 }}
                        className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <AlertCircle className="w-24 h-24" />
                        </div>
                        <h3 className="font-bold text-lg mb-2 relative z-10">Perhatian Wali Kelas</h3>
                        <p className="text-indigo-100 text-sm mb-4 relative z-10">
                            Pastikan untuk memeriksa siswa dengan status <strong>Alpha</strong> lebih dari 3 kali bulan ini.
                        </p>
                        <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors relative z-10 w-full">
                            Lihat Laporan Detail
                        </button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default WaliKelasDashboard;
