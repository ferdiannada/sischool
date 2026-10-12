import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Calendar, Save, ArrowLeft, Users, CheckCircle2, AlertCircle, Clock, User, BookOpen, ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AttendanceListItem from '../components/AttendanceListItem';
// dashboardAPI removed
import useAuthStore from '../../../store/authStore';
import { useKetuaKelasSchedules, useKetuaKelasClassmates, useSubmitKetuaKelasAttendance, useScheduleAttendance } from '../hooks/useKetuaKelasAttendance';

const KetuaKelasInputAttendancePage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const initialScheduleId = searchParams.get('schedule');
    const user = useAuthStore((state) => state.user);

    // Derived loading state
    const loading = true; // Placeholder if needed, or remove if unused

    // Fetch schedules
    const { data: schedulesData, isLoading: loadingSchedules } = useKetuaKelasSchedules(user?.id);
    const schedules = React.useMemo(() => schedulesData || [], [schedulesData]);

    // Fetch classmates
    const { data: studentsData, isLoading: loadingStudents } = useKetuaKelasClassmates(user?.id);
    const students = React.useMemo(() => studentsData || [], [studentsData]);

    // Initial Schedule Logic
    const [selectedScheduleId, setSelectedScheduleId] = useState(initialScheduleId);
    const [scheduleInfo, setScheduleInfo] = useState(null);
    const [showScheduleDropdown, setShowScheduleDropdown] = useState(false);

    // Derived state for attendance
    const [attendance, setAttendance] = useState({});
    const [notes, setNotes] = useState({});

    const submitMutation = useSubmitKetuaKelasAttendance();
    const isSubmitting = submitMutation.isPending;

    // Effect to handle initial schedule selection from URL or data load
    // Effect to handle initial schedule selection from URL or data load
    useEffect(() => {
        if (schedules.length > 0 && initialScheduleId && !selectedScheduleId) {
            const task = schedules.find(t => t.id === parseInt(initialScheduleId));
            if (task) {
                setSelectedScheduleId(initialScheduleId);
                setScheduleInfo(task);
            }
        }
    }, [schedules, initialScheduleId]); // Removed selectedScheduleId check logic from here to avoid cycle

    // Fetch existing attendance for selected schedule
    const { data: scheduleAttendanceData } = useScheduleAttendance(selectedScheduleId);
    const scheduleAttendance = React.useMemo(() => scheduleAttendanceData || [], [scheduleAttendanceData]);

    // Effect to initialize attendance when students load or schedule changes
    useEffect(() => {
        if (students.length > 0) {
            const initialAttendance = {};
            const initialNotes = {};

            // Create a lookup map for existing attendance
            const existingAttendanceMap = new Map();
            if (scheduleAttendance && scheduleAttendance.length > 0) {
                scheduleAttendance.forEach(record => {
                    existingAttendanceMap.set(record.siswa_id, record);
                });
            }

            students.forEach(s => {
                const existing = existingAttendanceMap.get(s.id);
                if (existing) {
                    initialAttendance[s.id] = existing.status;
                    if (existing.catatan) {
                        initialNotes[s.id] = existing.catatan;
                    }
                } else {
                    initialAttendance[s.id] = 'hadir';
                }
            });

            setAttendance(initialAttendance);
            setNotes(prev => ({ ...prev, ...initialNotes }));
        }
    }, [students, scheduleAttendance]); // Removed selectedScheduleId to avoid cycle

    const handleScheduleSelect = (schedule) => {
        setSelectedScheduleId(schedule.id.toString());
        setScheduleInfo(schedule);
        setShowScheduleDropdown(false);
    };

    const handleStatusChange = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const handleNoteChange = (studentId, note) => {
        setNotes(prev => ({ ...prev, [studentId]: note }));
    };

    const handleSubmit = () => {
        if (!selectedScheduleId) {
            toast.error('Pilih jadwal terlebih dahulu');
            return;
        }

        const attendanceData = students.map(s => ({
            siswa_id: s.id,
            status: attendance[s.id] || 'hadir',
            keterangan: notes[s.id] || ''
        }));

        submitMutation.mutate({
            userId: user.id,
            scheduleId: parseInt(selectedScheduleId),
            attendanceData
        }, {
            onSuccess: (result) => {
                if (result?.success) {
                    navigate('/ketua-kelas/dashboard');
                }
            }
        });
    };

    // Calculate Progress
    const totalStudents = students.length;
    const presentCount = Object.values(attendance).filter(s => s === 'hadir').length;
    const progress = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

    if (loadingSchedules && loadingStudents) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-24">
            {/* Header */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/ketua-kelas/dashboard')}
                        className="p-2 hover:bg-gray-100 rounded-xl"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Input Absensi</h1>
                        <p className="text-gray-500 text-sm">Pilih jadwal dan catat kehadiran siswa</p>
                    </div>
                </div>

                {/* Schedule Selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowScheduleDropdown(!showScheduleDropdown)}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${selectedScheduleId
                            ? 'border-amber-200 bg-amber-50/50'
                            : 'border-dashed border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-50/30'
                            }`}
                    >
                        {scheduleInfo ? (
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${scheduleInfo.status === 'ongoing'
                                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-900">{scheduleInfo.mata_pelajaran}</p>
                                    <p className="text-sm text-gray-500 flex items-center gap-2">
                                        <span>{scheduleInfo.jam_mulai} - {scheduleInfo.jam_selesai}</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {scheduleInfo.guru}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 text-gray-500">
                                <BookOpen className="w-5 h-5" />
                                <span>Pilih jadwal pelajaran...</span>
                            </div>
                        )}
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showScheduleDropdown ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown */}
                    <AnimatePresence>
                        {showScheduleDropdown && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-20 overflow-hidden"
                            >
                                {schedules.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500">
                                        <Calendar className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                        <p>Tidak ada jadwal hari ini</p>
                                    </div>
                                ) : (
                                    <div className="max-h-80 overflow-y-auto">
                                        {schedules.map((schedule, index) => (
                                            <button
                                                key={schedule.id}
                                                onClick={() => handleScheduleSelect(schedule)}
                                                className={`w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${selectedScheduleId === schedule.id.toString() ? 'bg-amber-50' : ''
                                                    }`}
                                            >
                                                <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${schedule.status === 'ongoing'
                                                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                                                    : schedule.status === 'completed'
                                                        ? 'bg-gray-100 text-gray-400'
                                                        : 'bg-white border border-gray-200 text-gray-600'
                                                    }`}>
                                                    <span className="text-xs font-bold">{schedule.jam_mulai}</span>
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="font-semibold text-gray-900">{schedule.mata_pelajaran}</p>
                                                    <p className="text-sm text-gray-500">{schedule.guru}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {schedule.sudah_absen && (
                                                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                                                            Sudah Absen
                                                        </span>
                                                    )}
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${schedule.status === 'ongoing'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : schedule.status === 'completed'
                                                            ? 'bg-gray-100 text-gray-500'
                                                            : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {schedule.status === 'ongoing' ? 'Berlangsung' : schedule.status === 'completed' ? 'Selesai' : 'Akan Datang'}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Progress Section - Only show when schedule selected */}
            {selectedScheduleId && students.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
                >
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-emerald-600">{presentCount} Hadir</span>
                            <span className="text-gray-500">{totalStudents - presentCount} Tidak Hadir</span>
                        </div>
                        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Student List */}
            {selectedScheduleId ? (
                <div className="space-y-4">
                    {students.length === 0 ? (
                        <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500">Tidak ada data siswa ditemukan.</p>
                        </div>
                    ) : (
                        students.map((student, index) => (
                            <motion.div
                                key={student.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <AttendanceListItem
                                    student={{
                                        id: student.id,
                                        name: student.name,
                                        nis: student.nis,
                                        gender: student.jenis_kelamin
                                    }}
                                    status={attendance[student.id]}
                                    note={notes[student.id]}
                                    onStatusChange={handleStatusChange}
                                    onNoteChange={handleNoteChange}
                                    disabled={isSubmitting}
                                />
                            </motion.div>
                        ))
                    )}
                </div>
            ) : (
                <Card className="border-amber-100 bg-amber-50/50">
                    <CardContent className="p-8 text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-3 text-amber-400" />
                        <h3 className="font-bold text-lg text-amber-900">Pilih Jadwal Pelajaran</h3>
                        <p className="text-sm mt-1 text-amber-700">Klik dropdown di atas untuk memilih jadwal yang akan diabsen.</p>
                    </CardContent>
                </Card>
            )}

            {/* Floating Submit Button */}
            {selectedScheduleId && students.length > 0 && (
                <div className="fixed bottom-6 left-0 right-0 px-6 flex justify-center z-20 pointer-events-none">
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        className="bg-white p-2 pr-6 rounded-full shadow-2xl border border-gray-100 flex items-center gap-4 pointer-events-auto"
                    >
                        <div className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                            Total: {students.length} Siswa
                        </div>
                        <Button
                            onClick={handleSubmit}
                            isLoading={isSubmitting}
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30 rounded-full px-8"
                        >
                            <Save className="mr-2 h-4 w-4" />
                            Simpan Absensi
                        </Button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default KetuaKelasInputAttendancePage;
