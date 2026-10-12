import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import {
    Clock,
    Calendar as CalendarIcon,
    AlertCircle,
    Timer,
    Layers,
    LayoutGrid,
    List,
    ChevronRight,
    GraduationCap,
    BookOpen
} from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import { useGuruSchedule } from '../hooks/useGuruSchedule';
import { ScheduleCard } from '../../../components/shared/ScheduleCard';

/**
 * Helper to generate consistent pastel colors for subjects
 */
const getColorForSubject = (subjectName) => {
    const colors = [
        { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', icon: 'bg-blue-100 text-blue-600', ring: 'ring-blue-200' },
        { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: 'bg-emerald-100 text-emerald-600', ring: 'ring-emerald-200' },
        { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-100', icon: 'bg-violet-100 text-violet-600', ring: 'ring-violet-200' },
        { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: 'bg-amber-100 text-amber-600', ring: 'ring-amber-200' },
        { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', icon: 'bg-rose-100 text-rose-600', ring: 'ring-rose-200' },
        { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-100', icon: 'bg-cyan-100 text-cyan-600', ring: 'ring-cyan-200' },
        { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', border: 'border-fuchsia-100', icon: 'bg-fuchsia-100 text-fuchsia-600', ring: 'ring-fuchsia-200' },
        { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100', icon: 'bg-indigo-100 text-indigo-600', ring: 'ring-indigo-200' },
    ];

    let hash = 0;
    for (let i = 0; i < subjectName.length; i++) {
        hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
};

/**
 * Get dates for the current week (Monday to Saturday)
 */
const getWeekDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust to Monday

    const monday = new Date(today.setDate(diff));
    const dates = {};
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    days.forEach((day, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        dates[day] = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    });

    return dates;
};

/**
 * Check schedule status based on current time
 */
const getScheduleStatus = (timeRange) => {
    if (!timeRange) return 'upcoming';

    const [start, end] = timeRange.split(' - ');
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (currentTime >= startTime && currentTime <= endTime) return 'ongoing';
    if (currentTime > endTime) return 'completed';
    return 'upcoming';
};

const GuruSchedulePage = () => {
    const { user } = useAuthStore();
    const { data: scheduleData, isLoading: loading, error } = useGuruSchedule(user?.id);

    // Default to empty schedule if loading or error
    const schedules = scheduleData || {
        'Senin': [], 'Selasa': [], 'Rabu': [], 'Kamis': [], 'Jumat': [], 'Sabtu': []
    };

    const [weekDates, setWeekDates] = useState({});
    const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'weekly'
    const [currentTime, setCurrentTime] = useState(new Date());

    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    const getCurrentDayName = () => {
        const d = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        return d[new Date().getDay()];
    };

    const currentDay = getCurrentDayName();

    useEffect(() => {
        setWeekDates(getWeekDates());
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // No manual fetching needed


    // Calculate stats
    const todaySchedules = schedules[currentDay] || [];
    const totalToday = todaySchedules.length;
    const completedToday = todaySchedules.filter(s => getScheduleStatus(s.time) === 'completed').length;
    const remainingToday = totalToday - completedToday;

    // Find next class
    const nextClass = todaySchedules.find(s => getScheduleStatus(s.time) === 'upcoming');

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-primary-600 to-primary-800 p-8 text-white shadow-xl shadow-primary-900/20">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <CalendarIcon className="w-64 h-64 -rotate-12 transform translate-x-12 -translate-y-12" />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-primary-100 mb-2">
                            <Layers className="w-5 h-5" />
                            <span className="font-medium tracking-wide text-sm uppercase">Sistem Akademik</span>
                        </div>
                        <h1 className="text-4xl font-bold mb-2 tracking-tight">Jadwal Mengajar</h1>
                        <p className="text-primary-100 text-lg max-w-xl leading-relaxed opacity-90">
                            Kelola dan pantau jadwal pelajaran Anda minggu ini.
                            {remainingToday > 0
                                ? ` Masih ada ${remainingToday} kelas lagi hari ini.`
                                : totalToday > 0 ? " Semua kelas hari ini telah selesai." : " Tidak ada jadwal mengajar hari ini."}
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                        <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl p-4 min-w-[180px] shadow-lg shadow-black/5 transaction-transform hover:scale-105 duration-300">
                            <p className="text-indigo-900/60 text-xs font-bold uppercase tracking-wider mb-1">Waktu Sekarang</p>
                            <div className="flex items-center gap-2">
                                <Timer className="w-5 h-5 text-indigo-600" />
                                <span className="text-3xl font-bold font-mono text-indigo-900">
                                    {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl p-4 hover:bg-white transition-all shadow-lg shadow-indigo-900/10 group">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                                <Layers className="w-4 h-4" />
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Kelas</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{totalToday}</p>
                    </div>

                    <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl p-4 hover:bg-white transition-all shadow-lg shadow-indigo-900/10 group">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 group-hover:scale-110 transition-transform">
                                <CalendarIcon className="w-4 h-4" />
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Selesai</p>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{completedToday}</p>
                    </div>

                    <div className="bg-white/90 backdrop-blur-md border border-white/40 rounded-2xl p-4 hover:bg-white transition-all shadow-lg shadow-indigo-900/10 col-span-2 group">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:scale-110 transition-transform">
                                <BookOpen className="w-4 h-4" />
                            </div>
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Kelas Berikutnya</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-xl text-gray-900 truncate">
                                {nextClass ? `${nextClass.subject} (${nextClass.class})` : '-'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Toggle & Content */}
            <div className="flex flex-col space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('daily')}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
                                ${viewMode === 'daily'
                                    ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                            `}
                        >
                            <List className="w-4 h-4" />
                            Hari Ini
                        </button>
                        <button
                            onClick={() => setViewMode('weekly')}
                            className={`
                                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300
                                ${viewMode === 'weekly'
                                    ? 'bg-white text-primary-600 shadow-sm ring-1 ring-slate-200'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
                            `}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Minggu Ini
                        </button>
                    </div>

                    <div className="text-sm font-medium text-slate-500">
                        {weekDates ? `${Object.values(weekDates)[0]} - ${Object.values(weekDates)[5]}` : ''}
                    </div>
                </div>

                {/* View Content */}
                <div className="min-h-[500px]">
                    {viewMode === 'daily' ? (
                        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {todaySchedules.length > 0 ? (
                                <div className="space-y-6 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200 before:z-0">
                                    {todaySchedules.map((schedule, index) => {
                                        const status = getScheduleStatus(schedule.time);
                                        const isLast = index === todaySchedules.length - 1;

                                        return (
                                            <div key={schedule.id} className="relative z-10 pl-20 group">
                                                {/* Timeline Dot */}
                                                <div className={`
                                                    absolute left-[26px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 transition-all duration-300
                                                    ${status === 'ongoing'
                                                        ? 'bg-white border-primary-500 scale-125 shadow-lg shadow-primary-500/30'
                                                        : status === 'completed'
                                                            ? 'bg-slate-300 border-white'
                                                            : 'bg-white border-primary-200'}
                                                `} />

                                                {/* Time Label on Left */}
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 text-right pr-4">
                                                    <span className={`
                                                        text-xs font-bold font-mono py-1 px-2 rounded-md
                                                        ${status === 'ongoing' ? 'bg-primary-100 text-primary-700' : 'text-slate-500'}
                                                    `}>
                                                        {schedule.time.split('-')[0].trim()}
                                                    </span>
                                                </div>

                                                <ScheduleCard
                                                    subject={schedule.subject}
                                                    time={schedule.time}
                                                    room={schedule.room}
                                                    teacher={null} // Current user is teacher
                                                    status={status}
                                                    className={`
                                                        hover:translate-x-1 transition-transform
                                                        ${status === 'completed' ? 'opacity-70 grayscale-[0.3]' : ''}
                                                    `}
                                                    actionLabel="Detail Kelas"
                                                    onAction={() => { }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                        <CalendarIcon className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Hari Libur / Tidak Ada Jadwal</h3>
                                    <p className="text-slate-500 max-w-sm mx-auto">
                                        Anda tidak memiliki jadwal mengajar hari ini. Gunakan waktu ini untuk persiapan materi atau istirahat.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 animate-in fade-in zoom-in-95 duration-500">
                            {days.map((day, index) => {
                                const isToday = day === currentDay;
                                const activeSchedules = schedules[day] || [];
                                const hasSchedules = activeSchedules.length > 0;

                                return (
                                    <div
                                        key={day}
                                        className={`flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 ${isToday ? 'ring-2 ring-primary-500 shadow-xl shadow-primary-500/10' : 'hover:shadow-lg'}`}
                                    >
                                        <div className={`p-4 border-b ${isToday ? 'bg-primary-600 text-white' : 'bg-white border-slate-100'}`}>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className={`text-lg font-bold ${isToday ? 'text-white' : 'text-slate-800'}`}>{day}</h3>
                                                    <p className={`text-xs font-medium ${isToday ? 'text-primary-100' : 'text-slate-500'}`}>{weekDates[day]}</p>
                                                </div>
                                                {isToday && <Badge className="bg-white/20 hover:bg-white/30 text-white border-0">Hari Ini</Badge>}
                                            </div>
                                        </div>

                                        <div className={`flex-1 p-3 space-y-3 ${isToday ? 'bg-primary-50/30' : 'bg-slate-50/50'}`}>
                                            {activeSchedules.length > 0 ? (
                                                activeSchedules.map((schedule) => {
                                                    const color = getColorForSubject(schedule.subject);
                                                    const status = isToday ? getScheduleStatus(schedule.time) : 'upcoming';

                                                    return (
                                                        <div
                                                            key={schedule.id}
                                                            className={`
                                                                relative bg-white p-3 rounded-xl border border-slate-100 shadow-sm
                                                                hover:shadow-md transition-shadow cursor-default group
                                                                ${status === 'ongoing' ? 'border-primary-500 ring-1 ring-primary-500' : ''}
                                                            `}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${color.bg} ${color.text}`}>
                                                                    {schedule.subject}
                                                                </span>
                                                                {status === 'ongoing' && (
                                                                    <span className="flex h-2 w-2 relative">
                                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.bg} ${color.text}`}>
                                                                    <GraduationCap className="w-4 h-4" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-semibold text-slate-600 truncate">{schedule.class}</p>
                                                                    <p className="text-[10px] text-slate-400 truncate">{schedule.room}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-50 px-2 py-1.5 rounded-lg">
                                                                <Clock className="w-3 h-3" />
                                                                {schedule.time}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="h-32 flex flex-col items-center justify-center text-slate-400 italic text-xs">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                                                        <Layers className="w-4 h-4 text-slate-300" />
                                                    </div>
                                                    Tidak ada jadwal
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GuruSchedulePage;
