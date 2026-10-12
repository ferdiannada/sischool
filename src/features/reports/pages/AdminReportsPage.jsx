import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { FileText, Download, BarChart2, PieChart as PieChartIcon, Users, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { toast } from 'react-hot-toast';
import { useAdminReports } from '../hooks/useAdminReports';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

const AdminReportsPage = () => {
    // 1. Local Form State
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });
    const [selectedKelas, setSelectedKelas] = useState('');

    // 2. Query State (Only triggers fetch when this updates)
    const [queryFilters, setQueryFilters] = useState({
        start: dateRange.start,
        end: dateRange.end,
        classId: ''
    });

    // 3. Custom Hook
    const {
        kelasList,
        overallStats,
        classSummary,
        studentSummary,
        isLoading,
        downloadCSV
    } = useAdminReports(queryFilters);

    const handleGenerate = () => {
        if (!dateRange.start || !dateRange.end) {
            toast.error('Pilih tanggal awal dan akhir');
            return;
        }
        setQueryFilters({
            start: dateRange.start,
            end: dateRange.end,
            classId: selectedKelas
        });
        toast.promise(
            // We can't easily promise the hook's loading state, so we just show success
            new Promise(resolve => setTimeout(resolve, 500)),
            {
                loading: 'Generating...',
                success: 'Laporan diperbarui',
                error: 'Gagal'
            }
        );
    };

    const pieData = overallStats ? [
        { name: 'Hadir', value: overallStats.hadir },
        { name: 'Izin', value: overallStats.izin },
        { name: 'Sakit', value: overallStats.sakit },
        { name: 'Alpha', value: overallStats.alpha },
    ] : [];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Laporan & Statistik</h1>
                <p className="text-gray-500">Generate dan download laporan kehadiran sekolah.</p>
            </div>

            {/* Filter / Control Panel */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Konfigurasi Laporan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Filter Kelas</label>
                            <select
                                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                                value={selectedKelas}
                                onChange={(e) => setSelectedKelas(e.target.value)}
                            >
                                <option value="">Semua Kelas</option>
                                {kelasList.map(k => (
                                    <option key={k.id} value={k.id}>{k.nama}</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            type="date"
                            label="Dari Tanggal"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                        <Input
                            type="date"
                            label="Sampai Tanggal"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                        <div className="flex items-end">
                            <Button onClick={handleGenerate} isLoading={isLoading} className="w-full">
                                <BarChart2 className="mr-2 h-4 w-4" /> Generate
                            </Button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        {selectedKelas ? (
                            <Button variant="outline" onClick={() => downloadCSV('student')} disabled={studentSummary.length === 0}>
                                <Download className="mr-2 h-4 w-4" /> Export Data Siswa
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => downloadCSV('class')} disabled={classSummary.length === 0}>
                                <Download className="mr-2 h-4 w-4" /> Export Data Kelas
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Stats Summary */}
            {overallStats && (
                <div className="grid gap-6 md:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90">Total Absensi</p>
                                    <p className="text-3xl font-bold">{overallStats.total}</p>
                                </div>
                                <FileText className="h-10 w-10 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90">Tingkat Kehadiran</p>
                                    <p className="text-3xl font-bold">{overallStats.persentaseHadir}%</p>
                                </div>
                                <PieChartIcon className="h-10 w-10 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90">Izin + Sakit</p>
                                    <p className="text-3xl font-bold">{overallStats.izin + overallStats.sakit}</p>
                                </div>
                                <Users className="h-10 w-10 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-90">Total Alpha</p>
                                    <p className="text-3xl font-bold">{overallStats.alpha}</p>
                                </div>
                                <AlertCircle className="h-10 w-10 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Charts */}
            {overallStats && (
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Distribusi Kehadiran</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Bar Chart - Class Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Kehadiran per Kelas</CardTitle>
                        </CardHeader>
                        <CardContent className="h-80">
                            {classSummary.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={classSummary} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                                        <XAxis type="number" domain={[0, 100]} hide />
                                        <YAxis dataKey="kelasNama" type="category" width={80} tick={{ fill: '#4b5563', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            formatter={(value) => `${value}%`}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="persentaseHadir" fill="#10B981" radius={[0, 4, 4, 0]} barSize={24} name="Kehadiran (%)" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                    Belum ada data
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Student Summary Table */}
            {studentSummary.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Detail Kehadiran Siswa</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>NIS</TableHead>
                                    <TableHead>Nama Siswa</TableHead>
                                    <TableHead className="text-center">Hadir</TableHead>
                                    <TableHead className="text-center">Izin</TableHead>
                                    <TableHead className="text-center">Sakit</TableHead>
                                    <TableHead className="text-center">Alpha</TableHead>
                                    <TableHead className="text-center">Persentase</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {studentSummary.map((s) => (
                                    <TableRow key={s.siswaId}>
                                        <TableCell className="font-mono text-xs">{s.nis}</TableCell>
                                        <TableCell className="font-medium">{s.nama}</TableCell>
                                        <TableCell className="text-center text-green-600 font-semibold">{s.hadir}</TableCell>
                                        <TableCell className="text-center text-blue-600">{s.izin}</TableCell>
                                        <TableCell className="text-center text-yellow-600">{s.sakit}</TableCell>
                                        <TableCell className="text-center text-red-600 font-semibold">{s.alpha}</TableCell>
                                        <TableCell className="text-center font-bold">{s.persentase}%</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={s.persentase >= 80 ? 'success' : s.persentase >= 60 ? 'warning' : 'danger'}>
                                                {s.persentase >= 80 ? 'Baik' : s.persentase >= 60 ? 'Perlu Perhatian' : 'Kritis'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {!overallStats && !isLoading && (
                <Card className="p-12 text-center">
                    <BarChart2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum Ada Laporan</h3>
                    <p className="text-gray-500 mb-4">Pilih rentang tanggal dan klik "Generate" untuk membuat laporan.</p>
                </Card>
            )}
        </div>
    );
};

export default AdminReportsPage;
