import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Search, Loader2, Crown, Filter, User } from 'lucide-react';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';
import useAuthStore from '../../../store/authStore';
import { useClassmates } from '../hooks/useClassmates';
import { motion, AnimatePresence } from 'framer-motion';

const ClassmatesPage = () => {
    const user = useAuthStore((state) => state.user);
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState('all'); // all, L, P

    // TanStack Query Hook
    const { data: classmatesData, isLoading: loading } = useClassmates(user?.id);

    // Derived state
    const students = classmatesData?.classmates || [];
    // eslint-disable-next-line no-unused-vars
    const kelasId = classmatesData?.kelas_id;

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGender = genderFilter === 'all' || s.jenis_kelamin === genderFilter;
        return matchesSearch && matchesGender;
    });

    const stats = {
        total: students.length,
        laki: students.filter(s => s.jenis_kelamin === 'L').length,
        perempuan: students.filter(s => s.jenis_kelamin === 'P').length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Teman Sekelas</h1>
                    <p className="text-gray-500 mt-2">
                        Daftar siswa di kelasmu. Kenali timmu!
                    </p>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
                    <span className="text-xs font-bold uppercase text-gray-400 mb-1">Total</span>
                    <span className="text-3xl font-bold text-gray-900">{stats.total}</span>
                </div>
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center">
                    <span className="text-xs font-bold uppercase text-blue-400 mb-1">Pria</span>
                    <span className="text-3xl font-bold text-blue-700">{stats.laki}</span>
                </div>
                <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100 flex flex-col items-center">
                    <span className="text-xs font-bold uppercase text-pink-400 mb-1">Wanita</span>
                    <span className="text-3xl font-bold text-pink-700">{stats.perempuan}</span>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="sticky top-20 z-10 -mx-4 px-4 py-2 md:static md:mx-0 md:px-0 bg-gray-50/80 backdrop-blur-sm md:bg-transparent">
                <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/50">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama teman..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                        />
                    </div>

                    <div className="flex p-1 bg-gray-50 rounded-xl">
                        {[
                            { id: 'all', label: 'Semua' },
                            { id: 'L', label: 'Laki-laki' },
                            { id: 'P', label: 'Perempuan' }
                        ].map(type => (
                            <button
                                key={type.id}
                                onClick={() => setGenderFilter(type.id)}
                                className={`
                                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                                    ${genderFilter === type.id
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }
                                `}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Student Grid */}
            <motion.div
                layout
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            >
                <AnimatePresence>
                    {filteredStudents.map((student, index) => (
                        <StudentCard key={student.id} student={student} index={index} />
                    ))}
                </AnimatePresence>
            </motion.div>

            {filteredStudents.length === 0 && !loading && (
                <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Tidak ada hasil</h3>
                    <p className="text-gray-500">Coba ubah kata kunci pencarian atau filter.</p>
                </div>
            )}
        </div>
    );
};

const StudentCard = ({ student, index }) => (
    <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ y: -5 }}
        className={`group relative bg-white rounded-2xl p-6 flex flex-col items-center border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300
            ${student.is_ketua_kelas ? 'ring-2 ring-amber-400 bg-amber-50/30' : ''}
        `}
    >
        {student.is_ketua_kelas && (
            <div className="absolute top-4 right-4 text-amber-500">
                <Crown className="w-6 h-6 fill-amber-500 rotate-12" />
            </div>
        )}

        <div className="relative mb-4">
            <div className={`absolute inset-0 rounded-full blur-xl opacity-20 scale-150 ${student.is_ketua_kelas ? 'bg-amber-500' : 'bg-blue-500'}`} />
            <Avatar
                fallback={student.name?.charAt(0) || '?'}
                className={`w-24 h-24 text-2xl border-4 shadow-lg ${student.is_ketua_kelas ? 'border-amber-200' : 'border-white'}`}
            />
        </div>

        <h3 className="text-lg font-bold text-gray-900 text-center leading-tight mb-1 line-clamp-1 w-full">
            {student.name}
        </h3>

        <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 bg-gray-100 text-xs font-semibold text-gray-500 rounded-md">
                {student.nis}
            </span>
            {student.is_ketua_kelas && (
                <span className="px-2 py-0.5 bg-amber-100 text-xs font-bold text-amber-600 rounded-md">
                    Ketua
                </span>
            )}
        </div>

        <div className="w-full mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {student.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
            </span>
        </div>
    </motion.div>
);

export default ClassmatesPage;
