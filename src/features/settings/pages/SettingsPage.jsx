import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Save, School, Bell, Shield, Loader2, RefreshCw, CheckCircle, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSettings } from '../hooks/useSettings';

/**
 * Settings Page (Admin)
 * Integrated with TanStack Query via useSettings hook
 */
const SettingsPage = () => {
    const fileInputRef = useRef(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [selectedLogoFile, setSelectedLogoFile] = useState(null);

    // Form states (Local state for editing)
    const [localInfo, setLocalInfo] = useState({
        nama: '', npsn: '', alamat: '', email: '', telepon: '', kepalaSekolah: '', logo: null, website: ''
    });

    const [localNotifs, setLocalNotifs] = useState({
        whatsappAbsensi: true, emailLaporanMingguan: false, emailLaporanBulanan: true, notifKritisAlpha: true,
    });

    // Custom Hook
    const {
        schoolInfo, notifications, tahunAjaranList, activeTahunAjaran, isLoading,
        updateSchoolInfo, isUpdatingInfo,
        updateNotifications, isUpdatingNotifs,
        setActiveTahunAjaran, isUpdatingYear
    } = useSettings();

    // Sync remote data to local state on load
    useEffect(() => {
        if (schoolInfo) {
            setLocalInfo(schoolInfo);
            setLogoPreview(schoolInfo.logo);
        }
    }, [schoolInfo]);

    useEffect(() => {
        if (notifications) {
            setLocalNotifs(notifications);
        }
    }, [notifications]);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Mohon pilih file gambar');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                toast.error('Ukuran file maksimal 2MB');
                return;
            }
            setSelectedLogoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setLogoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSaveSchoolInfo = async () => {
        try {
            await updateSchoolInfo({ info: localInfo, logoFile: selectedLogoFile });
            setSelectedLogoFile(null); // Reset file selection after upload
        } catch (error) {
            // Error handling done in hook
        }
    };

    const handleSaveNotifications = async () => {
        try {
            await updateNotifications(localNotifs);
        } catch (error) {
            // Error handling done in hook
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <span className="ml-2 text-gray-500">Memuat pengaturan...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
                    <p className="text-gray-500">Konfigurasi sistem sekolah.</p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* School Info */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <School className="h-5 w-5 text-primary-600" />
                            <CardTitle>Informasi Sekolah</CardTitle>
                        </div>
                        <CardDescription>Data identitas sekolah yang akan tampil di laporan.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Logo Upload Section */}
                        <div className="flex items-start gap-6">
                            <div className="shrink-0">
                                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50 relative">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="School Logo" className="w-full h-full object-contain p-2" />
                                    ) : (
                                        <School className="h-10 w-10 text-gray-400" />
                                    )}
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                />
                                <div className="mt-2 flex flex-col gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-3 w-3 mr-2" />
                                        Upload Logo
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Nama Sekolah"
                                    value={localInfo.nama}
                                    onChange={(e) => setLocalInfo({ ...localInfo, nama: e.target.value })}
                                />
                                <Input
                                    label="NPSN (Optional)"
                                    value={localInfo.npsn}
                                    onChange={(e) => setLocalInfo({ ...localInfo, npsn: e.target.value })}
                                />
                                <Input
                                    label="Alamat"
                                    value={localInfo.alamat}
                                    onChange={(e) => setLocalInfo({ ...localInfo, alamat: e.target.value })}
                                    className="md:col-span-2"
                                />
                                <Input
                                    label="Email Sekolah"
                                    value={localInfo.email}
                                    onChange={(e) => setLocalInfo({ ...localInfo, email: e.target.value })}
                                />
                                <Input
                                    label="No. Telepon"
                                    value={localInfo.telepon}
                                    onChange={(e) => setLocalInfo({ ...localInfo, telepon: e.target.value })}
                                />
                                <Input
                                    label="Kepala Sekolah (Optional)"
                                    value={localInfo.kepalaSekolah}
                                    onChange={(e) => setLocalInfo({ ...localInfo, kepalaSekolah: e.target.value })}
                                    placeholder="Nama Kepala Sekolah"
                                />
                                <Input
                                    label="Website (Optional)"
                                    value={localInfo.website}
                                    onChange={(e) => setLocalInfo({ ...localInfo, website: e.target.value })}
                                    placeholder="https://"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <Button onClick={handleSaveSchoolInfo} isLoading={isUpdatingInfo}>
                                <Save className="mr-2 h-4 w-4" /> Simpan Perubahan
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* System Settings - Tahun Ajaran */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary-600" />
                            <CardTitle>Pengaturan Sistem</CardTitle>
                        </div>
                        <CardDescription>Konfigurasi tahun ajaran dan semester aktif.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {activeTahunAjaran && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <div>
                                    <p className="font-semibold text-green-800">Tahun Ajaran Aktif</p>
                                    <p className="text-sm text-green-600">
                                        {activeTahunAjaran.nama} - Semester {activeTahunAjaran.semester}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Ubah Tahun Ajaran Aktif</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {tahunAjaranList.map(ta => (
                                    <button
                                        key={ta.id}
                                        disabled={ta.is_active || isUpdatingYear}
                                        onClick={() => setActiveTahunAjaran(ta.id)}
                                        className={`p-4 rounded-lg border text-left transition-all ${ta.is_active
                                            ? 'border-primary-500 bg-primary-50 text-primary-700 cursor-default'
                                            : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50 cursor-pointer disabled:opacity-50'
                                            }`}
                                    >
                                        <p className="font-medium">{ta.nama}</p>
                                        <p className="text-sm opacity-70">Semester {ta.semester}</p>
                                        {ta.is_active && (
                                            <span className="inline-flex items-center gap-1 text-xs text-primary-600 mt-2">
                                                <CheckCircle className="h-3 w-3" /> Aktif
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {tahunAjaranList.length === 0 && (
                                <p className="text-sm text-gray-500">
                                    Belum ada tahun ajaran. Tambahkan di menu Data Master.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary-600" />
                            <CardTitle>Notifikasi</CardTitle>
                        </div>
                        <CardDescription>Pengaturan notifikasi otomatis.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                <div>
                                    <span className="font-medium text-gray-900">Notifikasi WA Absensi Siswa</span>
                                    <p className="text-sm text-gray-500">Kirim notifikasi ke orang tua saat siswa tidak hadir</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded text-primary-600"
                                    checked={localNotifs.whatsappAbsensi}
                                    onChange={(e) => setLocalNotifs({ ...localNotifs, whatsappAbsensi: e.target.checked })}
                                />
                            </label>

                            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                <div>
                                    <span className="font-medium text-gray-900">Email Laporan Mingguan ke Orang Tua</span>
                                    <p className="text-sm text-gray-500">Ringkasan kehadiran mingguan via email</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded text-primary-600"
                                    checked={localNotifs.emailLaporanMingguan}
                                    onChange={(e) => setLocalNotifs({ ...localNotifs, emailLaporanMingguan: e.target.checked })}
                                />
                            </label>

                            <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                                <div>
                                    <span className="font-medium text-gray-900">Notifikasi Alpha Kritis</span>
                                    <p className="text-sm text-gray-500">Alert jika siswa memiliki alpha lebih dari 3x dalam sebulan</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded text-primary-600"
                                    checked={localNotifs.notifKritisAlpha}
                                    onChange={(e) => setLocalNotifs({ ...localNotifs, notifKritisAlpha: e.target.checked })}
                                />
                            </label>
                        </div>
                        <div className="flex justify-end">
                            <Button onClick={handleSaveNotifications} variant="outline" isLoading={isUpdatingNotifs}>
                                Simpan Pengaturan Notifikasi
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SettingsPage;
