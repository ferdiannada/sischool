import React, { useState, useEffect } from 'react';
import { Calendar, User, TrendingUp, ArrowRight, Loader2, Clock, BookOpen, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScheduleCard } from '../../../components/shared/ScheduleCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import useAuthStore from '../../../store/authStore';
import { cn } from '../../../utils/cn';
import { motion } from 'framer-motion';
import { useGuruDashboard } from './hooks/useGuruDashboard';

/**
 * Guru Dashboard
 * Shows teacher's schedule and attendance status with real data
 * redesigned with modern UI/UX
 */
const GuruDashboard = () => {
    const navigate = useNavigate();
    const user = useAuthStore((state) => state.user);
    const getAllRoles = useAuthStore((state) => state.getAllRoles);
    const switchRole = useAuthStore((state) => state.switchRole);
    const { data: dashboardData, isLoading: loading } = useGuruDashboard(user?.id);

    const guruData = dashboardData?.guru || null;
    const schedules = dashboardData?.schedules || [];
    const stats = dashboardData?.stats || { kelasHariIni: 0, totalSiswa: 0 };
    const classPerformance = dashboardData?.chartData || [];

    // State for real-time updates
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const handleInputAttendance = (scheduleId) => {
        navigate('/guru/absensi');
    };

    // Check if user is also Wali Kelas
    const isWaliKelas = getAllRoles().includes('wali_kelas');

    const handleSwitchRole = (role) => {
        switchRole(role);
        navigate(role === 'wali_kelas' ? '/wali-kelas/dashboard' : '/guru/dashboard');
    };

    // Helper to check schedule status
    const getScheduleStatus = (schedule) => {
        if (schedule.is_attendance_filled) return 'completed';
        if (!schedule.jam_mulai || !schedule.jam_selesai) return 'upcoming';

        const now = currentTime;
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMinute] = schedule.jam_mulai.split(':').map(Number);
        const [endHour, endMinute] = schedule.jam_selesai.split(':').map(Number);

        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;

        if (currentTotalMinutes < startTotalMinutes) return 'upcoming';
        if (currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes) return 'ongoing';
        return 'completed';
    };

    const guruName = guruData?.user?.full_name || user?.name || user?.full_name || 'Guru';
    const totalKelasToday = stats.kelasHariIni || 0;
    const kelasSelesai = stats.kelasSelesai || 0;

    // Sort schedules to put ongoing/upcoming first
    const sortedSchedules = [...schedules].sort((a, b) => {
        const statusA = getScheduleStatus(a);
        const statusB = getScheduleStatus(b);
        const priority = { ongoing: 0, upcoming: 1, completed: 2 };
        return priority[statusA] - priority[statusB];
    });

    const activeTaskCount = sortedSchedules.filter(s => getScheduleStatus(s) !== 'completed').length;

    // Animation Variants
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
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
                    <span className="text-gray-500 font-medium">Menyiapkan dashboard Anda...</span>
                </div>
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
            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1f3c] via-[#2d2b55] to-[#1a1f3c] text-white shadow-2xl shadow-indigo-900/20">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-gradient-to-b from-indigo-500/20 to-purple-500/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-gradient-to-t from-blue-500/20 to-teal-500/20 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-[url('/grid-pattern.svg')] opacity-[0.03]" />

                <div className="relative p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-4 max-w-2xl">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-emerald-300 shadow-inner"
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Selamat Datang Kembali</span>
                            </motion.div>

                            <div>
                                <motion.h1
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2 leading-tight"
                                >
                                    Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">{guruName}</span>
                                </motion.h1>
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="text-gray-300 text-base/relaxed max-w-lg"
                                >
                                    {activeTaskCount > 0 ? (
                                        <>
                                            Semangat mengajar! Anda memiliki <span className="font-bold text-white bg-white/10 px-2 py-0.5 rounded-md mx-1">{activeTaskCount} jadwal kelas</span> yang perlu diselesaikan hari ini.
                                        </>
                                    ) : (
                                        "Hari ini tidak ada jadwal mengajar. Waktu yang tepat untuk mempersiapkan materi selanjutnya!"
                                    )}
                                </motion.p>

                            </div>
                        </div>

                        <div className="flex flex-col gap-3 min-w-[240px]">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="px-5 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-between group cursor-default transition-all hover:bg-white/10"
                            >
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Hari ini</span>
                                    <span className="text-white font-medium text-base">
                                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </span>
                                </div>
                                <Calendar className="w-6 h-6 text-indigo-300 group-hover:text-white transition-colors" />
                            </motion.div>

                            {isWaliKelas && (
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleSwitchRole('wali_kelas')}
                                    className="px-5 py-3 rounded-2xl bg-white text-[#1a1f3c] font-bold hover:bg-blue-50 transition-all flex items-center justify-between gap-2 shadow-xl shadow-black/10 group"
                                >
                                    <div className="flex flex-col items-start">
                                        <span className="text-[10px] uppercase tracking-wider text-indigo-900/60 font-semibold mb-0.5">Mode</span>
                                        <span className="text-sm">Wali Kelas</span>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-indigo-100/50 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                                        <ArrowRight className="w-4 h-4 text-indigo-900" />
                                    </div>
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Jam Widget */}
                <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors"></div>

                    <div className="relative flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                            <Clock className="w-6 h-6" />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                            MINGGUAN
                        </span>
                    </div>

                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Total Jam Mengajar</p>
                        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                            {stats.totalJamPelajaran || 0}<span className="text-base text-gray-400 font-normal ml-1.5 align-baseline">JP</span>
                        </h3>
                    </div>
                </motion.div>

                {/* Status Absensi Widget */}
                <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-green-900/5 transition-all duration-300">
                    <div className={cn(
                        "absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full blur-2xl transition-colors",
                        kelasSelesai === totalKelasToday && totalKelasToday > 0 ? "bg-green-50 group-hover:bg-green-100" : "bg-orange-50 group-hover:bg-orange-100"
                    )}></div>

                    <div className="relative flex justify-between items-start mb-4">
                        <div className={cn(
                            "p-3 rounded-2xl transition-transform duration-300 group-hover:scale-110 shadow-sm",
                            kelasSelesai === totalKelasToday && totalKelasToday > 0
                                ? "bg-green-50 text-green-600"
                                : "bg-orange-50 text-orange-600"
                        )}>
                            {kelasSelesai === totalKelasToday && totalKelasToday > 0
                                ? <CheckCircle className="w-6 h-6" />
                                : <AlertCircle className="w-6 h-6" />
                            }
                        </div>
                        <span className={cn(
                            "flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg",
                            kelasSelesai === totalKelasToday && totalKelasToday > 0
                                ? "bg-green-50 text-green-700"
                                : "bg-orange-50 text-orange-700"
                        )}>
                            {kelasSelesai === totalKelasToday && totalKelasToday > 0 ? "SELESAI" : "PENDING"}
                        </span>
                    </div>

                    <div className="relative">
                        <p className="text-gray-500 text-sm font-medium mb-1">Status Absensi</p>
                        <div className="flex items-end gap-2 mb-3">
                            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                                {kelasSelesai}
                            </h3>
                            <span className="text-sm text-gray-400 font-medium mb-1.5">/ {totalKelasToday} Kelas</span>
                        </div>

                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${totalKelasToday ? (kelasSelesai / totalKelasToday) * 100 : 0}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className={cn("h-full rounded-full",
                                    kelasSelesai === totalKelasToday ? "bg-green-500" : "bg-orange-500"
                                )}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Total Kelas Widget */}
                <motion.div variants={itemVariants} whileHover={{ y: -5 }} className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-purple-900/5 transition-all duration-300">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-purple-50 rounded-full blur-2xl group-hover:bg-purple-100 transition-colors"></div>

                    <div className="relative flex justify-between items-start mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <button className="flex items-center gap-1 text-xs font-semibold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg hover:bg-purple-100 transition-colors">
                            DETAIL <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>

                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Kelas Hari Ini</p>
                        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                            {stats.kelasHariIni || 0}<span className="text-base text-gray-400 font-normal ml-1.5 align-baseline">Jadwal</span>
                        </h3>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Schedule Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <motion.div variants={itemVariants} className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Jadwal Hari Ini</h2>
                            <p className="text-sm text-gray-500 mt-1">Pantau jadwal dan absensi kelas Anda</p>
                        </div>
                        <button
                            onClick={() => navigate('/guru/jadwal')}
                            className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-4 py-2 rounded-xl transition-all"
                        >
                            Lihat Semua
                        </button>
                    </motion.div>

                    <motion.div variants={containerVariants} className="space-y-4">
                        {sortedSchedules.length > 0 ? (
                            sortedSchedules.map((schedule, index) => {
                                const status = getScheduleStatus(schedule);

                                return (
                                    <motion.div key={schedule.id} variants={itemVariants}>
                                        <ScheduleCard
                                            {...schedule}
                                            actionLabel={schedule.is_attendance_filled ? "Lihat Absensi" : "Input Absensi"}
                                            status={status}
                                            onAction={() => handleInputAttendance(schedule.id)}
                                            className={cn(
                                                "transition-all duration-300",
                                                status === 'ongoing' ? "ring-2 ring-indigo-500 ring-offset-2 transform scale-[1.01]" : "hover:scale-[1.01]"
                                            )}
                                        />
                                    </motion.div>
                                );
                            })
                        ) : (
                            <motion.div
                                variants={itemVariants}
                                className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-dashed border-gray-200 text-center"
                            >
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-blue-500 animate-pulse">
                                    <Calendar className="w-10 h-10" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Tidak Ada Jadwal Mengajar</h3>
                                <p className="text-gray-500 max-w-sm mx-auto text-base leading-relaxed mb-8">
                                    Hari ini Anda bebas tugas mengajar. Gunakan waktu ini untuk persiapan materi atau istirahat!
                                </p>
                                <button
                                    onClick={() => navigate('/guru/jadwal')}
                                    className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl"
                                >
                                    Cek Jadwal Pekan Ini
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                </div>

                {/* Performance Chart */}
                <div className="space-y-6">
                    <motion.div variants={itemVariants}>
                        <h2 className="text-xl font-bold text-gray-900">Performa Kehadiran</h2>
                        <p className="text-sm text-gray-500 mt-1">Tren kehadiran siswa per kelas</p>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card className="border-0 shadow-xl shadow-gray-100/50 overflow-hidden h-[420px] rounded-3xl bg-white ring-1 ring-gray-100">
                            <CardHeader className="bg-gradient-to-r from-gray-50/50 to-white border-b border-gray-100/50 pb-6 pt-6 px-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <TrendingUp className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-base font-extrabold text-gray-900">Statistik Mingguan</CardTitle>
                                            <p className="text-xs text-gray-500 font-medium mt-0.5">Data 7 hari terakhir</p>
                                        </div>
                                    </div>
                                    {/* Legend or extra info could go here */}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 h-[340px]">
                                {classPerformance.length > 0 ? (
                                    <div className="h-full w-full pr-2 pt-6">
                                        <ResponsiveContainer width="100%" height="90%">
                                            <AreaChart data={classPerformance} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                                                    dy={15}
                                                    interval={0}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={70}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                                                    domain={[0, 100]}
                                                    dx={-10}
                                                />
                                                <Tooltip
                                                    cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }}
                                                    contentStyle={{
                                                        borderRadius: '16px',
                                                        border: 'none',
                                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                                        padding: '16px',
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                        backdropFilter: 'blur(4px)'
                                                    }}
                                                    itemStyle={{ color: '#4f46e5', fontWeight: 700, fontSize: '14px' }}
                                                    labelStyle={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="avg"
                                                    stroke="#6366f1"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorAvg)"
                                                    name="Kehadiran (%)"
                                                    animationDuration={1500}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-50/30">
                                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-100">
                                            <TrendingUp className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-base font-semibold text-gray-900">Belum ada data statistik</p>
                                        <p className="text-sm text-gray-500 mt-2 max-w-[200px]">
                                            Data kehadiran akan muncul setelah Anda mulai mengajar minggu ini
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Quick Action - Support */}
                    <motion.div variants={itemVariants} className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-primary-900 to-indigo-800 p-8 text-white text-center shadow-xl">
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/15 transition-colors"></div>
                        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 bg-indigo-500/30 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <h3 className="font-bold text-xl mb-3">Butuh Bantuan?</h3>
                            <p className="text-indigo-100/90 text-sm mb-6 leading-relaxed">
                                Jika Anda mengalami kendala teknis atau pertanyaan, tim admin kami siap membantu.
                            </p>
                            <button className="w-full py-3 px-6 bg-white text-indigo-900 rounded-xl text-sm font-bold shadow-lg shadow-black/10 hover:bg-indigo-50 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                Hubungi Admin
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default GuruDashboard;
