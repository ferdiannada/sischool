import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
    Calendar as CalendarIcon, List, ChevronLeft, ChevronRight,
    UserCheck, Clock, AlertCircle, XCircle, ChevronDown, CheckCircle
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval,
    isSameMonth, isSameDay, addMonths, subMonths, getDay, parseISO
} from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useParentData } from '../../users/hooks/useParentData';
import { useChildAttendance } from '../hooks/useChildAttendance';

const ChildAttendancePage = () => {
    const { user } = useAuthStore();
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null); // For modal/detail view

    // 1. Fetch Children
    const { data: children = [], isLoading: isLoadingChildren } = useParentData(user?.id);

    // 2. Select first child automatically
    useEffect(() => {
        if (children.length > 0 && !selectedChildId) {
            // Initialization logic handled in useState or specific callback preferred
            // Keeping safe wrapper
            setSelectedChildId(children[0].id);
        }
    }, [children]); // Remove selectedChildId from deps to avoid cycle

    // 3. Fetch Attendance Data (Hooks)
    const { stats, history: attendanceHistory, isLoading: isLoadingAttendance } = useChildAttendance(
        selectedChildId,
        currentMonth.getMonth() + 1,
        currentMonth.getFullYear()
    );

    // Derived Selection State
    const selectedChild = children.find(c => c.id === selectedChildId);

    // --- Stats Memo ---
    // Note: 'stats' from hook is already the correct shape for current month!
    const attendanceStats = useMemo(() => {
        return stats;
    }, [stats]);

    const attendanceRate = useMemo(() => {
        const total = attendanceStats.hadir + attendanceStats.izin + attendanceStats.sakit + attendanceStats.alpha;
        return total > 0 ? Math.round((attendanceStats.hadir / total) * 100) : 0;
    }, [attendanceStats]);

    // --- Calendar Logic ---
    const calendarDays = useMemo(() => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        const days = eachDayOfInterval({ start, end });

        // Pad empty days at start
        const startDay = getDay(start); // 0 = Sunday
        const padding = Array(startDay).fill(null);

        return [...padding, ...days];
    }, [currentMonth]);

    const getDayStatus = (date) => {
        if (!date) return null;
        // Find logs for this day
        const logs = attendanceHistory.filter(log => isSameDay(parseISO(log.tanggal), date));
        if (logs.length === 0) return null;

        if (logs.some(l => l.status === 'alpha')) return 'alpha';
        if (logs.some(l => l.status === 'sakit')) return 'sakit';
        if (logs.some(l => l.status === 'izin')) return 'izin';
        if (logs.some(l => l.status === 'hadir')) return 'hadir';
        return null;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'hadir': return 'bg-green-500';
            case 'izin': return 'bg-yellow-500';
            case 'sakit': return 'bg-blue-500';
            case 'alpha': return 'bg-red-500';
            default: return 'bg-gray-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'hadir': return 'Hadir';
            case 'izin': return 'Izin';
            case 'sakit': return 'Sakit';
            case 'alpha': return 'Alpa';
            default: return '';
        }
    };

    // Filtered logs for selected date
    const selectedDateLogs = useMemo(() => {
        if (!selectedDate) return [];
        return attendanceHistory.filter(log => isSameDay(parseISO(log.tanggal), selectedDate));
    }, [selectedDate, attendanceHistory]);

    if (isLoadingChildren || (isLoadingAttendance && !selectedChildId)) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 py-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kehadiran Siswa</h1>
                    <p className="text-gray-500 text-sm">Monitoring kehadiran dan aktivitas belajar.</p>
                </div>

                {children.length > 1 && (
                    <div className="relative">
                        <select
                            className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer font-medium text-gray-700 min-w-[200px]"
                            value={selectedChildId || ''}
                            onChange={(e) => setSelectedChildId(parseInt(e.target.value))}
                        >
                            {children.map(child => (
                                <option key={child.id} value={child.id}>{child.full_name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                )}
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance Rate Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden flex flex-col items-center justify-center text-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
                    <div className="relative h-40 w-40 mb-4">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                            <circle
                                cx="80" cy="80" r="70" fill="none" stroke={attendanceRate >= 80 ? '#22c55e' : attendanceRate >= 60 ? '#eab308' : '#ef4444'}
                                strokeWidth="12"
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * attendanceRate) / 100}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-gray-900">{attendanceRate}%</span>
                            <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Hadir</span>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500">
                        Total kehadiran bulan {format(currentMonth, 'MMMM yyyy', { locale: idLocale })}
                    </p>
                </div>

                {/* Detail Stats Grid */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-2xl p-5 border border-green-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                            <UserCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-green-600 font-medium text-sm">Hadir</p>
                            <h3 className="text-2xl font-bold text-gray-900">{attendanceStats.hadir} <span className="text-sm font-normal text-gray-500">hari</span></h3>
                        </div>
                    </div>
                    <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-blue-600 font-medium text-sm">Sakit</p>
                            <h3 className="text-2xl font-bold text-gray-900">{attendanceStats.sakit} <span className="text-sm font-normal text-gray-500">hari</span></h3>
                        </div>
                    </div>
                    <div className="bg-yellow-50 rounded-2xl p-5 border border-yellow-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-yellow-600 font-medium text-sm">Izin</p>
                            <h3 className="text-2xl font-bold text-gray-900">{attendanceStats.izin} <span className="text-sm font-normal text-gray-500">hari</span></h3>
                        </div>
                    </div>
                    <div className="bg-red-50 rounded-2xl p-5 border border-red-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="h-12 w-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                            <XCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-red-600 font-medium text-sm">Alpa</p>
                            <h3 className="text-2xl font-bold text-gray-900">{attendanceStats.alpha} <span className="text-sm font-normal text-gray-500">hari</span></h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area (Calendar/List) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 min-h-[500px]">
                {/* Visual Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'calendar'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <CalendarIcon className="h-4 w-4" />
                            Kalender
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'list'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <List className="h-4 w-4" />
                            Riwayat
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-gray-100"
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-bold text-gray-900 min-w-[150px] text-center">
                            {format(currentMonth, 'MMMM yyyy', { locale: idLocale })}
                        </h2>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-gray-100"
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {viewMode === 'calendar' ? (
                        <motion.div
                            key="calendar"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="grid grid-cols-7 gap-1 mb-4">
                                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                                    <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-2 md:gap-4">
                                {calendarDays.map((day, idx) => {
                                    if (!day) return <div key={`empty-${idx}`} className="aspect-square" />;

                                    const status = getDayStatus(day);
                                    const color = getStatusColor(status);
                                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                                    const isTodayDate = isSameDay(day, new Date());

                                    return (
                                        <button
                                            key={day.toISOString()}
                                            onClick={() => status && setSelectedDate(day)}
                                            className={`
                                                aspect-square rounded-xl flex flex-col items-center justify-center relative group transition-all
                                                ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
                                                ${status ? 'hover:shadow-md cursor-pointer bg-gray-50' : 'cursor-default opacity-50'}
                                                ${isTodayDate ? 'bg-primary-50 font-bold text-primary-600' : ''}
                                            `}
                                        >
                                            <span className={`text-sm md:text-base ${isTodayDate ? 'font-bold' : 'text-gray-700'}`}>
                                                {format(day, 'd')}
                                            </span>
                                            {status && (
                                                <div className={`mt-1 md:mt-2 h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${color}`} />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Legend */}
                            <div className="flex flex-wrap gap-4 mt-8 justify-center text-xs text-gray-500">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Hadir</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Sakit</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Izin</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Alpa</div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            {attendanceHistory
                                .filter(log => isSameMonth(parseISO(log.tanggal), currentMonth))
                                .length > 0 ? (
                                attendanceHistory
                                    .filter(log => isSameMonth(parseISO(log.tanggal), currentMonth))
                                    .map((log) => (
                                        <div key={log.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                                            <div className={`
                                            h-12 w-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-white
                                            ${getStatusColor(log.status)}
                                        `}>
                                                {format(parseISO(log.tanggal), 'd')}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900">{log.mapel}</h4>
                                                <p className="text-sm text-gray-500">
                                                    {format(parseISO(log.tanggal), 'EEEE', { locale: idLocale })} • {log.jam_mulai} - {log.jam_selesai}
                                                </p>
                                            </div>
                                            <Badge variant={log.status === 'hadir' ? 'success' : log.status === 'alpha' ? 'danger' : 'warning'}>
                                                {log.status}
                                            </Badge>
                                        </div>
                                    ))
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    Tidak ada data kehadiran bulan ini.
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Detail Modal for Calendar Date */}
            <AnimatePresence>
                {selectedDate && (
                    <div
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setSelectedDate(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[80vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-sm text-gray-500">Detail Kehadiran</p>
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: idLocale })}
                                    </h3>
                                </div>
                                <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                    <XCircle className="h-6 w-6 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {selectedDateLogs.length > 0 ? selectedDateLogs.map((log, idx) => (
                                    <div key={idx} className="flex gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                        <div className={`w-1 self-stretch rounded-full ${getStatusColor(log.status)}`}></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-gray-900">{log.mapel}</h4>
                                                <Badge className="text-[10px] h-5" variant={log.status === 'hadir' ? 'success' : log.status === 'alpha' ? 'danger' : 'warning'}>
                                                    {log.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {log.jam_mulai} - {log.jam_selesai}
                                            </p>
                                            {log.catatan && (
                                                <p className="text-xs text-gray-400 mt-2 italic">
                                                    "{log.catatan}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-center text-gray-500">Tidak ada data untuk hari ini (Hari libur/Kosong).</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ChildAttendancePage;
