import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, Crown, Edit2, Phone, User, BookOpen } from 'lucide-react';
import { Button } from '../../../../../components/ui/Button';

const StudentDetailModal = ({ student, onClose, onAssignKetua, onAssignWali, isCurrentKetua }) => {
    if (!student) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold relative
                                ${student.gender === 'L' ? 'bg-blue-200 text-blue-700' : 'bg-pink-200 text-pink-700'}`}>
                                {student.avatar_url ? (
                                    <img src={student.avatar_url} alt={student.name} className="w-full h-full rounded-2xl object-cover" />
                                ) : (
                                    (student.name || 'S').charAt(0)
                                )}
                                {isCurrentKetua && (
                                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                                        <Crown className="w-4 h-4 text-white" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    {student.name}
                                    {isCurrentKetua && (
                                        <span className="text-xs bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-medium">
                                            Ketua Kelas
                                        </span>
                                    )}
                                </h2>
                                <p className="text-indigo-100">NIS: {student.nis}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Parent Info */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-indigo-500" />
                                    Informasi Orang Tua
                                </h3>
                                <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => {
                                        onClose();
                                        onAssignWali(student);
                                    }}
                                >
                                    <Edit2 className="w-3 h-3 mr-1" />
                                    Atur Wali
                                </Button>
                            </div>

                            {student.parents && student.parents.length > 0 ? (
                                <div className="space-y-2">
                                    {student.parents.map((parent, idx) => (
                                        <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-gray-900">{parent.name}</div>
                                                <div className="text-xs text-gray-500">{parent.hubungan}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-gray-600">{parent.phone || '-'}</div>
                                                {parent.phone && (
                                                    <a
                                                        href={`https://wa.me/${parent.phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-xs text-green-600 hover:underline flex items-center gap-1 justify-end"
                                                    >
                                                        <Phone className="w-3 h-3" /> WhatsApp
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <p className="text-sm text-gray-500 mb-2">Belum ada data wali murid</p>
                                    <Button size="sm" variant="ghost" className="text-indigo-600" onClick={() => { onClose(); onAssignWali(student); }}>
                                        + Tambahkan Wali Murid
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Personal Info */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <User className="w-4 h-4 text-indigo-500" />
                                Informasi Pribadi
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Jenis Kelamin</span>
                                    <p className="font-medium">{student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Tanggal Lahir</span>
                                    <p className="font-medium">
                                        {student.birth_date
                                            ? new Date(student.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                            : '-'}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-gray-500">Alamat</span>
                                    <p className="font-medium">{student.address || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Attendance Summary */}
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-indigo-500" />
                                Rekap Kehadiran
                            </h3>
                            <div className="grid grid-cols-4 gap-3">
                                <div className="bg-green-50 rounded-xl p-3 text-center">
                                    <div className="text-2xl font-bold text-green-600">{student.attendance_summary?.hadir || 0}</div>
                                    <div className="text-xs text-green-600">Hadir</div>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-3 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{student.attendance_summary?.sakit || 0}</div>
                                    <div className="text-xs text-blue-600">Sakit</div>
                                </div>
                                <div className="bg-yellow-50 rounded-xl p-3 text-center">
                                    <div className="text-2xl font-bold text-yellow-600">{student.attendance_summary?.izin || 0}</div>
                                    <div className="text-xs text-yellow-600">Izin</div>
                                </div>
                                <div className="bg-red-50 rounded-xl p-3 text-center">
                                    <div className="text-2xl font-bold text-red-600">{student.attendance_summary?.alpha || 0}</div>
                                    <div className="text-xs text-red-600">Alpha</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 pt-0 flex gap-3">
                        {!isCurrentKetua && (
                            <Button
                                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                onClick={() => {
                                    onClose();
                                    onAssignKetua(student);
                                }}
                            >
                                <Crown className="w-4 h-4 mr-2" />
                                Jadikan Ketua
                            </Button>
                        )}
                        <Button variant="outline" className="flex-1" onClick={onClose}>
                            Tutup
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default StudentDetailModal;
