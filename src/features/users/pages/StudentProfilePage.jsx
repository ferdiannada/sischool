import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Mail, Phone, MapPin, Loader2, User, BookOpen, Calendar, Users, Lock, Save, Edit2 } from 'lucide-react';
import { authService } from '@/features/auth/api/authService';
import { useAuthStore } from '../../../store/authStore';
import { useStudentProfile } from '../hooks/useStudentData';

const StudentProfilePage = () => {
    const { user } = useAuthStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ phone: '', alamat: '' });
    const [saving, setSaving] = useState(false);

    const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');

    // Query Hook
    const { data: profileData, isLoading, error } = useStudentProfile(user?.id);

    const handleSaveProfile = async () => {
        // Note: This would need a backend RPC to update profile
        setSaving(true);
        // Simulate save
        setTimeout(() => {
            setSaving(false);
            setIsEditing(false);
        }, 500);
    };

    const handlePasswordChange = () => {
        setPasswordError('');
        if (passwordData.newPassword.length < 6) {
            setPasswordError('Password minimal 6 karakter');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('Password tidak cocok');
            return;
        }
        alert('Fitur ganti password akan diimplementasikan');
        setPasswordData({ newPassword: '', confirmPassword: '' });
    };

    const getInitials = (name) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <span className="ml-2 text-gray-500">Memuat profil...</span>
            </div>
        );
    }

    if (error || !profileData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-red-500 mb-2">⚠️ Gagal memuat profil</div>
                <p className="text-gray-500 text-sm">Coba muat ulang halaman</p>
            </div>
        );
    }

    const { user: userData, siswa, kelas, wali_kelas, wali_murid } = profileData;

    // Initialize edit data if not editing
    if (!isEditing && editData.phone === '' && userData?.phone) {
        // This effect-like logic inside render is generally safe if guarded, but better loop via useEffect if strict.
        // However, simple default state init is better done in useEffect or derived state if we had a form library.
        // For now, let's keep the manual sync in check or just init when opening edit
    }

    const startEditing = () => {
        setEditData({
            phone: userData?.phone || '',
            alamat: siswa?.alamat || ''
        });
        setIsEditing(true);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
                <p className="text-gray-500">Informasi data diri siswa.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column - ID Card */}
                <Card className="md:col-span-1 border-t-4 border-t-indigo-500 overflow-hidden">
                    {/* Decorative Header */}
                    <div className="h-20 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                            <div className="relative">
                                <Avatar
                                    size="xl"
                                    className="w-24 h-24 border-4 border-white shadow-lg"
                                    fallback={getInitials(userData?.full_name)}
                                    src={userData?.avatar_url}
                                />
                                <div className="absolute bottom-1 right-1 h-5 w-5 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <CardContent className="pt-16 text-center space-y-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{userData?.full_name || 'N/A'}</h2>
                            <p className="text-indigo-600 font-medium">Siswa Kelas {kelas?.nama || 'N/A'}</p>
                            <div className="mt-2 flex justify-center gap-2">
                                {siswa?.nis && (
                                    <Badge variant="outline" className="text-xs">NIS: {siswa.nis}</Badge>
                                )}
                                {siswa?.nisn && (
                                    <Badge variant="outline" className="text-xs">NISN: {siswa.nisn}</Badge>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 w-full text-left space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{userData?.email || '-'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{userData?.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="truncate">{siswa?.alamat || '-'}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column - Details */}
                <div className="md:col-span-2 space-y-6">
                    {/* Academic Info */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-indigo-500" />
                                Informasi Akademik
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <BookOpen className="h-3 w-3 text-indigo-600" />
                                        </span>
                                        Kelas
                                    </p>
                                    <p className="font-bold text-gray-900 mt-1 text-lg">{kelas?.nama || 'Belum ada kelas'}</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                                            <Calendar className="h-3 w-3 text-purple-600" />
                                        </span>
                                        Tahun Ajaran
                                    </p>
                                    <p className="font-bold text-gray-900 mt-1 text-lg">{kelas?.tahun_ajaran || '-'}</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                            <User className="h-3 w-3 text-green-600" />
                                        </span>
                                        Wali Kelas
                                    </p>
                                    <p className="font-bold text-gray-900 mt-1">{wali_kelas?.nama || '-'}</p>
                                </div>
                                <div className="p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100">
                                    <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center">
                                            <Calendar className="h-3 w-3 text-yellow-600" />
                                        </span>
                                        Tanggal Lahir
                                    </p>
                                    <p className="font-bold text-gray-900 mt-1">{formatDate(siswa?.tanggal_lahir)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Wali Murid Info */}
                    {wali_murid && wali_murid.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5 text-indigo-500" />
                                    Orang Tua / Wali
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {wali_murid.map((wali, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                <User className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{wali.nama}</p>
                                                <p className="text-sm text-gray-500">{wali.hubungan || 'Wali'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right text-sm">
                                            <p className="text-gray-600">{wali.phone || '-'}</p>
                                            {wali.is_primary && <Badge variant="success" className="text-xs mt-1">Utama</Badge>}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Edit Profile - Hidden for now, can be enabled when backend is ready */}
                    {isEditing ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Edit2 className="h-5 w-5 text-indigo-500" />
                                    Edit Profil
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="No. Telepon"
                                        value={editData.phone}
                                        onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                        placeholder="08xx-xxxx-xxxx"
                                    />
                                    <Input
                                        label="Alamat"
                                        value={editData.alamat}
                                        onChange={(e) => setEditData({ ...editData, alamat: e.target.value })}
                                        placeholder="Alamat lengkap"
                                    />
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => setIsEditing(false)}>Batal</Button>
                                    <Button onClick={handleSaveProfile} disabled={saving}>
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                        Simpan
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        // Optional: Add button to trigger edit
                        <div className="flex justify-end">
                            <Button variant="outline" onClick={startEditing} disabled>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit Data Diri (Coming Soon)
                            </Button>
                        </div>
                    )}

                    {/* Password Change */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Lock className="h-5 w-5 text-indigo-500" />
                                Ganti Password
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    type="password"
                                    label="Password Baru"
                                    placeholder="••••••••"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                />
                                <Input
                                    type="password"
                                    label="Konfirmasi Password"
                                    placeholder="••••••••"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                />
                            </div>
                            {passwordError && (
                                <p className="text-sm text-red-500">{passwordError}</p>
                            )}
                            <div className="flex justify-end">
                                <Button
                                    variant="outline"
                                    onClick={handlePasswordChange}
                                    disabled={!passwordData.newPassword || !passwordData.confirmPassword}
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

export default StudentProfilePage;
