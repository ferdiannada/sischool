import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Mail,
    Phone,
    School,
    User,
    Users,
    Loader2,
    Key,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    Calendar,
    BookOpen,
    Edit2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';
import useAuthStore from '../../../store/authStore';
import { useWaliKelasProfile } from '../hooks/useWaliKelasData';

// Stat Widget for Profile
const ProfileStat = ({ label, value, icon: Icon, color }) => {
    const colorClasses = {
        green: 'bg-green-100 text-green-600',
        blue: 'bg-blue-100 text-blue-600',
        indigo: 'bg-indigo-100 text-indigo-600',
        red: 'bg-red-100 text-red-600',
        purple: 'bg-purple-100 text-purple-600'
    };

    return (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                <Icon className="w-4 h-4" />
            </div>
            <div>
                <div className="text-lg font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
            </div>
        </div>
    );
};

const WaliKelasProfilePage = () => {
    const { user } = useAuthStore();
    const { data: profileResult, isLoading: loading } = useWaliKelasProfile(user?.id);

    // Default empty data structure to avoid null checks everywhere
    const data = profileResult || {
        user: null,
        guru: null,
        kelas: null,
        stats: null,
        has_class: false
    };

    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);

    // No useEffect needed for data fetching


    const handlePasswordChange = async () => {
        setPasswordError('');
        setPasswordSuccess(false);

        if (passwordForm.newPassword.length < 6) {
            setPasswordError('Password minimal 6 karakter');
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Password tidak cocok');
            return;
        }

        setSavingPassword(true);
        try {
            const { authService } = await import('@/features/auth/api/authService');
            await authService.updatePassword(passwordForm.newPassword);
            setPasswordSuccess(true);
            setPasswordForm({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            setPasswordError(error.message || 'Gagal mengubah password');
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[80vh]">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-500 animate-pulse">Memuat profil...</p>
            </div>
        );
    }

    const getInitials = (name) => {
        if (!name) return 'WK';
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    return (
        <div className="min-h-screen bg-gray-50/50 -m-6 p-6 space-y-6 font-sans">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold text-gray-900">Profil Saya</h1>
                <p className="text-gray-500">Wali Kelas {data.kelas?.nama || '-'}</p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column - Profile Card */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-1"
                >
                    <Card className="overflow-hidden">
                        {/* Header Banner */}
                        <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                                <div className="w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
                                    {data.user?.avatar_url ? (
                                        <img
                                            src={data.user.avatar_url}
                                            alt={data.user.full_name}
                                            className="w-full h-full rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                                            {getInitials(data.user?.full_name)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <CardContent className="pt-16 pb-6 text-center space-y-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{data.user?.full_name || '-'}</h2>
                                <Badge variant="info" className="mt-2">Wali Kelas</Badge>
                            </div>

                            {data.guru?.nip && (
                                <div className="text-sm text-gray-500">
                                    NIP. {data.guru.nip}
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-100 space-y-3 text-left">
                                {data.user?.email && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">{data.user.email}</span>
                                    </div>
                                )}
                                {data.user?.phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">{data.user.phone}</span>
                                    </div>
                                )}
                                {data.guru?.bidang_studi && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <BookOpen className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-600">{data.guru.bidang_studi}</span>
                                    </div>
                                )}
                            </div>

                            <Button variant="outline" fullWidth className="mt-4">
                                <Edit2 className="w-4 h-4 mr-2" />
                                Edit Profil
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Right Column - Details */}
                <div className="md:col-span-2 space-y-6">
                    {/* Class Responsibility */}
                    {data.has_class && data.kelas && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <School className="h-5 w-5 text-indigo-600" />
                                        Tanggung Jawab Kelas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-5 rounded-xl border border-indigo-100">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                                                <School className="h-8 w-8" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-xl font-bold text-gray-900">Kelas {data.kelas.nama}</h4>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {data.kelas.tingkat && `Tingkat ${data.kelas.tingkat}`}
                                                    {data.kelas.jurusan && ` • Jurusan ${data.kelas.jurusan}`}
                                                </p>
                                                {data.stats?.academic_year && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        Tahun Ajaran {data.stats.academic_year}
                                                    </p>
                                                )}

                                                <div className="grid grid-cols-3 gap-3 mt-4">
                                                    <ProfileStat
                                                        label="Total Siswa"
                                                        value={data.kelas.total_students || 0}
                                                        icon={Users}
                                                        color="indigo"
                                                    />
                                                    <ProfileStat
                                                        label="Laki-laki"
                                                        value={data.kelas.male_count || 0}
                                                        icon={User}
                                                        color="blue"
                                                    />
                                                    <ProfileStat
                                                        label="Perempuan"
                                                        value={data.kelas.female_count || 0}
                                                        icon={User}
                                                        color="purple"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Performance Stats */}
                    {data.stats && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                                        Statistik Kelas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-green-50 rounded-xl p-5">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                                    <TrendingUp className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm text-green-700">Rata-rata Kehadiran</span>
                                            </div>
                                            <div className="text-3xl font-bold text-green-700">
                                                {data.stats.avg_attendance_rate || 0}%
                                            </div>
                                            <p className="text-xs text-green-600 mt-1">3 bulan terakhir</p>
                                        </div>

                                        <div className="bg-red-50 rounded-xl p-5">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                                    <AlertCircle className="w-5 h-5" />
                                                </div>
                                                <span className="text-sm text-red-700">Siswa Alpha Tinggi</span>
                                            </div>
                                            <div className="text-3xl font-bold text-red-700">
                                                {data.stats.total_alpha_students || 0}
                                            </div>
                                            <p className="text-xs text-red-600 mt-1">Alpha &gt; 3 kali/bulan</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {/* Password Change */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5 text-indigo-600" />
                                    Ganti Password
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {passwordSuccess && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm">
                                        <CheckCircle className="w-4 h-4" />
                                        Password berhasil diubah
                                    </div>
                                )}

                                {passwordError && (
                                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        {passwordError}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        type="password"
                                        label="Password Baru"
                                        placeholder="••••••••"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                    />
                                    <Input
                                        type="password"
                                        label="Konfirmasi Password"
                                        placeholder="••••••••"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={handlePasswordChange}
                                        disabled={savingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                                    >
                                        {savingPassword ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Key className="w-4 h-4 mr-2" />
                                        )}
                                        {savingPassword ? 'Menyimpan...' : 'Update Password'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* No Class Warning */}
                    {!data.has_class && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <Card className="border-yellow-200 bg-yellow-50">
                                <CardContent className="py-8 text-center">
                                    <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="w-8 h-8 text-yellow-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                                        Belum Ada Kelas Binaan
                                    </h3>
                                    <p className="text-yellow-700 text-sm max-w-md mx-auto">
                                        Anda belum ditetapkan sebagai Wali Kelas untuk tahun ajaran ini.
                                        Silakan hubungi administrator jika ini adalah kesalahan.
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WaliKelasProfilePage;
