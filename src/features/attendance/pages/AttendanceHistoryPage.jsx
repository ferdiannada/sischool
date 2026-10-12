import React, { useState, useEffect } from 'react';
import { Loader2, Calendar as CalendarIcon, List, Download } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { siswaAPI } from '@/features/users/api/siswaAPI';
import useAuthStore from '../../../store/authStore';
import { useAttendanceHistory } from '../hooks/useAttendanceHistory';
import { AttendanceStats } from '../components/AttendanceStats';
import { AttendanceCalendar } from '../components/AttendanceCalendar';
import { AttendanceList } from '../components/AttendanceList';
import { Modal } from '../../../components/ui/Modal';
import { Badge } from '../../../components/ui/Badge';

const BULAN_NAMA = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Attendance History Page (Siswa) - Redesigned
 */
const AttendanceHistoryPage = () => {
    const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
    const [selectedAttendance, setSelectedAttendance] = useState(null);

    // Month/Year filter
    const now = new Date();
    const [month, setMonth] = useState(now.getMonth() + 1);
    const [year, setYear] = useState(now.getFullYear());
    // React Query
    const user = useAuthStore((state) => state.user);
    const userId = user?.id;

    const { data, isLoading: loading, error } = useAttendanceHistory(userId, month, year);

    // Default data structure to avoid undefined errors
    const safeData = data || { stats: {}, history: [] };

    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const handleNextMonth = () => {
        const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();
        if (!isCurrentMonth) {
            if (month === 12) {
                setMonth(1);
                setYear(year + 1);
            } else {
                setMonth(month + 1);
            }
        }
    };

    const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

    const getStatusVariant = (status) => {
        switch (status) {
            case 'hadir': return 'success';
            case 'izin': return 'warning';
            case 'sakit': return 'info';
            case 'alpha': return 'danger';
            default: return 'default';
        }
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '-';
        return new Date(timeStr).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Riwayat Kehadiran</h1>
                    <p className="text-gray-500 mt-1">Pantau kehadiranmu setiap bulan.</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-white p-1 rounded-lg border border-gray-200 flex items-center shadow-sm">
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'calendar'
                                ? 'bg-primary-50 text-primary-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            <span className="hidden sm:inline">Kalender</span>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list'
                                ? 'bg-primary-50 text-primary-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <List className="w-4 h-4" />
                            <span className="hidden sm:inline">List</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center justify-center">
                    <p>⚠️ {error.message || 'Gagal memuat data'}</p>
                </div>
            )}

            {/* Stats Section */}
            <AttendanceStats stats={safeData.stats} />

            {/* Main Content */}
            <div className="transition-all duration-300">
                {viewMode === 'calendar' ? (
                    <AttendanceCalendar
                        month={month}
                        year={year}
                        history={safeData.history}
                        onPrevMonth={handlePrevMonth}
                        onNextMonth={handleNextMonth}
                        isCurrentMonth={isCurrentMonth}
                        onSelectDate={(att) => setSelectedAttendance(att)}
                    />
                ) : (
                    <div className="space-y-4">
                        {/* Month Navigation for List View */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
                            <Button variant="ghost" size="sm" onClick={handlePrevMonth}>
                                ← {BULAN_NAMA[month === 1 ? 11 : month - 2]}
                            </Button>
                            <span className="font-bold text-gray-900">
                                {BULAN_NAMA[month - 1]} {year}
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleNextMonth}
                                disabled={isCurrentMonth}
                            >
                                {isCurrentMonth ? 'Bulan Ini' : `${BULAN_NAMA[month === 12 ? 0 : month]} →`}
                            </Button>
                        </div>
                        <AttendanceList
                            history={safeData.history}
                            monthName={BULAN_NAMA[month - 1]}
                            year={year}
                        />
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <Modal
                isOpen={!!selectedAttendance}
                onClose={() => setSelectedAttendance(null)}
                title="Detail Kehadiran"
                size="sm"
            >
                {selectedAttendance && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-3 ${selectedAttendance.status === 'hadir' ? 'bg-green-100 text-green-600' :
                                selectedAttendance.status === 'izin' ? 'bg-amber-100 text-amber-600' :
                                    selectedAttendance.status === 'sakit' ? 'bg-blue-100 text-blue-600' :
                                        'bg-red-100 text-red-600'
                                }`}>
                                <CalendarIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {new Date(selectedAttendance.tanggal).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                            </h3>
                            <Badge variant={getStatusVariant(selectedAttendance.status)} className="mt-2 text-base px-3 py-1">
                                {selectedAttendance.status.toUpperCase()}
                            </Badge>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Waktu Check-in</span>
                                <span className="font-medium font-mono text-gray-900">
                                    {selectedAttendance.waktu_hadir ? formatTime(selectedAttendance.waktu_hadir) : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Mata Pelajaran</span>
                                <span className="font-medium text-gray-900 text-right">
                                    {selectedAttendance.mata_pelajaran || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between items-start pt-1">
                                <span className="text-gray-500 whitespace-nowrap mr-4">Catatan</span>
                                <span className="font-medium text-gray-900 text-right">
                                    {selectedAttendance.catatan || selectedAttendance.keterangan || '-'}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button onClick={() => setSelectedAttendance(null)} variant="outline" className="w-full">
                                Tutup
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AttendanceHistoryPage;
