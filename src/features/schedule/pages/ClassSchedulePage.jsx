import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Clock, User, BookOpen, Loader2, Calendar, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import { useClassSchedule } from '../hooks/useClassSchedule';
import { motion } from 'framer-motion';

const DAY_NAMES = {
    1: 'Senin',
    2: 'Selasa',
    3: 'Rabu',
    4: 'Kamis',
    5: 'Jumat',
    6: 'Sabtu',
    7: 'Minggu'
};

const ClassSchedulePage = () => {
    const { user } = useAuthStore();
    const { data: scheduleData, isLoading: loading } = useClassSchedule(user?.id);

    // Default values
    const schedules = scheduleData?.schedules || [];
    const kelas = scheduleData?.kelas || null;
    const today = scheduleData?.today || (new Date().getDay() || 7);

    // Initial state for selected day needs to be managed locally, but defaulted to today from server or calc
    const [selectedDay, setSelectedDay] = useState(today);

    // Sync selectedDay with today when data loads initially (optional, but good UX if loading is slow)
    // Sync selectedDay with today when data loads
    useEffect(() => {
        if (scheduleData?.today) {
            setSelectedDay(scheduleData.today);
        }
    }, [scheduleData]); // Depend on scheduleData object or specific property

    // No manual fetching needed


    // Group schedules by day
    const schedulesByDay = {};
    [1, 2, 3, 4, 5, 6].forEach(day => {
        schedulesByDay[day] = schedules.filter(s => s.hari === day).sort((a, b) => {
            return a.jam_mulai.localeCompare(b.jam_mulai);
        });
    });

    const activeSchedules = schedulesByDay[selectedDay] || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-amber-500" />
                        Jadwal Pelajaran
                    </h1>
                    <p className="text-gray-500">
                        {kelas?.nama || 'Kelas'} • Semester Ganjil 2025/2026
                    </p>
                </div>
            </div>

            {/* Day Selector */}
            <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar">
                {[1, 2, 3, 4, 5, 6].map(day => (
                    <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`
                            flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-2xl min-w-[80px] transition-all
                            ${selectedDay === day
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                                : 'bg-white text-gray-500 border border-gray-100 hover:bg-amber-50 hover:border-amber-200'
                            }
                        `}
                    >
                        <span className="text-xs font-medium uppercase opacity-80">{DAY_NAMES[day].substring(0, 3)}</span>
                        <span className={`text-lg font-bold ${selectedDay === day ? 'text-white' : 'text-gray-900'}`}>{day === today ? '•' : ''}</span>
                    </button>
                ))}
            </div>

            {/* Schedule Timeline */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <h2 className="text-lg font-bold text-gray-900">{DAY_NAMES[selectedDay]}</h2>
                    {today === selectedDay && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            Hari Ini
                        </span>
                    )}
                </div>

                {activeSchedules.length > 0 ? (
                    activeSchedules.map((schedule, index) => (
                        <ScheduleItem key={schedule.id} schedule={schedule} index={index} />
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-gray-900 font-medium">Libur!</h3>
                        <p className="text-gray-500 text-sm mt-1">Tidak ada jadwal pelajaran hari ini.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const ScheduleItem = ({ schedule, index }) => {
    // Attempt to determine if currently active (mock logic as we don't have real time parsing here easily without moment/date-fns)
    // For now we trust the visual impact.

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative flex gap-6"
        >
            {/* Time Column */}
            <div className="flex flex-col items-center min-w-[60px]">
                <div className="text-sm font-bold text-gray-900">{schedule.jam_mulai}</div>
                <div className="w-px h-full bg-gray-200 my-2 group-last:bg-transparent" />
            </div>

            {/* Card Content */}
            <div className="flex-1 pb-8">
                <div className={`
                    p-5 rounded-2xl border transition-all duration-300
                    hover:shadow-md cursor-default relative overflow-hidden bg-white border-gray-100 hover:border-amber-200
                `}>
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-orange-500 transform origin-left scale-y-0 transition-transform duration-300 group-hover:scale-y-100" />

                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1">{schedule.mata_pelajaran}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <User className="w-4 h-4 text-gray-400" />
                                <span>{schedule.guru}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-50 text-amber-600">
                            <BookOpen className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-medium text-gray-600">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            {schedule.ruangan || 'Ruang Kelas'}
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 text-xs font-medium text-gray-600">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {schedule.jam_selesai} Selesai
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ClassSchedulePage;
