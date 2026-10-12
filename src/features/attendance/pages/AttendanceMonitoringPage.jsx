import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    UserCheck,
    AlertTriangle,
    TrendingUp,
    Clock,
    Loader2,
    Phone,
    Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import {
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import useAuthStore from '../../../store/authStore';
import { useAttendanceMonitoring } from '../hooks/useAttendanceMonitoring';

import StatsCard from '../../../components/shared/StatsCard';

// Risk Student Row Component
const RiskStudentRow = ({ student, onContact }) => {
    const riskColors = {
        high: 'bg-red-100 text-red-700 border-red-200',
        medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        low: 'bg-blue-100 text-blue-700 border-blue-200'
    };

    const riskLabels = {
        high: 'Tinggi',
        medium: 'Sedang',
        low: 'Rendah'
    };

    return (
        <TableRow className="hover:bg-gray-50 transition-colors">
            <TableCell>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {student.avatar_url ? (
                            <img src={student.avatar_url} alt={student.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            (student.name || 'S').charAt(0)
                        )}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500">NIS: {student.nis}</div>
                    </div>
                </div>
            </TableCell>
            <TableCell>
                <span className="font-bold text-red-600">{student.total_alpha}</span>
                <span className="text-gray-400 text-sm"> hari</span>
            </TableCell>
            <TableCell className="text-sm text-gray-500">
                {student.last_absent_date
                    ? new Date(student.last_absent_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                    : '-'}
            </TableCell>
            <TableCell>
                <Badge className={`${riskColors[student.risk_level]} border`}>
                    {riskLabels[student.risk_level]}
                </Badge>
            </TableCell>
            <TableCell className="text-right">
                <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => onContact(student)}
                >
                    <Phone className="w-3 h-3 mr-1" />
                    Hubungi Wali
                </Button>
            </TableCell>
        </TableRow>
    );
};

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
                <p className="text-sm font-semibold text-gray-900 mb-1">
                    {new Date(label).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                </p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-sm" style={{ color: entry.color }}>
                        {entry.name}: {entry.value}%
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const AttendanceMonitoringPage = () => {
    const { user } = useAuthStore();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Use Custom Hook with Polling
    const { data, isLoading } = useAttendanceMonitoring({
        userId: user?.id,
        month: selectedMonth,
        year: selectedYear
    });

    const monitoringData = data || {
        kelas: null,
        today_stats: { hadir: 0, sakit: 0, izin: 0, alpha: 0, total: 0, recorded: 0 },
        monthly_trend: [],
        risk_students: [],
        composition: { hadir: 0, sakit: 0, izin: 0, alpha: 0 },
        weekly_comparison: { this_week: 0, last_week: 0 },
        period: { month: selectedMonth, year: selectedYear }
    };

    const handleContactParent = (student) => {
        if (student.parent_phone) {
            window.open(`https://wa.me/${student.parent_phone.replace(/\D/g, '')}`, '_blank');
        } else {
            alert('Nomor telepon orang tua tidak tersedia');
        }
    };

    // Prepare pie chart data
    const pieData = [
        { name: 'Hadir', value: monitoringData.composition?.hadir || 0, color: '#10B981' },
        { name: 'Sakit', value: monitoringData.composition?.sakit || 0, color: '#3B82F6' },
        { name: 'Izin', value: monitoringData.composition?.izin || 0, color: '#F59E0B' },
        { name: 'Alpha', value: monitoringData.composition?.alpha || 0, color: '#EF4444' },
    ].filter(item => item.value > 0);

    // Calculate attendance percentage
    const totalToday = monitoringData.today_stats?.total || 1;
    const hadirToday = monitoringData.today_stats?.hadir || 0;
    const attendancePercentage = Math.round((hadirToday / totalToday) * 100);

    // Calculate weekly trend
    const weeklyTrend = (monitoringData.weekly_comparison?.this_week || 0) - (monitoringData.weekly_comparison?.last_week || 0);

    const months = [
        { value: 1, label: 'Januari' },
        { value: 2, label: 'Februari' },
        { value: 3, label: 'Maret' },
        { value: 4, label: 'April' },
        { value: 5, label: 'Mei' },
        { value: 6, label: 'Juni' },
        { value: 7, label: 'Juli' },
        { value: 8, label: 'Agustus' },
        { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' },
        { value: 11, label: 'November' },
        { value: 12, label: 'Desember' },
    ];

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh]">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-500 animate-pulse">Memuat data monitoring...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 -m-6 p-6 space-y-6 font-sans">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Monitoring Absensi</h1>
                    <p className="text-gray-500">Pantau kehadiran siswa kelas {monitoringData.kelas?.nama || '-'}</p>
                </div>

                {/* Period Selector */}
                <div className="flex gap-3">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    >
                        {months.map(month => (
                            <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    >
                        <option value={2026}>2026</option>
                        <option value={2025}>2025</option>
                    </select>
                </div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatsCard
                    title="Kehadiran Hari Ini"
                    value={`${attendancePercentage}%`}
                    subtext={`${hadirToday} dari ${totalToday} siswa`}
                    icon={UserCheck}
                    color="green"
                    delay={0.1}
                />
                <StatsCard
                    title="Tidak Hadir"
                    value={(monitoringData.today_stats?.sakit || 0) + (monitoringData.today_stats?.izin || 0) + (monitoringData.today_stats?.alpha || 0)}
                    subtext={`${monitoringData.today_stats?.sakit || 0} sakit, ${monitoringData.today_stats?.izin || 0} izin, ${monitoringData.today_stats?.alpha || 0} alpha`}
                    icon={Clock}
                    color="yellow"
                    delay={0.2}
                />
                <StatsCard
                    title="Tanpa Keterangan"
                    value={monitoringData.today_stats?.alpha || 0}
                    subtext="Siswa alpha hari ini"
                    icon={AlertTriangle}
                    color="red"
                    delay={0.3}
                />
                <StatsCard
                    title="Trend Mingguan"
                    value={`${weeklyTrend >= 0 ? '+' : ''}${weeklyTrend.toFixed(1)}%`}
                    subtext={weeklyTrend >= 0 ? 'Meningkat dari minggu lalu' : 'Menurun dari minggu lalu'}
                    icon={TrendingUp}
                    color={weeklyTrend >= 0 ? 'green' : 'red'}
                    delay={0.4}
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Monthly Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="md:col-span-2"
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                                Trend Kehadiran Bulan {months.find(m => m.value === selectedMonth)?.label}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monitoringData.monthly_trend || []}>
                                    <defs>
                                        <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                        tickFormatter={(val) => new Date(val).getDate()}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                        domain={[0, 100]}
                                        tickFormatter={(val) => `${val}%`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="hadir_percentage"
                                        name="Kehadiran"
                                        stroke="#4F46E5"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorAttendance)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                                Komposisi Bulan Ini
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-center h-72">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value, entry) => (
                                                <span className="text-sm text-gray-600">{value}</span>
                                            )}
                                        />
                                        <Tooltip
                                            formatter={(value, name) => [`${value} hari`, name]}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center text-gray-400">
                                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Belum ada data kehadiran</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Risk Students */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Siswa Perlu Perhatian Khusus
                            {monitoringData.risk_students?.length > 0 && (
                                <Badge variant="danger" className="ml-2">{monitoringData.risk_students.length} siswa</Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {monitoringData.risk_students?.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama Siswa</TableHead>
                                        <TableHead>Total Alpha</TableHead>
                                        <TableHead>Terakhir Tidak Hadir</TableHead>
                                        <TableHead>Tingkat Risiko</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {monitoringData.risk_students.map(student => (
                                        <RiskStudentRow
                                            key={student.id}
                                            student={student}
                                            onContact={handleContactParent}
                                        />
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="bg-green-50 p-4 rounded-full mb-4">
                                    <UserCheck className="w-8 h-8 text-green-500" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">Semua Siswa Baik</h3>
                                <p className="text-sm text-gray-500">Tidak ada siswa dengan tingkat alpha tinggi</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Info Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white"
            >
                <div className="flex items-start gap-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-2">Catatan Wali Kelas</h3>
                        <p className="text-indigo-100 text-sm mb-3">
                            Siswa dengan alpha lebih dari 3 kali dalam sebulan memerlukan perhatian khusus.
                            Segera hubungi orang tua/wali untuk koordinasi terkait kehadiran siswa.
                        </p>
                        <div className="flex gap-3">
                            <div className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                                <span className="font-bold">{monitoringData.risk_students?.filter(s => s.risk_level === 'high').length || 0}</span> Risiko Tinggi
                            </div>
                            <div className="bg-white/20 px-3 py-1 rounded-lg text-sm">
                                <span className="font-bold">{monitoringData.risk_students?.filter(s => s.risk_level === 'medium').length || 0}</span> Risiko Sedang
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AttendanceMonitoringPage;
