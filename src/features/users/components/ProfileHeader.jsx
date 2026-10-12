import React from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Mail, Phone, MapPin } from 'lucide-react';

const ProfileHeader = ({ user }) => {
    if (!user) return null;

    return (
        <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
            {/* Cover Image Placeholder */}
            <div className="h-32 bg-gradient-to-r from-blue-500 to-indigo-600 relative">
                <div className="absolute inset-0 bg-white/10 pattern-dots"></div>
            </div>

            <CardContent className="relative pt-0 px-6 pb-6">
                <div className="flex flex-col md:flex-row items-center md:items-end -mt-12 gap-6">
                    {/* Avatar */}
                    <div className="relative">
                        <Avatar
                            size="xl"
                            src={user.avatar_url}
                            fallback={user.full_name?.substring(0, 2).toUpperCase()}
                            className="w-24 h-24 md:w-32 md:h-32 border-4 border-white shadow-lg text-2xl"
                        />
                        <div className={`absolute bottom-2 right-2 h-4 w-4 rounded-full border-2 border-white ${user.status === 'aktif' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    </div>

                    {/* Name & Role */}
                    <div className="flex-1 text-center md:text-left mb-2 md:mb-0">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{user.full_name}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-1">
                            <span className="text-indigo-600 font-medium">Guru {user.bidang_studi}</span>
                            {user.nip && (
                                <span className="text-gray-400 text-sm">• NIP. {user.nip}</span>
                            )}
                            <Badge variant={user.status === 'aktif' ? 'success' : 'secondary'} className="ml-2">
                                {user.status === 'aktif' ? 'Aktif Mengajar' : user.status}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Quick Contact Info */}
                <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 text-sm text-gray-600 p-2 rounded-lg hover:bg-white/50 transition-colors">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                            <Mail className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                            <span className="block text-xs text-gray-400">Email</span>
                            <span className="font-medium text-gray-900">{user.email}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600 p-2 rounded-lg hover:bg-white/50 transition-colors">
                        <div className="p-2 bg-green-50 text-green-600 rounded-full">
                            <Phone className="h-4 w-4" />
                        </div>
                        <div>
                            <span className="block text-xs text-gray-400">Telepon</span>
                            <span className="font-medium text-gray-900">{user.phone || '-'}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-600 p-2 rounded-lg hover:bg-white/50 transition-colors">
                        <div className="p-2 bg-red-50 text-red-600 rounded-full">
                            <MapPin className="h-4 w-4" />
                        </div>
                        <div className="truncate">
                            <span className="block text-xs text-gray-400">Alamat</span>
                            <span className="font-medium text-gray-900" title={user.alamat}>{user.alamat || '-'}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProfileHeader;
