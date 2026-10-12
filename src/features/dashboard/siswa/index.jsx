import React, { useState, useEffect } from 'react';
import { Calendar, User, BookOpen, Clock, Loader2, CheckCircle, AlertCircle, XCircle, MinusCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';
import useAuthStore from '../../../store/authStore';
import { useSiswaDashboard } from './hooks/useSiswaDashboard';
import { WelcomeBanner, StatCard, NextClassCard, TimelineItem } from './DashboardComponents';

/**
 * Siswa Dashboard
 * Shows student's schedule and attendance summary with real data
 */
const SiswaDashboard = () => {
    const { user } = useAuthStore();
    const { data: dashboardData, isLoading: loading } = useSiswaDashboard(user?.id);

    const siswaData = dashboardData?.siswa || null;
    const schedules = dashboardData?.schedules || [];
    const attendance = dashboardData?.attendance || { hadir: 0, izin: 0, sakit: 0, alpha: 0 };

    // State for real-time updates
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
        return () => clearInterval(timer);
    }, []);

    const totalAttendance = attendance.hadir + attendance.izin + attendance.sakit + attendance.alpha;
    const hadirPercentage = totalAttendance > 0 ? Math.round((attendance.hadir / totalAttendance) * 100) : 0;

    const attendanceChartData = [
        { name: 'Hadir', value: attendance.hadir, color: '#10B981' },
        { name: 'Izin', value: attendance.izin, color: '#F59E0B' },
        { name: 'Sakit', value: attendance.sakit, color: '#3B82F6' },
        { name: 'Alpha', value: attendance.alpha, color: '#EF4444' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mx-auto" />
                    <p className="mt-4 text-gray-500 font-medium">Memuat dashboard...</p>
                </div>
            </div>
        );
    }

    // Helper to parse time string "HH:mm - HH:mm"
    const getScheduleStatus = (timeStr) => {
        if (!timeStr) return 'unknown';

        try {
            const [startStr, endStr] = timeStr.split(' - ');
            const [startHour, startMinute] = startStr.split(':').map(Number);
            const [endHour, endMinute] = endStr.split(':').map(Number);

            const now = new Date();
            const startTime = new Date(now);
            startTime.setHours(startHour, startMinute, 0);

            const endTime = new Date(now);
            endTime.setHours(endHour, endMinute, 0);

            if (now >= startTime && now <= endTime) return 'ongoing';
            if (now < startTime) return 'upcoming';
            return 'completed';
        } catch (e) {
            console.error("Error parsing time:", timeStr, e);
            return 'unknown';
        }
    };

    const siswaName = siswaData?.user?.full_name || 'Siswa';
    const kelasName = siswaData?.kelas?.nama || null;

    // Calculate active and upcoming schedules
    const processedSchedules = schedules.map(s => ({
        ...s,
        realStatus: getScheduleStatus(s.time)
    }));

    const activeSchedule = processedSchedules.find(s => s.realStatus === 'ongoing');
    const nextSchedule = processedSchedules.find(s => s.realStatus === 'upcoming');
    const displaySchedule = activeSchedule || nextSchedule;

    // Filter out the displayed schedule from the list to avoid duplication
    const otherSchedules = processedSchedules.filter(s => s.id !== displaySchedule?.id);

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <WelcomeBanner studentName={siswaName} kelasName={kelasName} />

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    title="Hadir"
                    value={attendance.hadir}
                    icon={CheckCircle}
                    color="emerald"
                    subtext="Total kehadiran"
                />
                <StatCard
                    title="Izin"
                    value={attendance.izin}
                    icon={MinusCircle}
                    color="amber"
                    subtext="Izin resmi"
                />
                <StatCard
                    title="Sakit"
                    value={attendance.sakit}
                    icon={AlertCircle}
                    color="blue"
                    subtext="Keterangan sakit"
                />
                <StatCard
                    title="Alpha"
                    value={attendance.alpha}
                    icon={XCircle}
                    color="rose"
                    subtext="Tanpa keterangan"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Schedule */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            Jadwal Hari Ini
                        </h2>
                        <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>

                    {schedules.length > 0 ? (
                        <>
                            {/* Featured Class Card */}
                            {displaySchedule && (
                                <NextClassCard
                                    schedule={displaySchedule}
                                    status={displaySchedule.realStatus}
                                />
                            )}

                            {/* Timeline for other classes */}
                            {otherSchedules.length > 0 && (
                                <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
                                    <CardContent className="pt-6">
                                        {otherSchedules.map((schedule, index) => (
                                            <TimelineItem
                                                key={schedule.id}
                                                schedule={schedule}
                                                isLast={index === otherSchedules.length - 1}
                                            />
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-300">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Tidak ada jadwal</h3>
                            <p className="text-gray-500">Hari ini bebas dari kegiatan belajar mengajar.</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Attendance Chart & Meta */}
                <div className="space-y-6">
                    <Card className="h-full border-none shadow-md bg-white overflow-hidden">
                        <CardHeader className="bg-gray-50 border-b border-gray-100 pb-4">
                            <CardTitle className="text-base flex items-center gap-2 text-gray-800">
                                <User className="h-4 w-4 text-indigo-500" />
                                Kehadiran Bulan Ini
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-64 relative">
                                {totalAttendance > 0 ? (
                                    <>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={attendanceChartData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                    stroke="none"
                                                >
                                                    {attendanceChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        boxShadow: '0 4px 20px -2px rgba(0,0,0,0.1)'
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                            <span className="text-4xl font-extrabold text-gray-900">{hadirPercentage}%</span>
                                            <span className="text-sm font-medium text-gray-500 mt-1 uppercase tracking-wider">Hadir</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                                        <p>Belum ada data</p>
                                    </div>
                                )}
                            </div>

                            {/* Legend */}
                            <div className="grid grid-cols-2 gap-3 mt-6">
                                {attendanceChartData.map(item => (
                                    <div key={item.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                                            <span className="text-sm font-medium text-gray-600">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-gray-900">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SiswaDashboard;
