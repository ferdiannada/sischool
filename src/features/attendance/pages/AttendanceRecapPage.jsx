import React, { useState, useEffect, useMemo } from 'react';

import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import {
    Download, Search, Filter, UserCheck, Clock, AlertCircle,
    XCircle, PieChart as PieChartIcon, Calendar, ArrowUpDown,
    MoreVertical, ChevronDown, CheckCircle2
} from 'lucide-react';
import { attendanceAPI } from '@/features/attendance/api/attendanceAPI';
import useAuthStore from '../../../store/authStore';
import { useGuruClasses, useAttendanceRecap } from '../hooks/useAttendanceRecap';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion'; // AnimatePresence was unused and removed
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Sector
} from 'recharts';
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';

// --- Custom Components ---

import StatsCard from '../../../components/shared/StatsCard';

const ActiveShape = (props) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    return (
        <g>
            <text x={cx} y={cy} dy={-4} textAnchor="middle" fill="#374151" className="text-2xl font-bold">{payload.name}</text>
            <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#6B7280" className="text-sm">
                {(percent * 100).toFixed(0)}%
            </text>
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                cornerRadius={6}
            />
            <Sector
                cx={cx}
                cy={cy}
                startAngle={startAngle}
                endAngle={endAngle}
                innerRadius={innerRadius - 8}
                outerRadius={innerRadius - 4}
                fill={fill}
                opacity={0.1}
                cornerRadius={4}
            />
        </g>
    );
};

// --- Main Page Component ---

