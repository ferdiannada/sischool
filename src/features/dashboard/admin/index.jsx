import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users, GraduationCap, School, UserCheck,
    Plus, Calendar, FileText, Clock,
    MoreVertical, Loader2, ArrowUpRight, ArrowRight
} from 'lucide-react';
import GlassCard from '../../../components/ui/GlassCard';
import AnimatedStat from '../../../components/ui/AnimatedStat';
import { Button } from '../../../components/ui/Button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAdminDashboard } from './hooks/useAdminDashboard';

/**
 * Admin Dashboard
 * Redesigned with Glassmorphism and modern UI principles
 */
const AdminDashboard = () => {
    const navigate = useNavigate();
    const { loading, stats, chartData, greeting } = useAdminDashboard();

    const statsConfig = [
        {
            label: 'Total Siswa',
            value: stats.totalSiswa,
            icon: GraduationCap,
            color: 'from-blue-500 to-cyan-400',
            iconColor: 'text-blue-50',
            bgIcon: 'bg-gradient-to-br from-blue-500 to-cyan-400'
        },
        {
            label: 'Total Guru',
            value: stats.totalGuru,
            icon: Users,
            color: 'from-purple-500 to-pink-400',
            iconColor: 'text-purple-50',
            bgIcon: 'bg-gradient-to-br from-purple-500 to-pink-400'
        },
        {
            label: 'Kehadiran Hari Ini',
            value: stats.attendanceRate,
            suffix: '%',
            icon: UserCheck,
            color: 'from-green-500 to-emerald-400',
            iconColor: 'text-green-50',
            bgIcon: 'bg-gradient-to-br from-green-500 to-emerald-400'
        },
        {
            label: 'Kelas Aktif',
            value: stats.totalKelas,
            icon: School,
            color: 'from-orange-500 to-amber-400',
            iconColor: 'text-orange-50',
            bgIcon: 'bg-gradient-to-br from-orange-500 to-amber-400'
        },
    ];

    const quickActions = [
        {
            label: 'Tambah Siswa',
            icon: Plus,
            color: 'text-blue-600',
            bg: 'bg-blue-50 hover:bg-blue-100',
            border: 'border-blue-200',
            action: () => navigate('/admin/users/siswa')
        },
        {
            label: 'Buat Jadwal',
            icon: Calendar,
            color: 'text-purple-600',
            bg: 'bg-purple-50 hover:bg-purple-100',
            border: 'border-purple-200',
            action: () => navigate('/admin/schedule')
        },
        {
            label: 'Laporan Absensi',
            icon: FileText,
            color: 'text-green-600',
            bg: 'bg-green-50 hover:bg-green-100',
            border: 'border-green-200',
            action: () => navigate('/admin/reports')
        },
    ];

    const recentActivities = [
        { id: 1, user: 'System', action: 'Dashboard loaded with live data', time: 'Baru saja', type: 'success' },
        { id: 2, user: 'Database', action: 'Connected to PostgreSQL', time: 'Baru saja', type: 'info' },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50/50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
                    <span className="text-gray-500 font-medium">Memuat dashboard admin...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-1 animate-fade-in">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                        {greeting}, Admin!
                    </h2>
                    <p className="text-gray-500 mt-1">
                        Berikut adalah ringkasan aktivitas sekolah hari ini.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-white/50 px-3 py-1.5 rounded-full border border-gray-200 backdrop-blur-sm">
                    <Clock className="w-4 h-4" />
                    <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statsConfig.map((stat, index) => (
                    <GlassCard key={index} className="relative overflow-hidden group">
                        <div className="p-6 relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-xl ${stat.bgIcon} shadow-lg shadow-gray-200/50 group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                                </div>
                                <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-xs font-medium border border-green-100">
                                    <ArrowUpRight className="w-3 h-3" />
                                    <span>+2.5%</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-1">
                                    <AnimatedStat value={stat.value} />
                                    {stat.suffix && <span className="text-xl text-gray-400 ml-1">{stat.suffix}</span>}
                                </h3>
                            </div>
                        </div>
                        {/* Decorative background element */}
                        <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10 bg-gradient-to-br ${stat.color} blur-2xl group-hover:opacity-20 transition-opacity duration-300`} />
                    </GlassCard>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Chart Area */}
                <GlassCard className="lg:col-span-2 p-6 flex flex-col h-[450px]">
                    <div className="flex flex-row items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Statistik Kehadiran</h3>
                            <p className="text-sm text-gray-500">Overview kehadiran mingguan siswa</p>
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-gray-100">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                        </Button>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorIzin" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        cursor={{ stroke: '#E5E7EB', strokeWidth: 2 }}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            padding: '12px'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="hadir"
                                        stroke="#22C55E"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorHadir)"
                                        name="Hadir"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="izin"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorIzin)"
                                        name="Izin"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <FileText className="w-12 h-12 mb-3 opacity-20" />
                                <p>Belum ada data kehadiran minggu ini</p>
                            </div>
                        )}
                    </div>
                </GlassCard>

                {/* Right Column: Actions & Feed */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <GlassCard className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Aksi Cepat</h3>
                        <div className="space-y-3">
                            {quickActions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={action.action}
                                    className={`w-full flex items-center p-3 rounded-xl border transition-all duration-200 group hover:shadow-md ${action.bg} ${action.border}`}
                                >
                                    <div className={`p-2 rounded-lg bg-white ${action.color} mr-3 shadow-sm group-hover:scale-110 transition-transform`}>
                                        <action.icon className="w-5 h-5" />
                                    </div>
                                    <span className={`font-medium ${action.color} opacity-90`}>{action.label}</span>
                                    <ArrowRight className={`ml-auto w-4 h-4 ${action.color} opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all`} />
                                </button>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Recent Activity */}
                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-purple-500" />
                                <h3 className="text-lg font-bold text-gray-900">Aktivitas</h3>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 bg-purple-50 text-purple-600 rounded-full">Live</span>
                        </div>
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                    <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                        <div className={`w-2 h-2 rounded-full ${activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'} animate-pulse`} />
                                    </div>

                                    <div className="w-full ml-4">
                                        <div className="bg-white/60 p-3 rounded-xl border border-gray-100 shadow-sm">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-bold text-gray-800 text-sm">{activity.user}</span>
                                                <time className="font-mono text-[10px] text-gray-400">{activity.time}</time>
                                            </div>
                                            <div className="text-gray-600 text-xs">{activity.action}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
