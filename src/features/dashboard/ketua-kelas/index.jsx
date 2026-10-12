import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, Calendar, ArrowRight, User, Crown, Sparkles,
    ClipboardCheck, Clock, Loader2, BookOpen,
    CheckSquare, FileText, ChevronRight, Bell
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import useAuthStore from '../../../store/authStore';
import { motion } from 'framer-motion';
import { useKetuaKelasDashboard } from './hooks/useKetuaKelasDashboard';

/**
 * Ketua Kelas Dashboard
 * Redesigned with premium UI/UX
 */
import StatsCard from '../../../components/shared/StatsCard';

const KetuaKelasDashboard = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const switchRole = useAuthStore((state) => state.switchRole);
    const getAllRoles = useAuthStore((state) => state.getAllRoles);

    const { data: dashboardData, isLoading } = useKetuaKelasDashboard(user?.id);

    const roles = getAllRoles();
    const isSiswa = roles.includes('siswa');
    const studentName = user?.name || user?.full_name || 'Ketua';



    const handleSwitchToSiswa = () => {
        switchRole('siswa');
        navigate('/siswa/dashboard');
    };

    const handleInputAbsensi = (scheduleId) => {
        navigate(`/ketua-kelas/absensi?schedule=${scheduleId}`);
    };

    const stats = dashboardData?.stats || { total_teman: 0, hadir_hari_ini: 0, belum_absen: 0 };
    const todayTasks = dashboardData?.today_tasks || [];
    const kelas = dashboardData?.kelas || {};

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-10"
        >
            {/* Hero Section */}
            <motion.div
                variants={itemVariants}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-2xl shadow-amber-500/20"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-gradient-to-b from-yellow-300/30 to-orange-300/20 blur-3xl opacity-60" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-gradient-to-t from-red-500/20 to-amber-500/20 blur-3xl opacity-60" />
                <div className="absolute inset-0 bg-noise opacity-10 mix-blend-overlay"></div>

                <div className="relative p-6 md:p-8 z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-4 max-w-2xl">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-inner"
                            >
                                <Crown className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                                <span>Ketua Kelas {kelas?.nama || ''}</span>
                            </motion.div>

                            <div>
                                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-2 leading-tight">
                                    Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-100 to-white">{studentName}</span>! 👋
                                </h1>
                                <p className="text-amber-100 text-base md:text-lg max-w-lg leading-relaxed">
                                    Siap memimpin kelas hari ini? Jangan lupa cek kehadiran teman-temanmu ya!
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 min-w-[240px]">
                            <div className="px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-between group cursor-default transition-all hover:bg-white/15">
                                <div className="flex flex-col">
                                    <span className="text-amber-100 text-[10px] uppercase tracking-wider font-bold mb-0.5">Hari ini</span>
                                    <span className="text-white font-semibold text-lg">
                                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </span>
                                </div>
                                <Calendar className="w-8 h-8 text-yellow-200 drop-shadow-lg" />
                            </div>

                            {isSiswa && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSwitchToSiswa}
                                    className="px-5 py-3 rounded-2xl bg-white text-amber-900 font-bold hover:bg-amber-50 transition-all flex items-center justify-between gap-2 shadow-xl shadow-black/10 group"
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="text-[10px] uppercase tracking-wider text-amber-700/60 font-bold mb-0.5">Switch Mode</span>
                                        <span className="text-sm flex items-center gap-1.5">
                                            <User className="w-4 h-4 text-amber-600" />
                                            Dashboard Siswa
                                        </span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                                        <ArrowRight className="w-4 h-4 text-amber-700" />
                                    </div>
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants}>
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Akses Cepat
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickActionCard
                        icon={ClipboardCheck}
                        label="Input Absensi"
                        desc="Catat kehadiran"
                        color="bg-blue-50 text-blue-600 border-blue-200"
                        onClick={() => navigate('/ketua-kelas/absensi')}
                    />
                    <QuickActionCard
                        icon={Calendar}
                        label="Jadwal Kelas"
                        desc="Lihat jadwal"
                        color="bg-purple-50 text-purple-600 border-purple-200"
                        onClick={() => navigate('/ketua-kelas/jadwal')}
                    />
                    <QuickActionCard
                        icon={Users}
                        label="Teman Sekelas"
                        desc="Daftar siswa"
                        color="bg-amber-50 text-amber-600 border-amber-200"
                        onClick={() => navigate('/ketua-kelas/teman')}
                    />
                    <QuickActionCard
                        icon={User}
                        label="Profil Saya"
                        desc="Lihat profil"
                        color="bg-emerald-50 text-emerald-600 border-emerald-200"
                        onClick={() => navigate('/ketua-kelas/profil')}
                    />
                </div>
            </motion.div>

            {/* Stats Overview */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard
                    label="Total Teman"
                    value={stats.total_teman}
                    icon={Users}
                    color="blue"
                    subtext="+2 Siswa Baru"
                />
                <StatsCard
                    label="Hadir Hari Ini"
                    value={stats.hadir_hari_ini}
                    icon={CheckSquare}
                    color="emerald"
                    subtext={`Dari ${stats.total_teman} Siswa`}
                />
                <StatsCard
                    label="Belum Absen"
                    value={stats.belum_absen}
                    icon={Bell}
                    color="rose"
                    subtext={stats.belum_absen > 0 ? "Perlu Perhatian" : "Update Realtime"}
                />
            </motion.div>

            {/* Today's Tasks */}
            <motion.div variants={itemVariants}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500" />
                        Jadwal & Tugas Hari Ini
                    </h3>
                    <span className="text-sm text-gray-500">{todayTasks.length} Mata Pelajaran</span>
                </div>

                <div className="space-y-3">
                    {todayTasks.length === 0 ? (
                        <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-gray-300" />
                            </div>
                            <h4 className="text-gray-900 font-medium">Tidak ada jadwal hari ini</h4>
                            <p className="text-gray-500 text-sm mt-1">Nikmati hari liburmu!</p>
                        </div>
                    ) : (
                        todayTasks.map((task, index) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onInput={() => handleInputAbsensi(task.id)}
                                index={index}
                            />
                        ))
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

// --- Local Components for Premium UI ---

const QuickActionCard = ({ icon: Icon, label, desc, color, onClick }) => (
    <motion.button
        whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`flex flex-col items-start p-4 rounded-2xl border bg-white shadow-sm transition-all text-left h-full ${color.replace('text-', 'border-').replace('bg-', 'hover:bg-')}`}
    >
        <div className={`p-3 rounded-xl mb-3 ${color} bg-opacity-20`}>
            <Icon className="w-6 h-6" />
        </div>
        <span className="font-bold text-gray-800">{label}</span>
        <span className="text-xs text-gray-500 mt-1">{desc}</span>
    </motion.button>
);

// --- Local Components for Premium UI ---

const TaskCard = ({ task, onInput, index }) => {
    const isOngoing = task.status === 'ongoing';
    const isCompleted = task.status === 'completed';
    const isUpcoming = task.status === 'upcoming';

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative flex items-center justify-between p-5 rounded-2xl border transition-all ${isOngoing
                ? 'bg-amber-50/50 border-amber-200 shadow-amber-100'
                : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                }`}
        >
            {isOngoing && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500 rounded-l-2xl" />
            )}

            <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm ${isOngoing
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                    : isCompleted
                        ? 'bg-gray-100 text-gray-400'
                        : 'bg-white border border-gray-200 text-gray-600'
                    }`}>
                    <span className="text-xs font-bold uppercase opacity-80">{task.jam_mulai}</span>
                    <Clock className="w-5 h-5 my-0.5" />
                </div>

                <div>
                    <h4 className={`font-bold text-lg ${isCompleted ? 'text-gray-500' : 'text-gray-900'}`}>
                        {task.mata_pelajaran}
                    </h4>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                        {task.guru}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${isOngoing ? 'bg-amber-100 text-amber-700 border-amber-200' :
                            isCompleted ? 'bg-green-100 text-green-700 border-green-200' :
                                'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                            {isOngoing ? 'Sedang Berlangsung' : isCompleted ? 'Selesai' : 'Akan Datang'}
                        </span>
                        {task.ruangan && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                                {task.ruangan}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="ml-4">
                {task.sudah_absen ? (
                    <Button
                        variant="ghost"
                        className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                        disabled
                    >
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Sudah Absen
                    </Button>
                ) : isOngoing ? (
                    <Button
                        className="bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30 text-white animate-pulse-slow"
                        onClick={onInput}
                    >
                        Input Absensi <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                ) : isUpcoming ? (
                    <Button
                        variant="outline"
                        className="text-gray-400 border-gray-200"
                        disabled
                    >
                        Belum Mulai
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        className="text-gray-600 border-gray-200 hover:bg-gray-50"
                        onClick={onInput}
                    >
                        Edit Absensi
                    </Button>
                )}
            </div>
        </motion.div>
    );
};

export default KetuaKelasDashboard;