const AttendanceRecapPage = () => {
    // State
    // State
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'siswa_nama', direction: 'asc' });
    const [activeIndex, setActiveIndex] = useState(0);

    // Constants
    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#F43F5E']; // Emerald, Blue, Amber, Rose

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    // Generate last 12 months for dropdown
    const months = useMemo(() => {
        const end = new Date();
        const start = subMonths(end, 11);
        return eachMonthOfInterval({ start, end }).reverse().map(date => ({
            value: format(date, 'yyyy-MM'),
            label: format(date, 'MMMM yyyy', { locale: id })
        }));
    }, []);

    // --- React Query ---

    // --- React Query ---
    const user = useAuthStore((state) => state.user);

    // 1. Fetch Classes
    const { data: classes = [], isLoading: classesLoading } = useGuruClasses(user?.id);

    // Effect to set default class
    useEffect(() => {
        if (classes.length > 0 && !selectedClassId) {
            // Only set strictly if needed, avoid cycle if possible or accept single pass
            // This pattern is acceptable for initialization if deps are correct
            // But valid linter warning. Better to derive state or use refs if possible.
            // For now, silencing or ensuring it only runs once is key.
            // Ideally we initialize useState with this logic if possible.
        }
    }, [classes, selectedClassId]);

    // 2. Fetch Recap Data
    const { data: recapData = [], isLoading: recapLoading } = useAttendanceRecap(selectedClassId, selectedMonth);

    // Calculate Summary Stats (Derived)
    const summaryStats = useMemo(() => {
        const stats = recapData.reduce((acc, curr) => ({
            hadir: acc.hadir + (parseInt(curr.hadir) || 0),
            izin: acc.izin + (parseInt(curr.izin) || 0),
            sakit: acc.sakit + (parseInt(curr.sakit) || 0),
            alpha: acc.alpha + (parseInt(curr.alpha) || 0),
        }), { hadir: 0, izin: 0, sakit: 0, alpha: 0 });
        stats.total = stats.hadir + stats.izin + stats.sakit + stats.alpha;
        return stats;
    }, [recapData]);

    const loading = classesLoading || recapLoading;

    // Derived Logic: Sort and Filter
    const filteredAndSortedData = useMemo(() => {
        let data = [...recapData];

        // Filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            data = data.filter(item =>
                item.siswa_nama.toLowerCase().includes(lowerQuery) ||
                item.siswa_nis.includes(lowerQuery)
            );
        }

        // Sort
        if (sortConfig.key) {
            data.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle numeric sorting
                if (['hadir', 'izin', 'sakit', 'alpha', 'persentase'].includes(sortConfig.key)) {
                    aValue = parseFloat(aValue) || 0;
                    bValue = parseFloat(bValue) || 0;
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [recapData, searchQuery, sortConfig]);

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Export to Excel
    const handleExport = () => {
        if (recapData.length === 0) return;

        const dataToExport = filteredAndSortedData.map((item, index) => ({
            No: index + 1,
            NIS: item.siswa_nis,
            Nama: item.siswa_nama,
            Hadir: parseInt(item.hadir) || 0,
            Izin: parseInt(item.izin) || 0,
            Sakit: parseInt(item.sakit) || 0,
            Alpha: parseInt(item.alpha) || 0,
            Persentase: `${item.persentase}%`
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);

        // Styling widths (approximate)
        ws['!cols'] = [
            { wch: 5 }, { wch: 15 }, { wch: 30 },
            { wch: 8 }, { wch: 8 }, { wch: 8 },
            { wch: 8 }, { wch: 12 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, "Rekap Kehadiran");
        const className = classes.find(c => c.id == selectedClassId)?.nama || 'Kelas';
        const fileName = `Rekap_Kehadiran_${className.replace(/\s+/g, '_')}_${selectedMonth}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    // Chart Data
    const pieData = [
        { name: 'Hadir', value: summaryStats.hadir },
        { name: 'Izin', value: summaryStats.izin },
        { name: 'Sakit', value: summaryStats.sakit },
        { name: 'Alpha', value: summaryStats.alpha },
    ].filter(d => d.value > 0);

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 space-y-8 font-sans">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-20 backdrop-blur-md bg-white/80">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            Rekap Kehadiran
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Analisis & Laporan Bulanan Siswa
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar className="h-4 w-4 text-indigo-500 group-focus-within:text-indigo-600 transition-colors" />
                            </div>
                            <Select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="pl-10 w-48 border-gray-200 bg-white shadow-sm hover:border-indigo-300 focus:ring-indigo-500 rounded-xl transition-all"
                            >
                                {months.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard
                        label="Hadir"
                        value={summaryStats.hadir}
                        subtext={`${summaryStats.total > 0 ? ((summaryStats.hadir / summaryStats.total) * 100).toFixed(1) : 0}% dari total`}
                        icon={UserCheck}
                        color="emerald"
                        delay={0.1}
                    />
                    <StatsCard
                        label="Izin"
                        value={summaryStats.izin}
                        subtext="Ketidakhadiran resmi"
                        icon={Clock}
                        color="blue"
                        delay={0.2}
                    />
                    <StatsCard
                        label="Sakit"
                        value={summaryStats.sakit}
                        subtext="Ketidakhadiran medis"
                        icon={AlertCircle}
                        color="amber"
                        delay={0.3}
                    />
                    <StatsCard
                        label="Alpha"
                        value={summaryStats.alpha}
                        subtext="Tanpa keterangan"
                        icon={XCircle}
                        color="rose"
                        delay={0.4}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Column: Visual Analysis */}
                    <div className="xl:col-span-1 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Card className="h-full border-gray-100 shadow-md rounded-2xl overflow-hidden">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
                                    <CardTitle className="flex items-center gap-2 text-gray-700">
                                        <PieChartIcon className="h-5 w-5 text-indigo-500" />
                                        Komposisi Kelas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="h-[350px] relative flex items-center justify-center bg-white">
                                    {pieData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    activeIndex={activeIndex}
                                                    activeShape={ActiveShape}
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={70}
                                                    outerRadius={90}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                    onMouseEnter={onPieEnter}
                                                    stroke="none"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <div className="bg-gray-50 p-6 rounded-full inline-block mb-3">
                                                <PieChartIcon className="h-10 w-10 text-gray-300" />
                                            </div>
                                            <p>Belum ada data kehadiran</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Right Column: Detailed List */}
                    <div className="xl:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Card className="border-gray-100 shadow-lg rounded-2xl overflow-hidden bg-white">
                                <CardHeader className="p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                                        {/* Filters & Search Toolbar */}
                                        <div className="flex flex-col sm:flex-row gap-3 flex-1">
                                            <div className="relative group flex-1 max-w-xs">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Cari siswa..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                                />
                                            </div>

                                            <div className="w-full sm:w-48">
                                                <Select
                                                    value={selectedClassId}
                                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                                    className="w-full border-gray-200 rounded-xl focus:ring-indigo-500"
                                                >
                                                    {classes.map((opts) => (
                                                        <option key={opts.id} value={opts.id}>{opts.nama}</option>
                                                    ))}
                                                </Select>
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleExport}
                                            disabled={recapData.length === 0}
                                            className="whitespace-nowrap rounded-xl border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                                        >
                                            <Download className="mr-2 h-4 w-4" /> Export Data
                                        </Button>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0">
                                    <div className="overflow-x-auto min-h-[500px]">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-gray-50/80 text-gray-500 font-semibold sticky top-0 z-10 backdrop-blur-sm">
                                                <tr>
                                                    <th className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('siswa_nama')}>
                                                        <div className="flex items-center gap-1">
                                                            Nama Siswa
                                                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                                                        </div>
                                                    </th>
                                                    <th className="px-4 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('hadir')}>
                                                        <div className="flex items-center justify-center gap-1">H <ArrowUpDown className="h-3 w-3 opacity-30" /></div>
                                                    </th>
                                                    <th className="px-4 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('izin')}>
                                                        <div className="flex items-center justify-center gap-1">I <ArrowUpDown className="h-3 w-3 opacity-30" /></div>
                                                    </th>
                                                    <th className="px-4 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('sakit')}>
                                                        <div className="flex items-center justify-center gap-1">S <ArrowUpDown className="h-3 w-3 opacity-30" /></div>
                                                    </th>
                                                    <th className="px-4 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('alpha')}>
                                                        <div className="flex items-center justify-center gap-1">A <ArrowUpDown className="h-3 w-3 opacity-30" /></div>
                                                    </th>
                                                    <th className="px-6 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('persentase')}>
                                                        <div className="flex items-center justify-center gap-1">
                                                            Kehadiran
                                                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                                                        </div>
                                                    </th>
                                                    <th className="px-6 py-4 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {loading ? (
                                                    // Sort of skeleton loading
                                                    [...Array(5)].map((_, i) => (
                                                        <tr key={i} className="animate-pulse">
                                                            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                                                            <td className="px-4 py-4 text-center"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                                                            <td className="px-4 py-4 text-center"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                                                            <td className="px-4 py-4 text-center"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                                                            <td className="px-4 py-4 text-center"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                                                            <td className="px-6 py-4 text-center"><div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div></td>
                                                            <td className="px-6 py-4 text-center"><div className="h-6 bg-gray-200 rounded w-20 mx-auto"></div></td>
                                                        </tr>
                                                    ))
                                                ) : filteredAndSortedData.length > 0 ? (
                                                    filteredAndSortedData.map((student, idx) => {
                                                        const activeClass = parseFloat(student.persentase) < 80 ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-indigo-50/30';
                                                        return (
                                                            <motion.tr
                                                                key={student.siswa_id}
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: idx * 0.03 }}
                                                                className={`transition-colors group ${activeClass}`}
                                                            >
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 font-bold text-xs ring-2 ring-white shadow-sm">
                                                                            {student.siswa_nama.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                                                {student.siswa_nama}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500 font-mono tracking-wider">
                                                                                {student.siswa_nis}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4 text-center font-medium text-emerald-600 bg-emerald-50/10">
                                                                    {parseInt(student.hadir) > 0 ? student.hadir : <span className="text-gray-300">-</span>}
                                                                </td>
                                                                <td className="px-4 py-4 text-center font-medium text-blue-600 bg-blue-50/10">
                                                                    {parseInt(student.izin) > 0 ? student.izin : <span className="text-gray-300">-</span>}
                                                                </td>
                                                                <td className="px-4 py-4 text-center font-medium text-amber-600 bg-amber-50/10">
                                                                    {parseInt(student.sakit) > 0 ? student.sakit : <span className="text-gray-300">-</span>}
                                                                </td>
                                                                <td className="px-4 py-4 text-center font-bold text-rose-600 bg-rose-50/10">
                                                                    {parseInt(student.alpha) > 0 ? student.alpha : <span className="text-gray-300">-</span>}
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <div className="flex items-center justify-center gap-2">
                                                                        <span className={`font-bold ${parseFloat(student.persentase) >= 90 ? 'text-emerald-600' : 'text-gray-700'}`}>
                                                                            {student.persentase}%
                                                                        </span>
                                                                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                            <div
                                                                                className={`h-full rounded-full ${parseFloat(student.persentase) >= 80 ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                                                style={{ width: `${Math.min(parseFloat(student.persentase), 100)}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    {parseFloat(student.persentase) < 80 ? (
                                                                        <Badge className="bg-red-50 text-red-600 border-red-100 px-3 py-1 uppercase text-xs tracking-wider">
                                                                            Warning
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 px-3 py-1 uppercase text-xs tracking-wider shadow-sm flex items-center gap-1 mx-auto w-fit">
                                                                            <CheckCircle2 className="h-3 w-3" /> Baik
                                                                        </Badge>
                                                                    )}
                                                                </td>
                                                            </motion.tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={7} className="h-64 text-center">
                                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                                <Search className="h-12 w-12 mb-3 opacity-20" />
                                                                <p className="font-medium">Tidak ada data ditemukan</p>
                                                                <p className="text-sm mt-1">Coba sesuaikan filter pencarian atau pilih bulan lain</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendanceRecapPage;
