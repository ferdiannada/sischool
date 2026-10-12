import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Mail, Phone, Crown, Loader2, User, BookOpen, Share2, Shield, Sparkles } from 'lucide-react';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';
import { authService } from '@/features/auth/api/authService';
import useAuthStore from '../../../store/authStore';
import { useKetuaKelasProfile } from '../hooks/useKetuaKelasData';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const KetuaKelasProfilePage = () => {
    const user = useAuthStore((state) => state.user);
    const { data: profile, isLoading: loading } = useKetuaKelasProfile(user?.id);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // No useEffect needed for data fetching


    const handlePasswordUpdate = () => {
        if (!newPassword || !confirmPassword) {
            toast.error('Isi semua field password');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('Password tidak cocok');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('Password minimal 6 karakter');
            return;
        }
        // Implement password update API
        toast.promise(
            authService.updatePassword(newPassword),
            {
                loading: 'Memperbarui password...',
                success: () => {
                    setNewPassword('');
                    setConfirmPassword('');
                    return 'Password berhasil diperbarui';
                },
                error: (err) => err.message || 'Gagal memperbarui password'
            }
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            </div>
        );
    }

    if (!profile) return null;

    const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'KK';

    return (
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
                <p className="text-gray-500">Kelola informasi akun dan profil akademik</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* ID Card Section - Compact & Top Info */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-1"
                >
                    <div className="relative">
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-2xl transition-transform hover:rotate-1 hover:scale-[1.02] duration-500 group cursor-default h-auto min-h-[420px]">
                            {/* Holographic/Gradient Effects */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-purple-500/20 opacity-50 pointer-events-none mix-blend-overlay" />
                            <div className="absolute -top-[100px] -right-[100px] w-64 h-64 bg-amber-500/30 blur-[80px] rounded-full pointer-events-none" />
                            <div className="absolute top-0 w-full h-full  opacity-20 brightness-150 contrast-150"></div>

                            {/* Card Content */}
                            <div className="relative p-6 pt-8 h-full flex flex-col items-center text-center z-10">

                                {/* 1. Header with Logo */}
                                <div className="w-full flex justify-between items-center mb-6 opacity-80">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-white shadow-lg shadow-orange-500/50">
                                            S
                                        </div>
                                        <span className="font-bold tracking-wider text-sm">SCHOOL AI</span>
                                    </div>
                                    <Crown className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                                </div>

                                {/* 2. Avatar & Name (Top Section) */}
                                <div className="flex flex-col items-center mb-6 w-full">
                                    <div className="relative mb-4 group-hover:scale-105 transition-transform duration-500">
                                        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500 to-purple-600 blur opacity-75 animate-pulse"></div>
                                        <Avatar
                                            size="xl"
                                            className="w-24 h-24 border-4 border-white/20 shadow-2xl relative"
                                            fallback={initials}
                                        />
                                    </div>

                                    <h2 className="text-xl font-bold tracking-tight mb-1 break-words w-full px-2">
                                        {profile?.full_name}
                                    </h2>
                                    <p className="text-amber-200/80 font-medium text-xs bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                                        Ketua Kelas
                                    </p>
                                </div>

                                {/* 3. Info Details (Middle Section - moved up) */}
                                <div className="w-full space-y-3 pb-6 border-b border-white/10">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">NISN</span>
                                        <span className="font-mono font-bold tracking-widest">{profile?.nisn || '-'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Role</span>
                                        <span className="font-bold text-amber-400">Student Leader</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400">Valid Until</span>
                                        <span className="font-bold text-emerald-400">Active</span>
                                    </div>
                                </div>

                                {/* 4. Footer */}
                                <div className="mt-4 opacity-30 text-[10px] tracking-[0.2em] w-full text-center">
                                    STUDENT IDENTITY CARD
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Details Section */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-md overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-amber-500 to-orange-500" />
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <BookOpen className="w-5 h-5 text-amber-500" />
                                Informasi Akademik
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <InfoItem label="NIS" value={profile?.nis} />
                            <InfoItem label="NISN" value={profile?.nisn} />
                            <InfoItem label="Kelas" value={profile?.kelas?.nama} icon={<Sparkles className="w-4 h-4 text-amber-500" />} highlight />
                            <InfoItem label="Jenis Kelamin" value={profile?.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} />
                            <InfoItem label="Email" value={profile?.email} fullWidth icon={<Mail className="w-4 h-4" />} />
                            <InfoItem label="No. Handphone" value={profile?.no_hp} fullWidth icon={<Phone className="w-4 h-4" />} />

                            <div className="sm:col-span-2 mt-2 pt-4 border-t border-gray-100">
                                <label className="text-sm font-medium text-gray-400 block mb-1">Wali Kelas</label>
                                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-indigo-900">{profile?.wali_kelas?.name || '-'}</p>
                                        <p className="text-xs text-indigo-500">Guru Wali Kelas</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl">
                                <Shield className="w-5 h-5 text-gray-500" />
                                Keamanan Akun
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    type="password"
                                    label="Password Baru"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <Input
                                    type="password"
                                    label="Konfirmasi Password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button
                                    className="bg-gray-900 text-white hover:bg-gray-800"
                                    onClick={handlePasswordUpdate}
                                >
                                    Update Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

const InfoItem = ({ label, value, fullWidth, highlight, icon }) => (
    <div className={`space-y-1 ${fullWidth ? 'sm:col-span-2' : ''}`}>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            {icon} {label}
        </label>
        <div className={`font-medium text-gray-900 text-lg ${highlight ? 'text-amber-600 font-bold' : ''}`}>
            {value || '-'}
        </div>
    </div>
);

export default KetuaKelasProfilePage;
