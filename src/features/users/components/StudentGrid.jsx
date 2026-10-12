import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Edit, Trash2, GraduationCap, MapPin, Loader2 } from 'lucide-react';

const StudentCard = ({ user, onEdit, onDelete, onToggleStatus }) => {
    return (
        <Card className="hover:shadow-lg transition-all duration-300 group border-none shadow-sm bg-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-violet-500 to-indigo-600 opacity-90" />
            <CardContent className="p-0 relative">
                <div className="px-6 pt-12 pb-6 flex flex-col items-center">
                    <Avatar
                        fallback={user.name?.charAt(0) || '?'}
                        className="h-20 w-20 border-4 border-white shadow-md text-2xl mb-3"
                    />
                    <h3 className="text-lg font-bold text-gray-900 text-center line-clamp-1 group-hover:text-violet-600 transition-colors">
                        {user.name}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">{user.email}</p>

                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        <Badge variant={user.isActive ? 'success' : 'secondary'} className="px-3 py-1">
                            {user.isActive ? 'Aktif' : 'Non-Aktif'}
                        </Badge>
                        {/* Placeholder for Class if available in user object, otherwise static or hidden */}
                        {/* <Badge variant="outline" className="border-violet-200 text-violet-700 bg-violet-50">
                            Kelas XII-A
                        </Badge> */}
                    </div>

                    <div className="w-full flex items-center justify-center gap-3 pt-4 border-t border-gray-100">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => onEdit(user)}
                        >
                            <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => onDelete(user)}
                        >
                            <Trash2 className="h-4 w-4 mr-2" /> Hapus
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const StudentGrid = ({ users, onEdit, onDelete, onToggleStatus, onLoadMore, hasMore }) => {
    const observerTarget = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore) {
                    onLoadMore && onLoadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, onLoadMore]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {users.map(user => (
                    <StudentCard
                        key={user.id}
                        user={user}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onToggleStatus={onToggleStatus}
                    />
                ))}
                {users.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                        <p className="text-lg font-medium">Tidak ada siswa ditemukan</p>
                        <p className="text-sm">Coba sesuaikan filter pencarian anda.</p>
                    </div>
                )}
            </div>

            {hasMore && (
                <div ref={observerTarget} className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
                </div>
            )}
        </div>
    );
};

export default StudentGrid;
