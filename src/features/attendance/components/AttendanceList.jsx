import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Calendar as CalendarIcon, Clock, BookOpen } from 'lucide-react';

export const AttendanceList = ({ history, monthName, year }) => {

    // Sort history by date descending
    const sortedHistory = [...history].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '-';
        const date = new Date(timeStr);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'hadir': return 'success';
            case 'izin': return 'warning';
            case 'sakit': return 'info';
            case 'alpha': return 'danger';
            default: return 'default';
        }
    };

    if (sortedHistory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                <CalendarIcon className="h-12 w-12 mb-3 opacity-20" />
                <p>Belum ada data kehadiran</p>
                <p className="text-sm">untuk bulan {monthName} {year}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sortedHistory.map((item, index) => {
                const isHadir = item.status === 'hadir';

                return (
                    <div
                        key={item.id || index}
                        className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-start md:items-center justify-between gap-4 group"
                    >
                        <div className="flex items-start gap-4">
                            {/* Date Box */}
                            <div className="flex-shrink-0 w-16 text-center">
                                <span className="block text-xs uppercase text-gray-400 font-bold">
                                    {new Date(item.tanggal).toLocaleDateString('id-ID', { month: 'short' })}
                                </span>
                                <span className="block text-2xl font-bold text-gray-900 leading-none mt-1">
                                    {new Date(item.tanggal).getDate()}
                                </span>
                                <span className="block text-xs text-gray-400 mt-1">
                                    {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'short' })}
                                </span>
                            </div>

                            {/* Divider */}
                            <div className={`hidden md:block w-1 h-12 rounded-full ${item.status === 'hadir' ? 'bg-green-200' :
                                    item.status === 'izin' ? 'bg-amber-200' :
                                        item.status === 'sakit' ? 'bg-blue-200' : 'bg-red-200'
                                }`}></div>

                            {/* Details */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge variant={getStatusVariant(item.status)} className="capitalize px-2.5 py-0.5 shadow-sm">
                                        {item.status}
                                    </Badge>
                                    <span className="text-sm text-gray-400 hidden md:inline-block">•</span>
                                    <span className="text-sm font-medium text-gray-900 md:hidden">
                                        {formatDate(item.tanggal)}
                                    </span>
                                </div>

                                <div className="text-sm text-gray-500 flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                                    {isHadir && item.waktu_hadir && (
                                        <div className="flex items-center gap-1.5 text-gray-700 bg-gray-50 px-2 py-1 rounded-md">
                                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                                            <span className="font-medium text-xs">Check-in: {formatTime(item.waktu_hadir)}</span>
                                        </div>
                                    )}

                                    {(item.catatan || item.keterangan || item.mata_pelajaran) && (
                                        <div className="flex items-center gap-1.5 mt-1 md:mt-0">
                                            {item.mata_pelajaran && <BookOpen className="w-3.5 h-3.5 text-gray-400" />}
                                            <span>
                                                {item.mata_pelajaran || item.catatan || item.keterangan}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
