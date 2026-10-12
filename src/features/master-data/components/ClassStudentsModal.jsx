import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Search, Users, GraduationCap, Loader2, UserCircle } from 'lucide-react';
import { masterDataAPI } from '../api/masterDataAPI';
import { motion, AnimatePresence } from 'framer-motion';

const ClassStudentsModal = ({ isOpen, onClose, kelasData }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen && kelasData?.id) {
            fetchStudents();
        }
        if (!isOpen) {
            setStudents([]);
            setSearchTerm('');
        }
    }, [isOpen, kelasData?.id]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const data = await masterDataAPI.getStudentsByClass(kelasData.id);
            setStudents(data);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nisn.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const maleCount = students.filter(s => s.jenisKelaminShort === 'L').length;
    const femaleCount = students.filter(s => s.jenisKelaminShort === 'P').length;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Daftar Siswa — ${kelasData?.nama || ''}`}
            description={`${kelasData?.waliKelas && kelasData.waliKelas !== '-' ? `Wali Kelas: ${kelasData.waliKelas}` : 'Wali Kelas belum diset'}`}
            size="xl"
            footer={
                <Button variant="ghost" onClick={onClose}>Tutup</Button>
            }
        >
            <div className="space-y-4">
                {/* Stats Bar */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                        <Users className="w-4 h-4" />
                        Total: {students.length}
                    </div>
                    <div className="flex items-center gap-2 bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                        L: {maleCount}
                    </div>
                    <div className="flex items-center gap-2 bg-pink-50 text-pink-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                        P: {femaleCount}
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Cari nama, NIS, atau NISN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-xl"
                    />
                </div>

                {/* Student List */}
                <div className="max-h-[400px] overflow-y-auto rounded-xl border border-gray-100">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <span className="text-sm">Memuat data siswa...</span>
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <GraduationCap className="w-12 h-12 mb-3 text-gray-300" />
                            <p className="text-sm font-medium">
                                {searchTerm ? 'Siswa tidak ditemukan' : 'Belum ada siswa di kelas ini'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="text-left px-4 py-2.5 text-gray-500 font-semibold w-12">No</th>
                                    <th className="text-left px-4 py-2.5 text-gray-500 font-semibold">Nama Siswa</th>
                                    <th className="text-left px-4 py-2.5 text-gray-500 font-semibold">NIS</th>
                                    <th className="text-left px-4 py-2.5 text-gray-500 font-semibold">NISN</th>
                                    <th className="text-center px-4 py-2.5 text-gray-500 font-semibold">L/P</th>
                                    <th className="text-center px-4 py-2.5 text-gray-500 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filteredStudents.map((student, index) => (
                                        <motion.tr
                                            key={student.id}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            transition={{ delay: index * 0.02 }}
                                            className="border-b border-gray-50 last:border-none hover:bg-emerald-50/30 transition-colors"
                                        >
                                            <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{index + 1}</td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {student.nama.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-gray-900 truncate">{student.nama}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{student.nis}</td>
                                            <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{student.nisn}</td>
                                            <td className="px-4 py-2.5 text-center">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${student.jenisKelaminShort === 'L'
                                                        ? 'bg-sky-100 text-sky-700'
                                                        : student.jenisKelaminShort === 'P'
                                                            ? 'bg-pink-100 text-pink-700'
                                                            : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                    {student.jenisKelaminShort}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <Badge
                                                    variant={student.status === 'aktif' ? 'success' : 'secondary'}
                                                    className={student.status === 'aktif'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 text-xs'
                                                        : 'text-xs'
                                                    }
                                                >
                                                    {student.status === 'aktif' ? 'Aktif' : student.status}
                                                </Badge>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default ClassStudentsModal;
