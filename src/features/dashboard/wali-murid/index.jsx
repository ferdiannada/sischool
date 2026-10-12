import React, { useState } from 'react';
import {
    Calendar, FileText, Clock, Bell, Wallet, ChevronRight, ArrowUpRight, Sun
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ScheduleCard } from '@/components/shared/ScheduleCard';
import { useAuthStore } from '@/store/authStore';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';
import { formatCurrency } from '@/utils/format';
import { useWaliMuridDashboard } from './hooks/useWaliMuridDashboard';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';


/**
 * Wali Murid Dashboard
 * Redesigned for a modern, premium feel with clear actions and insights.
 */
const WaliMuridDashboard = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const { data: dashboardData, isLoading: loading } = useWaliMuridDashboard(user?.id);

    const stats = {
        attendance: dashboardData?.attendance_summary || { hadir: 0, izin: 0, sakit: 0, alpha: 0 },
        billing: {
            count: dashboardData?.billing_summary?.total_pending_invoices || 0,
            amount: dashboardData?.billing_summary?.total_unpaid_amount || 0
        }
    };
    const trendData = dashboardData?.recent_attendance || [];
    const schedules = dashboardData?.todays_schedule || [];

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const totalAttendance = stats.attendance.hadir + stats.attendance.izin + stats.attendance.sakit + stats.attendance.alpha;
    const attendanceRate = totalAttendance > 0
        ? Math.round((stats.attendance.hadir / totalAttendance) * 100)
        : 0;

    return (
        <div className="space-y-8 pb-20">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-purple-700 p-8 text-white shadow-lg">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-primary-100">
                            <Sun className="h-5 w-5 text-yellow-300" />
                            <span className="text-sm font-medium">
                                {format(new Date(), 'EEEE, d MMMM yyyy', { locale: id })}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
                            Selamat Datang, Bapak/Ibu Wali Murid!
                        </h1>
                        <p className="text-primary-100 max-w-lg">
                            Pantau perkembangan pendidikan putra-putri Anda hari ini.
                            {stats.billing.count > 0
                                ? ` Ada ${stats.billing.count} tagihan yang perlu perhatian.`
                                : ` Semua berjalan lancar.`}
                        </p>
                    </div>
                </div>
            </div>



            <h3 className="text-lg font-bold text-gray-900 mb-4 px-2">Statistik Bulan Ini</h3>
            <div className="grid gap-6 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-green-50 to-white border-green-100 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 p-3 opacity-10">
                        <Calendar className="w-24 h-24 text-green-600" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="text-sm font-medium text-green-600 mb-1">Kehadiran</div>
                        <div className="text-3xl font-bold text-gray-900">{attendanceRate}%</div>
                        <div className="text-xs text-gray-500 mt-1">Total {stats.attendance.hadir} hari hadir</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 p-3 opacity-10">
                        <FileText className="w-24 h-24 text-blue-600" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="text-sm font-medium text-blue-600 mb-1">Izin / Sakit</div>
                        <div className="text-3xl font-bold text-gray-900">{stats.attendance.izin + stats.attendance.sakit}</div>
                        <div className="text-xs text-gray-500 mt-1">Hari tidak masuk</div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-white border-red-100 shadow-sm overflow-hidden relative">
                    <div className="absolute right-0 top-0 p-3 opacity-10">
                        <Clock className="w-24 h-24 text-red-600" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="text-sm font-medium text-red-600 mb-1">Alpa / Terlambat</div>
                        <div className="text-3xl font-bold text-gray-900">{stats.attendance.alpha}</div>
                        <div className="text-xs text-gray-500 mt-1">Kali kejadian</div>
                    </CardContent>
                </Card>

                <Card className={`bg-gradient-to-br border shadow-sm overflow-hidden relative ${stats.billing.count > 0 ? 'from-orange-50 to-white border-orange-200' : 'from-gray-50 to-white border-gray-100'}`}>
                    <div className="absolute right-0 top-0 p-3 opacity-10">
                        <Wallet className={`w-24 h-24 ${stats.billing.count > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className={`text-sm font-medium mb-1 ${stats.billing.count > 0 ? 'text-orange-600' : 'text-gray-500'}`}>Tagihan Aktif</div>
                        <div className="text-3xl font-bold text-gray-900">{stats.billing.count}</div>
                        <div className="text-xs text-gray-500 mt-1">{formatCurrency(stats.billing.amount)}</div>
                    </CardContent>
                </Card>
            </div>


            <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-8">
                    {/* Recent Attendance List (Replacing Chart) */}
                    <Card className="shadow-sm border-gray-100 overflow-hidden">
                        <CardHeader className="bg-white border-b border-gray-100">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary-500" /> Riwayat Kehadiran Terakhir
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {trendData && trendData.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {trendData.map((item, index) => (
                                        <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`
                                                    w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold
                                                    ${item.status === 'hadir' ? 'bg-green-100 text-green-600' :
                                                        item.status === 'sakit' ? 'bg-blue-100 text-blue-600' :
                                                            item.status === 'izin' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}
                                                `}>
                                                    {item.status === 'hadir' ? 'H' : item.status === 'sakit' ? 'S' : item.status === 'izin' ? 'I' : 'A'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {format(new Date(item.tanggal), 'EEEE, d MMMM', { locale: id })}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {item.child_name} • {item.mata_pelajaran}
                                                    </p>
                                                    {item.catatan && (
                                                        <p className="text-xs text-gray-400 italic mt-0.5">
                                                            "{item.catatan}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`
                                                    px-2 py-1 rounded-full text-[10px] font-bold uppercase
                                                    ${item.status === 'hadir' ? 'bg-green-50 text-green-700' :
                                                        item.status === 'sakit' ? 'bg-blue-50 text-blue-700' :
                                                            item.status === 'izin' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}
                                                `}>
                                                    {item.status}
                                                </span>
                                                <p className="text-xs text-gray-400 mt-1">{item.waktu}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-3">
                                        <Clock className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500">Belum ada data kehadiran terbaru.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Schedule */}
                    <Card className="shadow-sm border-gray-100">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Jadwal Hari Ini</CardTitle>
                            <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700 hover:bg-primary-50">
                                Lihat Semua <ArrowUpRight className="h-4 w-4 ml-1" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {schedules.length > 0 ? (
                                schedules.map((sch) => (
                                    <ScheduleCard
                                        key={sch.id}
                                        subject={sch.mata_pelajaran}
                                        time={`${sch.jam_mulai} - ${sch.jam_selesai}`}
                                        teacher={sch.teacher_name}
                                        status={sch.status}
                                    />
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Calendar className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500">Tidak ada jadwal pelajaran hari ini.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Notifications & Updates */}
                <div className="space-y-6">
                    <Card className="h-full shadow-sm border-gray-100 bg-gradient-to-b from-white to-gray-50/50">
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Bell className="h-4 w-4 text-primary-500" /> Update Terbaru
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {stats.billing.count > 0 && (
                                <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="h-4 w-4 text-orange-500" />
                                            <p className="text-sm font-bold text-gray-900">Tagihan Pending</p>
                                        </div>
                                        <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold">PENTING</span>
                                    </div>
                                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                                        Terdapat <span className="font-bold text-orange-600">{stats.billing.count} tagihan</span> belum lunas dengan total <span className="font-bold text-gray-900">{formatCurrency(stats.billing.amount)}</span>.
                                    </p>
                                    <Button
                                        onClick={() => navigate('/wali-murid/tagihan')}
                                        size="sm"
                                        variant="outline"
                                        className="w-full mt-3 text-xs h-8 border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                                    >
                                        Bayar Sekarang <ChevronRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </div>
                            )}

                            <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm relative overflow-hidden hover:shadow-md transition-all">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500"></div>
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-green-500" />
                                        <p className="text-sm font-bold text-gray-900">Rekap Presensi</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                                    <div className="bg-green-50 p-2 rounded-lg">
                                        <div className="text-lg font-bold text-green-700">{stats.attendance.hadir}</div>
                                        <div className="text-[10px] text-green-600 font-medium uppercase">Hadir</div>
                                    </div>
                                    <div className="bg-blue-50 p-2 rounded-lg">
                                        <div className="text-lg font-bold text-blue-700">{stats.attendance.sakit}</div>
                                        <div className="text-[10px] text-blue-600 font-medium uppercase">Sakit</div>
                                    </div>
                                    <div className="bg-red-50 p-2 rounded-lg">
                                        <div className="text-lg font-bold text-red-700">{stats.attendance.alpha}</div>
                                        <div className="text-[10px] text-red-600 font-medium uppercase">Alpa</div>
                                    </div>
                                </div>
                            </div>

                            {/* Helper / Contact Support Mockup */}
                            <div className="bg-indigo-900 rounded-xl p-5 text-white text-center mt-4">
                                <p className="text-sm font-medium mb-3">Butuh bantuan?</p>
                                <Button size="sm" className="w-full bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs h-9">
                                    Hubungi Wali Kelas
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div >
    );
};

export default WaliMuridDashboard;
