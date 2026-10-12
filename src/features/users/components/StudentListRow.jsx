import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

const StudentListRow = ({ student, index, onViewDetail, onAssignKetua, isCurrentKetua }) => {
    return (
        <motion.tr
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: index * 0.02 }}
            className={`hover:bg-gray-50 transition-colors cursor-pointer 
                ${isCurrentKetua ? 'bg-amber-50/50' : ''}`}
            onClick={() => onViewDetail(student)}
        >
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold relative
                        ${student.gender === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                        {(student.name || 'S').charAt(0)}
                        {isCurrentKetua && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                                <Crown className="w-2.5 h-2.5 text-white" />
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {student.name}
                            {isCurrentKetua && (
                                <span className="text-xs text-amber-600 font-medium">(Ketua)</span>
                            )}
                        </div>
                        <div className="text-xs text-gray-500">{student.nis}</div>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <Badge variant="secondary" className="text-xs">
                    {student.gender === 'L' ? 'L' : 'P'}
                </Badge>
            </td>
            <td className="px-4 py-3 text-sm text-gray-500">{student.phone || '-'}</td>
            <td className="px-4 py-3">
                <div className="flex gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-green-100 text-green-700">{student.attendance_summary?.hadir || 0}</span>
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-700">{student.attendance_summary?.alpha || 0}</span>
                </div>
            </td>
            <td className="px-4 py-3">
                <Badge variant={student.status === 'aktif' ? 'success' : 'secondary'} className="text-xs">
                    {student.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                </Badge>
            </td>
            <td className="px-4 py-3">
                {!isCurrentKetua && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAssignKetua(student);
                        }}
                        className="p-1.5 hover:bg-amber-50 rounded-lg text-gray-400 hover:text-amber-600 transition-colors"
                        title="Jadikan Ketua Kelas"
                    >
                        <Crown className="w-4 h-4" />
                    </button>
                )}
            </td>
        </motion.tr>
    );
};

export default StudentListRow;
