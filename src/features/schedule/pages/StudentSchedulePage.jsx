import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, getDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { Loader2, Calendar, BookOpen, User, Clock, MapPin, List, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useStudentSchedule } from '../hooks/useStudentSchedule';

const HARI_NAMA = {
    1: 'Senin',
    2: 'Selasa',
    3: 'Rabu',
    4: 'Kamis',
    5: 'Jumat',
    6: 'Sabtu',
    7: 'Minggu'
};

const StudentSchedulePage = () => {
    const { user } = useAuthStore();
    const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly'

    // Use current date
    const [currentDate] = useState(new Date());
    // Convert 0 (Sunday) to 7, keep 1-6 as is
    const currentDay = getDay(currentDate) === 0 ? 7 : getDay(currentDate);

    // Query Hook
    const { data: result, isLoading: loading, error } = useStudentSchedule(user?.id);

    // Default data structure
    const scheduleData = useMemo(() => ({
        kelas: result?.kelas || null,
        schedules: result?.schedules || []
    }), [result]);

    // Filter schedules for "today"
    const todaySchedules = useMemo(() => {
        // Use loose equality (==) for day check just in case of type mismatch
        return scheduleData.schedules.filter(s => s.hari == currentDay)
            .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
    }, [scheduleData.schedules, currentDay]);

    // Group for weekly view
    const schedulesByDay = useMemo(() => {
        const grouped = {};
        for (let day = 1; day <= 6; day++) {
            grouped[day] = scheduleData.schedules.filter(s => s.hari == day)
                .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
        }
        return grouped;
    }, [scheduleData.schedules]);

    // Calculate status of a schedule item relative to current time
    const getScheduleStatus = (schedule) => {
        if (schedule.hari != currentDay) return 'upcoming';

        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTime = currentHours * 60 + currentMinutes;

        const [startHour, startMinute] = schedule.jam_mulai.split(':').map(Number);
        const [endHour, endMinute] = schedule.jam_selesai.split(':').map(Number);

        const startTime = startHour * 60 + startMinute;
        const endTime = endHour * 60 + endMinute;

        if (currentTime >= startTime && currentTime < endTime) return 'ongoing';
        if (currentTime > endTime) return 'completed';
        return 'upcoming';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                    <span className="text-gray-500 font-medium">Sedang memuat jadwal pelajaran...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-red-50 p-6 rounded-full mb-4">
                    <Calendar className="h-12 w-12 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Gagal Memuat Jadwal</h3>
                <p className="text-gray-500 mb-6 max-w-md">Terjadi kesalahan saat memuat data jadwal.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    Coba Lagi
                </button>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const DailyTimeline = ({ schedules }) => {
        if (schedules.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="bg-indigo-50 p-4 rounded-full mb-4">
                        <Calendar className="h-8 w-8 text-indigo-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Tidak ada jadwal hari ini</h3>
                    <p className="text-gray-500 text-sm">Nikmati hari liburmu!</p>
                </div>
            );
        }

        return (
            <div className="relative pl-8 md:pl-0">
                {/* Timeline Line (Desktop only - tricky on responsive, let's keep it simple) */}
                <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-100 hidden md:block"></div>

                <div className="space-y-6">
                    {schedules.map((schedule, idx) => {
                        const status = getScheduleStatus(schedule);
                        const isLive = status === 'ongoing';

                        return (
                            <motion.div
                                key={`daily-${schedule.id || idx}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1, duration: 0.4 }}
                                className={`relative md:ml-12 group ${isLive ? 'z-10' : 'z-0'}`}
                            >
                                {/* Time Bubble */}
                                <div className={`
                                    absolute -left-12 md:-left-[3.25rem] top-0 
                                    w-14 h-auto py-1 px-1 rounded-lg text-center border-2
                                    flex flex-col items-center justify-center gap-0.5 bg-white
                                    transition-colors duration-300
                                    ${isLive
                                        ? 'border-indigo-500 shadow-md shadow-indigo-200'
                                        : status === 'completed'
                                            ? 'border-gray-200 text-gray-400'
                                            : 'border-indigo-100 text-gray-600'
                                    }
                                `}>
                                    <span className={`text-[10px] font-bold ${isLive ? 'text-indigo-600' : ''}`}>
                                        {schedule.jam_mulai}
                                    </span>
                                    {isLive && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                    )}
                                </div>

                                {/* Content Card */}
                                <div className={`
                                    relative overflow-hidden rounded-2xl border transition-all duration-300
                                    ${isLive
                                        ? 'bg-gradient-to-br from-indigo-50 to-white border-indigo-200 shadow-lg scale-[1.02]'
                                        : 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-md'
                                    }
                                    ${status === 'completed' ? 'opacity-60 saturate-50' : ''}
                                `}>
                                    {isLive && (
                                        <div className="absolute top-0 right-0 px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-bl-xl">
                                            SEDANG BERLANGSUNG
                                        </div>
                                    )}

                                    <div className="p-5 flex flex-col md:flex-row gap-4 md:items-center">
                                        <div className={`
                                            w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                                            ${isLive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-50 text-gray-500'}
                                        `}>
                                            <BookOpen className="h-6 w-6" />
                                        </div>

                                        <div className="flex-1">
                                            <h4 className={`font-bold text-lg mb-1 ${isLive ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                {schedule.mata_pelajaran}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <User className="h-4 w-4" />
                                                    {schedule.guru}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="h-4 w-4" />
                                                    {schedule.jam_mulai} - {schedule.jam_selesai}
                                                </div>
                                                {schedule.ruangan && (
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                                                        <MapPin className="h-3 w-3" />
                                                        {schedule.ruangan}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const WeeklyGrid = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((day, idx) => (
                <motion.div
                    key={`day-${day}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    className={`
                        rounded-2xl overflow-hidden border transition-all duration-300 relative
                        ${day === currentDay
                            ? 'bg-white border-indigo-200 ring-4 ring-indigo-50/50 shadow-xl z-10'
                            : 'bg-white border-gray-100 hover:shadow-lg'
                        }
                    `}
                >
                    {/* Day Header */}
                    <div className={`
                        p-4 flex items-center justify-between
                        ${day === currentDay ? 'bg-indigo-600 text-white' : 'bg-gray-50 border-b border-gray-100'}
                    `}>
                        <h3 className={`font-bold ${day === currentDay ? 'text-white' : 'text-gray-900'}`}>
                            {HARI_NAMA[day]}
                        </h3>
                        {day === currentDay && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-white/20 rounded text-white backdrop-blur-sm">
                                HARI INI
                            </span>
                        )}
                    </div>

                    {/* Schedule List */}
                    <div className="p-3 space-y-2">
                        {schedulesByDay[day]?.length > 0 ? (
                            schedulesByDay[day].map((s, i) => (
                                <div
                                    key={i}
                                    className={`
                                        p-3 rounded-xl flex gap-3 group
                                        ${day === currentDay ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'bg-gray-50/50 hover:bg-gray-100'}
                                        transition-colors cursor-default
                                    `}
                                >
                                    <div className="pt-0.5">
                                        <div className={`
                                            w-1.5 h-full rounded-full min-h-[2rem]
                                            ${day === currentDay ? 'bg-indigo-400' : 'bg-gray-300 group-hover:bg-gray-400'}
                                        `}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {s.mata_pelajaran}
                                        </p>
                                        <p className="text-xs text-gray-500 mb-1">
                                            {s.jam_mulai} - {s.jam_selesai}
                                        </p>
                                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                                            <User className="h-3 w-3" />
                                            <span className="truncate">{s.guru}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-400 text-sm italic">
                                Tidak ada jadwal
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8 pb-10"
        >
            {/* Page Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-8 md:p-12 text-white shadow-2xl">
                <div className="relative z-10 max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">
                            Jadwal Pelajaran
                        </h1>
                        <p className="text-indigo-100 text-lg mb-6">
                            Kelas {scheduleData.kelas || '...'} • Semester Ganjil
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                                <Calendar className="h-5 w-5 text-indigo-200" />
                                <span className="font-medium">
                                    {format(currentDate, 'EEEE, d MMMM yyyy', { locale: id })}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20">
                                <BookOpen className="h-5 w-5 text-purple-200" />
                                <span className="font-medium">
                                    {scheduleData.schedules.length} Mapel / Minggu
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
            </div>

            {/* View Toggle */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-4 z-20 bg-gray-50/80 backdrop-blur-sm p-2 rounded-2xl border border-white shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 px-2">
                    {viewMode === 'daily' ? 'Jadwal Hari Ini' : 'Ringkasan Mingguan'}
                </h2>
                <div className="flex p-1 bg-white rounded-xl shadow-sm border border-gray-200 w-full sm:w-auto">
                    <button
                        onClick={() => setViewMode('daily')}
                        className={`
                            flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200
                            ${viewMode === 'daily'
                                ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                        `}
                    >
                        <List className="h-4 w-4" />
                        Harian
                    </button>
                    <button
                        onClick={() => setViewMode('weekly')}
                        className={`
                            flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200
                            ${viewMode === 'weekly'
                                ? 'bg-indigo-50 text-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                        `}
                    >
                        <LayoutGrid className="h-4 w-4" />
                        Mingguan
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={viewMode}
                    initial={{ opacity: 0, x: viewMode === 'daily' ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: viewMode === 'daily' ? 20 : -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {viewMode === 'daily'
                        ? <DailyTimeline schedules={todaySchedules} />
                        : <WeeklyGrid />
                    }
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
};

export default StudentSchedulePage;
