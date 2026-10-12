import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
    Calendar, Clock, MapPin, Save, Loader2, Users,
    BookOpen, GraduationCap, CheckCircle, BarChart, ChevronLeft, ChevronRight,
    TrendingUp, TrendingDown, Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { attendanceAPI } from '@/features/attendance/api/attendanceAPI';
import useAuthStore from '../../../store/authStore';
import { useGuruSchedules, useClassStudentsForAttendance, useTodayAttendance, useSubmitAttendance } from '../hooks/useAttendanceInput';
import AttendanceListItem from '../components/AttendanceListItem';
import { cn } from '../../../utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Input Attendance Page (Guru) - Redesigned
 */
const InputAttendancePage = () => {
    const user = useAuthStore((state) => state.user); // Assuming useAuthStore is available globally or imported
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [attendance, setAttendance] = useState({});
    const [notes, setNotes] = useState({});

    // Stats derived from useMemo now

    // Fetch Schedules
    const { data: schedules = [], isLoading: loadingSchedules } = useGuruSchedules(user?.id);

    // Auto-select first schedule
    // Auto-select first schedule
    useEffect(() => {
        if (!selectedSchedule && schedules.length > 0) {
            // Only select if not already selected
            setSelectedSchedule(schedules[0]);
        }
    }, [schedules]); // Remove selectedSchedule to avoid cycle

    // Fetch Students and Attendance
    const classId = selectedSchedule?.kelas_id || selectedSchedule?.kelas?.id;
    const { data: students = [], isLoading: loadingStudents } = useClassStudentsForAttendance(classId);
    const { data: existingAttendance = [], isLoading: loadingAttendance } = useTodayAttendance(selectedSchedule?.id);

    const submitAttendanceMutation = useSubmitAttendance();
    const isSubmitting = submitAttendanceMutation.isPending;
    const submitted = existingAttendance.length > 0;
    const loading = loadingSchedules || (classId && (loadingStudents || loadingAttendance));

    // Initialize state when data changes
    useEffect(() => {
        if (students.length > 0) {
            const initialStatus = {};
            const initialNotes = {};

            students.forEach(s => {
                const existing = existingAttendance.find(a => a.siswa_id === s.id);
                initialStatus[s.id] = existing?.status || 'hadir';
                initialNotes[s.id] = existing?.catatan || '';
            });

            setAttendance(initialStatus);
            setNotes(initialNotes);
        }
    }, [students, existingAttendance]);


    // Recalculate stats when attendance changes
    // Recalculate stats when attendance changes
    const stats = React.useMemo(() => {
        const newStats = { present: 0, permission: 0, sick: 0, absent: 0 };
        Object.values(attendance).forEach(status => {
            if (status === 'hadir') newStats.present++;
            if (status === 'izin') newStats.permission++;
            if (status === 'sakit') newStats.sick++;
            if (status === 'alpha') newStats.absent++;
        });
        return newStats;
    }, [attendance]);

    const handleStatusChange = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleNoteChange = (studentId, note) => {
        setNotes(prev => ({ ...prev, [studentId]: note }));
    };

    const handleMarkAll = (status) => {
        const newAttendance = {};
        const statusValue = status === 'Alpa' ? 'alpha' : status.toLowerCase();
        students.forEach(s => newAttendance[s.id] = statusValue);
        setAttendance(newAttendance);
        toast.success(`Semua siswa ditandai ${status}`);
    };

    const handleSubmit = () => {
        if (!selectedSchedule || !user?.id) return;

        const attendanceData = {
            scheduleId: selectedSchedule.id,
            inputBy: user.id,
            students: Object.entries(attendance).map(([siswaId, status]) => ({
                siswaId,
                status,
                catatan: notes[siswaId]
            })),
        };

        submitAttendanceMutation.mutate(attendanceData);
    };

    const today = new Date();
    const formattedDate = today.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Helpers
    const getSubjectName = (s) => s.mata_pelajaran_nama || s.mata_pelajaran?.nama || 'Mata Pelajaran';
    const getClassName = (s) => s.kelas_nama || s.kelas?.nama || '-';

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-indigo-600 animate-pulse" />
                    </div>
                </div>
                <p className="mt-4 text-gray-500 font-medium animate-pulse">Memuat jadwal Anda...</p>
            </div>
        );
    }

    if (schedules.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl mx-auto pt-10"
            >
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                    <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full  opacity-20"></div>
                        <Calendar className="h-20 w-20 text-indigo-200 mx-auto mb-4 relative z-10" />
                        <h2 className="text-2xl font-bold text-white relative z-10">Tidak Ada Jadwal Mengajar</h2>
                        <p className="text-indigo-100 mt-2 relative z-10">Anda bisa beristirahat atau mempersiapkan materi untuk besok.</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-32 pt-6 px-4 sm:px-6">
            {/* Header Section */}
            <header className="relative">
                <div className="absolute -left-6 -top-6 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-2 mb-3 border border-indigo-100"
                        >
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            {formattedDate}
                        </motion.div>

                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                    >
                        <Button
                            onClick={handleSubmit}
                            isLoading={isSubmitting}
                            size="lg"
                            className={cn(
                                "rounded-xl shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl",
                                submitted
                                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                                    : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30"
                            )}
                            disabled={students.length === 0}
                        >
                            {submitted ? <CheckCircle className="mr-2 h-5 w-5" /> : <Save className="mr-2 h-5 w-5" />}
                            {submitted ? 'Update Absensi' : 'Simpan Absensi'}
                        </Button>
                    </motion.div>
                </div>
            </header>

            {/* Schedule Timeline */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
            >
                <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-hide snap-x">
                    {schedules.map((schedule) => {
                        const isSelected = selectedSchedule?.id === schedule.id;
                        return (
                            <motion.button
                                key={schedule.id}
                                onClick={() => setSelectedSchedule(schedule)}
                                layoutId={isSelected ? 'active-schedule' : undefined}
                                className={cn(
                                    "flex-shrink-0 snap-center relative group min-w-[280px] p-5 rounded-2xl transition-all duration-300 border-2 text-left",
                                    isSelected
                                        ? "bg-gradient-to-br from-indigo-600 to-purple-700 border-transparent shadow-xl shadow-indigo-500/30 transform scale-[1.02]"
                                        : "bg-white border-gray-100 hover:border-indigo-100 hover:shadow-lg hover:-translate-y-1"
                                )}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        isSelected ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-600"
                                    )}>
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        "font-mono text-xs",
                                        isSelected ? "text-indigo-100 border-white/20 bg-white/10" : "text-gray-500 bg-gray-50"
                                    )}>
                                        {schedule.jam_mulai?.slice(0, 5)} - {schedule.jam_selesai?.slice(0, 5)}
                                    </Badge>
                                </div>

                                <h3 className={cn(
                                    "text-lg font-bold mb-1 truncate",
                                    isSelected ? "text-white" : "text-gray-800 group-hover:text-indigo-600"
                                )}>
                                    {getSubjectName(schedule)}
                                </h3>

                                <div className="flex items-center gap-3">
                                    <div className={cn("flex items-center gap-1.5 text-sm", isSelected ? "text-indigo-100" : "text-gray-500")}>
                                        <GraduationCap className="h-3.5 w-3.5" />
                                        {getClassName(schedule)}
                                    </div>
                                    {schedule.ruangan && (
                                        <div className={cn("flex items-center gap-1.5 text-sm", isSelected ? "text-indigo-100" : "text-gray-500")}>
                                            <MapPin className="h-3.5 w-3.5" />
                                            {schedule.ruangan}
                                        </div>
                                    )}
                                </div>

                                {isSelected && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        className="absolute -bottom-1 -right-1"
                                    >
                                        <div className="bg-white text-indigo-600 p-1.5 rounded-tl-xl rounded-br-xl shadow-sm">
                                            <Activity className="h-4 w-4" />
                                        </div>
                                    </motion.div>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </motion.div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats Sidebar (Floating) */}
                <div className="lg:col-span-1 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg sticky top-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <BarChart className="h-5 w-5 text-indigo-500" />
                                Statistik
                            </h3>
                            <Badge variant={submitted ? 'success' : 'warning'} className={cn(
                                "px-2.5 py-0.5",
                                submitted ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )}>
                                {submitted ? 'Tersimpan' : 'Draft'}
                            </Badge>
                        </div>

                        <div className="space-y-4">
                            {[
                                { label: 'Hadir', value: stats.present, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' },
                                { label: 'Izin', value: stats.permission, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-500' },
                                { label: 'Sakit', value: stats.sick, color: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-500' },
                                { label: 'Alpha', value: stats.absent, color: 'text-rose-600', bg: 'bg-rose-50', bar: 'bg-rose-500' }
                            ].map((stat) => (
                                <div key={stat.label} className="group">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.label}</span>
                                        <span className={cn("text-xl font-bold", stat.color)}>{stat.value}</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(stat.value / (students.length || 1)) * 100}%` }}
                                            className={cn("h-full rounded-full transition-all duration-500", stat.bar)}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <p className="text-xs text-center text-gray-400">Total {students.length} Siswa</p>
                        </div>
                    </motion.div>
                </div>

                {/* Student List */}
                <div className="lg:col-span-3">
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-md overflow-hidden rounded-3xl">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Daftar Kehadiran</h3>
                                <p className="text-sm text-gray-500">Silahkan tandai status kehadiran siswa</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAll('Hadir')}
                                className="bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300 transition-colors"
                            >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Tandai Semua Hadir
                            </Button>
                        </div>

                        <div className="divide-y divide-gray-50 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            <AnimatePresence>
                                {students.length > 0 ? (
                                    students.map((student) => (
                                        <AttendanceListItem
                                            key={student.id}
                                            student={{
                                                id: student.id,
                                                nis: student.nis,
                                                name: student.user?.full_name || 'N/A',
                                                gender: student.jenis_kelamin,
                                            }}
                                            status={attendance[student.id]}
                                            note={notes[student.id]}
                                            onStatusChange={handleStatusChange}
                                            onNoteChange={handleNoteChange}
                                            disabled={isSubmitting}
                                        />
                                    ))
                                ) : (
                                    <div className="py-20 text-center flex flex-col items-center justify-center">
                                        <div className="bg-gray-100 p-6 rounded-full mb-4">
                                            <Users className="h-10 w-10 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900">Belum Ada Data Siswa</h3>
                                        <p className="text-gray-500 max-w-sm mx-auto mt-2">Data siswa untuk kelas ini belum tersedia atau belum diinput.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default InputAttendancePage;
