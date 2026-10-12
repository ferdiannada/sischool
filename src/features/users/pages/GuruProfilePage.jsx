import React, { useEffect, useState } from 'react';
import usersAPI from '@/features/users/api/usersAPI';
import { useGuruProfile, useUpdateGuruProfile } from '../hooks/useGuruData';
import ProfileHeader from '../components/ProfileHeader';
import ProfileInfoCard from '../components/ProfileInfoCard';
import StatsCard from '@/components/shared/StatsCard';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { Edit, Save, Book, Award, MapPin, Phone, Shield, Key, Grid, Users, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';

const GuruProfilePage = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditOpen, setIsEditOpen] = useState(false);

    // TanStack Query Hooks
    const { data: user, isLoading: loading } = useGuruProfile();
    const updateProfileMutation = useUpdateGuruProfile();
    const saving = updateProfileMutation.isPending;

    const [formData, setFormData] = useState({
        phone: '',
        alamat: '',
        pendidikanTerakhir: '',
        sertifikasiRaw: ''
    });

    // stats removed, using direct derivation or useMemo

    const stats = React.useMemo(() => ({
        classCount: user?.total_kelas_ajar || 0,
        jamPelajaran: user?.total_jam_pelajaran || 0
    }), [user]);

    useEffect(() => {
        if (user) {
            setFormData({
                phone: user.phone || '',
                alamat: user.alamat || '',
                pendidikanTerakhir: user.pendidikan_terakhir || '',
                sertifikasiRaw: user.sertifikasi ? user.sertifikasi.join(', ') : ''
            });
        }
    }, [user]);

    const handleSave = async () => {
        const sertifikasiArray = formData.sertifikasiRaw
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        await updateProfileMutation.mutateAsync({
            phone: formData.phone,
            alamat: formData.alamat,
            pendidikanTerakhir: formData.pendidikanTerakhir,
            sertifikasi: sertifikasiArray
        });

        setIsEditOpen(false);
    };

    if (loading) return <LoadingScreen />;

    if (!user) {
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-semibold text-gray-700">Gagal memuat profil</h2>
                {/* Retry logic usually handled by Query, but we can offer a reload */}
                <Button onClick={() => window.location.reload()} className="mt-4">Muat Ulang</Button>
            </div>
        );
    }

    const educationItems = [
        {
            label: "Pendidikan Terakhir",
            value: user.pendidikan_terakhir,
            icon: Book,
        },
        {
            label: "Sertifikasi",
            value: user.sertifikasi,
            icon: Award,
            type: 'badge-list'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            className="min-h-screen bg-gray-50/50 pb-10"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <motion.div variants={itemVariants} className="relative">
                    <ProfileHeader user={user} />
                    <div className="absolute top-4 right-4 md:top-auto md:bottom-6 md:right-8">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsEditOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-medium transition-colors"
                        >
                            <Edit className="h-4 w-4" />
                            Edit Profil
                        </motion.button>
                    </div>
                </motion.div>

                {/* Tabs Navigation */}
                <motion.div variants={itemVariants} className="flex gap-4 border-b border-gray-200 px-4 md:px-0">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors relative ${activeTab === 'overview' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Overview
                        {activeTab === 'overview' && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`pb-3 px-2 text-sm font-medium transition-colors relative ${activeTab === 'security' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Keamanan
                        {activeTab === 'security' && (
                            <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />
                        )}
                    </button>
                </motion.div>

                <AnimatePresence mode="wait">
                    {activeTab === 'overview' ? (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            {/* Stats Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 md:px-0">
                                <StatsCard
                                    icon={Grid}
                                    label="Total Kelas Ajar"
                                    value={`${stats.classCount} Kelas`}
                                    color="blue"
                                    delay={0.1}
                                />
                                <StatsCard
                                    icon={Users}
                                    label="Status Kepegawaian"
                                    value={user.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                                    color="green"
                                    delay={0.2}
                                />
                                <StatsCard
                                    icon={Clock}
                                    label="Jam Mengajar"
                                    value={`${stats.jamPelajaran} JP / Minggu`}
                                    color="orange"
                                    delay={0.3}
                                />
                            </div>

                            {/* Content Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-0">
                                <ProfileInfoCard
                                    title="Informasi Akademik"
                                    items={educationItems}
                                    icon={Book}
                                    delay={0.4}
                                />

                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4, delay: 0.5 }}
                                    whileHover={{ scale: 1.02 }}
                                    className="h-full"
                                >
                                    <Card className="h-full border-none shadow-md hover:shadow-xl transition-shadow duration-300">
                                        <CardHeader>
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Award className="h-5 w-5 text-indigo-500" />
                                                Prestasi & Aktifitas
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-lg border-2 border-dashed border-gray-100">
                                                <p>Belum ada data aktivitas terkini.</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="security"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="max-w-2xl mx-auto px-4 md:px-0"
                        >
                            <Card className="border-none shadow-md">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-indigo-600" />
                                        Pengaturan Keamanan
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
                                            Untuk keamanan, kami sarankan menggunakan password yang kuat minimal 8 karakter.
                                        </div>
                                        <Input
                                            type="password"
                                            label="Password Saat Ini"
                                            placeholder="••••••••"
                                            icon={Key}
                                        />
                                        <Input
                                            type="password"
                                            label="Password Baru"
                                            placeholder="••••••••"
                                            icon={Key}
                                        />
                                        <Input
                                            type="password"
                                            label="Konfirmasi Password Baru"
                                            placeholder="••••••••"
                                            icon={Key}
                                        />
                                        <div className="flex justify-end pt-2">
                                            <Button className="bg-indigo-600 hover:bg-indigo-700">
                                                Update Password
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                title="Edit Profil"
                description="Perbarui informasi profil Anda di sini."
                size="md"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setIsEditOpen(false)} disabled={saving}>
                            Batal
                        </Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 py-2">
                    <Input
                        label="Nomor Telepon"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Contoh: 08123456789"
                        icon={Phone}
                    />
                    <Input
                        label="Alamat Lengkap"
                        value={formData.alamat}
                        onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                        placeholder="Masukkan alamat lengkap"
                        icon={MapPin}
                    />
                    <div className="border-t border-gray-100 my-4 pt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Data Akademik</h4>
                        <div className="space-y-4">
                            <Input
                                label="Pendidikan Terakhir"
                                value={formData.pendidikanTerakhir}
                                onChange={(e) => setFormData({ ...formData, pendidikanTerakhir: e.target.value })}
                                placeholder="Contoh: S1 Pendidikan Matematika"
                            />
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    Sertifikasi (Pisahkan dengan koma)
                                </label>
                                <textarea
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                                    value={formData.sertifikasiRaw}
                                    onChange={(e) => setFormData({ ...formData, sertifikasiRaw: e.target.value })}
                                    placeholder="Contoh: Sertifikasi Pendidik 2020, Pelatihan Kurikulum Merdeka"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
        </motion.div>
    );
};

export default GuruProfilePage;
