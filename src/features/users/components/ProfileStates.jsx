import React from 'react';
import { User } from 'lucide-react';

/**
 * LoadingSpinner - Full page loading indicator
 */
export const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-20 min-h-[60vh]">
        <div className="relative">
            <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-primary-500 animate-spin"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary-600 font-bold text-xs">
                LOADING
            </div>
        </div>
    </div>
);

/**
 * EmptyChildState - Display when no children are found
 */
export const EmptyChildState = () => (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-10 text-center">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
            <User className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Siswa</h3>
        <p className="text-gray-500 max-w-md">
            Tidak ada data siswa yang terhubung dengan akun Anda saat ini.
            Silakan hubungi admin sekolah jika ini kesalahan.
        </p>
    </div>
);

export default { LoadingSpinner, EmptyChildState };
