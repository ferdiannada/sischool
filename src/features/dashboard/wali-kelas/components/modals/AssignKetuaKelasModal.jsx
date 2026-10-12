import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../../../../../components/ui/Button';

const AssignKetuaKelasModal = ({ student, currentKetua, onConfirm, onClose, loading }) => {
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
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Crown className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Jadikan Ketua Kelas</h2>
                                <p className="text-amber-100 text-sm">Konfirmasi penunjukan</p>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold
                                ${student.gender === 'L' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                                {(student.name || 'S').charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">{student.name}</div>
                                <div className="text-sm text-gray-500">NIS: {student.nis}</div>
                            </div>
                        </div>

                        <p className="text-gray-600">
                            Anda akan menunjuk <strong>{student.name}</strong> sebagai Ketua Kelas.
                            Siswa ini akan mendapatkan akses untuk input absensi kelas.
                        </p>

                        {currentKetua && currentKetua.user_id !== student.user_id && (
                            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-yellow-800">Ketua Kelas Saat Ini</p>
                                    <p className="text-yellow-700">
                                        <strong>{currentKetua.name}</strong> akan kehilangan role Ketua Kelas.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-6 pt-0 flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Batal
                        </Button>
                        <Button
                            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                            onClick={onConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                <>
                                    <Crown className="w-4 h-4 mr-2" />
                                    Konfirmasi
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AssignKetuaKelasModal;
