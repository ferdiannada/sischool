import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Avatar } from '../../../components/ui/Avatar';
import { Mail, Phone, MapPin, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { useParentData, useParentProfile } from '../hooks/useParentData';

const ParentProfilePage = () => {
    const { user } = useAuthStore();

    // TanStack Query Hooks
    const { data: profile, isLoading: loadingProfile } = useParentProfile(user?.id);
    const { data: children = [], isLoading: loadingChildren } = useParentData(user?.id);

    const loading = loadingProfile || loadingChildren;

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    // Use profile data or fallback to user store data if profile RPC fails/is empty
    const displayProfile = profile || {
        full_name: user?.user_metadata?.full_name || 'Wali Murid',
        email: user?.email,
        phone: user?.phone || '-',
        hubungan: 'Orang Tua'
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
                <p className="text-gray-500">Informasi akun Wali Murid.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column - ID Card */}
                <Card className="md:col-span-1 border-t-4 border-t-pink-500">
                    <CardContent className="pt-8 text-center space-y-4">
                        <div className="relative mx-auto w-32 h-32">
                            <Avatar
                                size="xl"
                                className="w-32 h-32 border-4 border-white shadow-lg mx-auto"
                                fallback={displayProfile.full_name?.substring(0, 2).toUpperCase()}
                                src={displayProfile.avatar_url}
                            />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{displayProfile.full_name}</h2>
                            <p className="text-pink-600 font-medium">{displayProfile.hubungan}</p>
                        </div>

                        <div className="pt-4 border-t border-gray-100 w-full text-left space-y-3">
                            <div className="flex items-center gap-3 text-sm">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span>{displayProfile.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <span>{displayProfile.phone}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column - Details */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Data Anak</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {children.length > 0 ? (
                                children.map((child) => (
                                    <div key={child.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                                        <Avatar
                                            fallback={child.full_name?.substring(0, 2).toUpperCase()}
                                            src={child.avatar_url}
                                        />
                                        <div>
                                            <h4 className="font-bold text-gray-900">{child.full_name}</h4>
                                            <p className="text-sm text-gray-600">Siswa Kelas {child.kelas_nama || '-'}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">Belum ada data anak yang terhubung.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Ganti Password</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input type="password" label="Password Baru" placeholder="••••••••" />
                                <Input type="password" label="Konfirmasi Password" placeholder="••••••••" />
                            </div>
                            <div className="flex justify-end">
                                <Button variant="outline">Update Password</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ParentProfilePage;
