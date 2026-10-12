import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
    Save,
    Building,
    Bell,
    Lock
} from 'lucide-react';

const SettingsPage = () => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Pengaturan TU</h1>
                <p className="text-gray-500">Konfigurasi profil keuangan dan preferensi sistem.</p>
            </div>

            {/* School Finance Profile */}
            <Card className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <Building className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Profil Keuangan Sekolah</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Nama Institusi" defaultValue="SMK Negeri 1 Contoh" />
                    <Input label="Tahun Ajaran Aktif" defaultValue="2025/2026" />
                    <Input label="Nama Bank Utama" defaultValue="Bank Mandiri" />
                    <Input label="Nomor Rekening" defaultValue="123-456-7890" />
                    <Input label="Atas Nama" defaultValue="SMK N 1 Contoh" />
                    <Input label="Email Bendahara" type="email" defaultValue="bendahara@smkn1contoh.sch.id" />
                </div>
                <div className="mt-6 flex justify-end">
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                        <Save className="w-4 h-4" />
                        Simpan Profil
                    </Button>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notification Settings */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Bell className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Notifikasi Tagihan</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-700">Kirim pengingat otomatis (Email)</span>
                            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-emerald-500 rounded-full cursor-pointer">
                                <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transform translate-x-6 transition-transform"></span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-700">Kirim pengingat otomatis (WhatsApp)</span>
                            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-gray-200 rounded-full cursor-pointer">
                                <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transition-transform"></span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-700">Notifikasi pembayaran sukses</span>
                            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out bg-emerald-500 rounded-full cursor-pointer">
                                <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow transform translate-x-6 transition-transform"></span>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Security Settings */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <Lock className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Keamanan</h3>
                    </div>

                    <div className="space-y-4">
                        <Button variant="outline" fullWidth className="justify-start">
                            Ubah Password Akun
                        </Button>
                        <Button variant="outline" fullWidth className="justify-start">
                            Kelola Akses Staf TU
                        </Button>
                        <Button variant="outline" fullWidth className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                            Hapus Data Transaksi (Reset)
                        </Button>
                    </div>
                </Card>
            </div>

        </div>
    );
};

export default SettingsPage;
