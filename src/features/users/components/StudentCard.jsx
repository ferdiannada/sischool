import React from 'react';
import { motion } from 'framer-motion';
import { Crown, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const StudentCard = ({ student, index, onViewDetail, onAssignKetua, isCurrentKetua }) => {
    const attendanceRate = student.attendance_summary
        ? Math.round(
            (student.attendance_summary.hadir /
                Math.max(1, student.attendance_summary.hadir + student.attendance_summary.sakit +
                    student.attendance_summary.izin + student.attendance_summary.alpha)) * 100
        )
        : 0;

    const getAttendanceColor = (rate) => {
        if (rate >= 90) return 'text-green-600 bg-green-100';
        if (rate >= 75) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.03 }}
            whileHover={{ y: -4, scale: 1.01 }}
            className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group relative
                ${isCurrentKetua ? 'border-amber-300 ring-2 ring-amber-100' : 'border-gray-100'}`}
        >
            {/* Ketua Kelas badge */}
            {isCurrentKetua && (
                <div className="absolute top-3 right-3 z-10">
                    <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-xs font-bold rounded-full shadow-sm">
                        <Crown className="w-3 h-3" />
                        Ketua
                    </div>
                </div>
            )}

            <div className="p-5">
                {/* Header with Avatar */}
                <div className="flex items-start justify-between mb-4">
                    <div className="relative">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold
                            ${student.gender === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                            {student.avatar_url ? (
                                <img src={student.avatar_url} alt={student.name} className="w-full h-full rounded-xl object-cover" />
                            ) : (
                                (student.name || 'S').charAt(0)
                            )}
                        </div>
                        {/* Attendance indicator ring */}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold ${getAttendanceColor(attendanceRate)}`}>
                            {attendanceRate}
                        </div>
                    </div>
                    <Badge variant={student.status === 'aktif' ? 'success' : 'secondary'} className="text-xs">
                        {student.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                    </Badge>
                </div>

                {/* Name and NIS */}
                <h3 className="font-bold text-gray-900 text-lg line-clamp-1 mb-1">{student.name}</h3>
                <p className="text-sm text-gray-500 mb-4">NIS: {student.nis}</p>

                {/* Quick Info */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary" className="text-xs">
                            {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </Badge>
                        {student.religion && (
                            <span className="text-xs text-gray-400">{student.religion}</span>
                        )}
                    </div>
                    {student.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span className="text-xs">{student.phone}</span>
                        </div>
                    )}
                </div>

                {/* Attendance Summary */}
                <div className="grid grid-cols-4 gap-2 p-3 bg-gray-50 rounded-xl mb-4">
                    <div className="text-center">
                        <div className="text-green-600 font-bold text-sm">{student.attendance_summary?.hadir || 0}</div>
                        <div className="text-[10px] text-gray-400">Hadir</div>
                    </div>
                    <div className="text-center">
                        <div className="text-blue-600 font-bold text-sm">{student.attendance_summary?.sakit || 0}</div>
                        <div className="text-[10px] text-gray-400">Sakit</div>
                    </div>
                    <div className="text-center">
                        <div className="text-yellow-600 font-bold text-sm">{student.attendance_summary?.izin || 0}</div>
                        <div className="text-[10px] text-gray-400">Izin</div>
                    </div>
                    <div className="text-center">
                        <div className="text-red-600 font-bold text-sm">{student.attendance_summary?.alpha || 0}</div>
                        <div className="text-[10px] text-gray-400">Alpha</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                    <Button
                        fullWidth
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetail(student)}
                        className="group-hover:bg-indigo-50 group-hover:border-indigo-200 group-hover:text-indigo-600 transition-colors"
                    >
                        Lihat Detail
                    </Button>
                    {!isCurrentKetua && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAssignKetua(student);
                            }}
                            className="px-3 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-600 transition-colors"
                            title="Jadikan Ketua Kelas"
                        >
                            <Crown className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default StudentCard;
