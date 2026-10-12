import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, ChevronRight, User, ArrowRight, Crown, Sparkles } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import useAuthStore from '../../../store/authStore';
import { motion } from 'framer-motion';

export const WelcomeBanner = ({ studentName, kelasName, className, quote = "Semangat belajar dan raih mimpimu hari ini!" }) => {
    const navigate = useNavigate();
    const activeRole = useAuthStore((state) => state.activeRole);
    const getAllRoles = useAuthStore((state) => state.getAllRoles);
    const switchRole = useAuthStore((state) => state.switchRole);

    const roles = getAllRoles();
    const isKetuaKelas = roles.includes('ketua_kelas');
    const isCurrentlyKetua = activeRole === 'ketua_kelas';

    const handleSwitchToKetuaKelas = () => {
        switchRole('ketua_kelas');
        navigate('/ketua-kelas/dashboard');
    };

    const handleSwitchToSiswa = () => {
        switchRole('siswa');
        navigate('/siswa/dashboard');
    };

    return (
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1a1f3c] via-[#2d2b55] to-[#1a1f3c] text-white shadow-2xl shadow-indigo-900/20 ${className}`}>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 h-96 w-96 rounded-full bg-gradient-to-b from-indigo-500/20 to-purple-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-80 w-80 rounded-full bg-gradient-to-t from-blue-500/20 to-teal-500/20 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-[url('/grid-pattern.svg')] opacity-[0.03]" />

            <div className="relative p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4 max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-emerald-300 shadow-inner"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Selamat Datang</span>
                        </motion.div>

                        <div>
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2 leading-tight"
                            >
                                Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-200">{studentName}</span>! 👋
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-gray-300 text-base/relaxed max-w-lg"
                            >
                                {quote}
                            </motion.p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[240px]">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="px-5 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-between group cursor-default transition-all hover:bg-white/10"
                        >
                            <div className="flex flex-col">
                                <span className="text-gray-400 text-[10px] uppercase tracking-wider font-semibold mb-0.5">Kelas</span>
                                <span className="text-white font-medium text-base">{kelasName || 'Belum ada kelas'}</span>
                            </div>
                            <Calendar className="w-6 h-6 text-indigo-300 group-hover:text-white transition-colors" />
                        </motion.div>

                        {isKetuaKelas && !isCurrentlyKetua && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSwitchToKetuaKelas}
                                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-gray-900 font-bold hover:from-amber-300 hover:to-orange-300 transition-all flex items-center justify-between gap-2 shadow-xl shadow-amber-500/20 group"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] uppercase tracking-wider text-amber-900/60 font-semibold mb-0.5">Mode</span>
                                    <span className="text-sm flex items-center gap-1.5">
                                        <Crown className="w-4 h-4" />
                                        Ketua Kelas
                                    </span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-amber-200/50 flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                                    <ArrowRight className="w-4 h-4 text-amber-900" />
                                </div>
                            </motion.button>
                        )}

                        {isCurrentlyKetua && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSwitchToSiswa}
                                className="px-5 py-3 rounded-2xl bg-white text-[#1a1f3c] font-bold hover:bg-blue-50 transition-all flex items-center justify-between gap-2 shadow-xl shadow-black/10 group"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] uppercase tracking-wider text-indigo-900/60 font-semibold mb-0.5">Mode</span>
                                    <span className="text-sm flex items-center gap-1.5">
                                        <User className="w-4 h-4" />
                                        Siswa
                                    </span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-indigo-100/50 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                                    <ArrowRight className="w-4 h-4 text-indigo-900" />
                                </div>
                            </motion.button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

import StatsCard from '../../../components/shared/StatsCard';

export { StatsCard as StatCard };

export const NextClassCard = ({ schedule, status = 'ongoing' }) => {
    if (!schedule) return null;

    const isOngoing = status === 'ongoing';
    const badgeText = isOngoing ? 'Sedang Berlangsung' : 'Akan Datang';
    const badgeColor = isOngoing
        ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30 hover:bg-indigo-500/30'
        : 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30 hover:bg-emerald-500/30';

    return (
        <div className={`bg-gradient-to-br ${isOngoing ? 'from-gray-900 to-gray-800' : 'from-slate-800 to-slate-700'} rounded-2xl p-6 text-white shadow-xl relative overflow-hidden group`}>
            {/* Decorative elements */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${isOngoing ? 'bg-indigo-500' : 'bg-emerald-500'} rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity`}></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <Badge className={badgeColor}>
                        {badgeText}
                    </Badge>
                    <div className="bg-white/10 p-2 rounded-full backdrop-blur-sm">
                        <Clock className={`w-5 h-5 ${isOngoing ? 'text-indigo-300 animate-pulse' : 'text-emerald-300'}`} />
                    </div>
                </div>

                <h3 className="text-2xl font-bold mb-1">{schedule.subject}</h3>
                <p className="text-gray-400 mb-6 flex items-center gap-2">
                    <User className="w-4 h-4" /> {schedule.teacher}
                </p>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-md">
                        <p className="text-gray-400 text-xs mb-1">Waktu</p>
                        <p className={`font-semibold ${isOngoing ? 'text-indigo-300' : 'text-emerald-300'}`}>{schedule.time}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10 backdrop-blur-md">
                        <p className="text-gray-400 text-xs mb-1">Ruangan</p>
                        <p className={`font-semibold ${isOngoing ? 'text-indigo-300' : 'text-emerald-300'}`}>{schedule.room || '-'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TimelineItem = ({ schedule, isLast }) => {
    const getStatusBadge = (status) => {
        switch (status) {
            case 'ongoing':
                return <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Sedang Berlangsung</Badge>;
            case 'completed':
                return <Badge className="bg-gray-100 text-gray-500 border-gray-200">Selesai</Badge>;
            default:
                return <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">Akan Datang</Badge>;
        }
    };

    return (
        <div className="relative pl-8 pb-8 last:pb-0 group">
            {/* Line */}
            {!isLast && (
                <div className="absolute left-[11px] top-4 bottom-0 w-[2px] bg-gray-100 group-hover:bg-indigo-50 transition-colors"></div>
            )}

            {/* Dot */}
            <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${schedule.realStatus === 'ongoing' ? 'border-indigo-500 bg-indigo-50' :
                schedule.realStatus === 'completed' ? 'border-gray-200 bg-gray-50' : 'border-emerald-200 bg-white'
                }`}>
                <div className={`w-2 h-2 rounded-full transition-opacity ${schedule.realStatus === 'ongoing' ? 'bg-indigo-500' :
                    schedule.realStatus === 'completed' ? 'bg-gray-300' : 'bg-emerald-400 opacity-0 group-hover:opacity-100'
                    }`}></div>
            </div>

            {/* Content */}
            <div className={`flex justify-between items-start p-3 rounded-lg transition-colors border border-transparent ${schedule.realStatus === 'ongoing' ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-gray-50 hover:border-gray-100'
                }`}>
                <div>
                    <h4 className={`font-semibold ${schedule.realStatus === 'completed' ? 'text-gray-500' : 'text-gray-900'}`}>{schedule.subject}</h4>
                    <p className="text-sm text-gray-500">{schedule.teacher}</p>
                    <div className="mt-1">
                        {getStatusBadge(schedule.realStatus)}
                    </div>
                </div>
                <div className="text-right">
                    <span className={`block font-medium text-sm ${schedule.realStatus === 'completed' ? 'text-gray-400' : 'text-gray-900'}`}>{schedule.time}</span>
                    <span className="text-xs text-gray-400">{schedule.room ? `R. ${schedule.room}` : '-'}</span>
                </div>
            </div>
        </div>
    );
};
