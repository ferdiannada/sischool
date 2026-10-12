import React from 'react';
import { motion } from 'framer-motion';
import { User, GraduationCap, Phone, Activity } from 'lucide-react';

/**
 * ProfileCard - Sidebar profile card showing student info summary
 */
const ProfileCard = ({ displayData, onCopy }) => {
    const copyToClipboard = (text) => {
        if (text) {
            navigator.clipboard.writeText(text);
            if (onCopy) onCopy(text);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative bg-white rounded-3xl overflow-hidden shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] border border-white"
        >
            {/* Card Header Background */}
            <div className="h-32 bg-gradient-to-br from-primary-600 via-indigo-600 to-primary-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 opacity-20"></div>
                <div className="absolute top-4 right-4 flex gap-2">
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border shadow-sm backdrop-blur-md ${displayData?.status === 'aktif'
                        ? 'bg-green-500/20 border-green-400/30 text-green-100'
                        : 'bg-red-500/20 border-red-400/30 text-red-100'
                        }`}>
                        {displayData?.status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                    </div>
                </div>
            </div>

            {/* Profile Image & Basic Info */}
            <div className="px-6 pb-8 relative text-center">
                <div className="relative -mt-16 mb-4 inline-block">
                    <div className="h-32 w-32 rounded-3xl border-4 border-white shadow-2xl bg-white p-1 overflow-hidden">
                        {displayData?.avatar_url ? (
                            <img src={displayData.avatar_url} alt={displayData.full_name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center rounded-2xl">
                                <User className="h-12 w-12 text-gray-300" />
                            </div>
                        )}
                    </div>
                    {displayData?.status === 'aktif' && (
                        <div className="absolute bottom-1 right-1 h-6 w-6 bg-green-500 border-4 border-white rounded-full flex items-center justify-center shadow-sm">
                            <div className="h-2 w-2 bg-white rounded-full"></div>
                        </div>
                    )}
                </div>

                <h2 className="text-xl font-bold text-gray-900 mb-1">{displayData?.full_name}</h2>
                <p className="text-gray-500 font-medium text-sm mb-6 flex items-center justify-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-primary-500" />
                    {displayData?.kelas_nama || '-'}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                    <div
                        onClick={() => copyToClipboard(displayData?.nis)}
                        className="p-3 bg-gray-50 hover:bg-primary-50 rounded-2xl border border-gray-100 transition-colors cursor-pointer group"
                    >
                        <p className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-primary-400 mb-1">NIS</p>
                        <p className="text-sm font-bold text-gray-900">{displayData?.nis || '-'}</p>
                    </div>
                    <div
                        onClick={() => copyToClipboard(displayData?.nisn)}
                        className="p-3 bg-gray-50 hover:bg-indigo-50 rounded-2xl border border-gray-100 transition-colors cursor-pointer group"
                    >
                        <p className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-indigo-400 mb-1">NISN</p>
                        <p className="text-sm font-bold text-gray-900">{displayData?.nisn || '-'}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {displayData?.telepon && (
                        <button
                            onClick={() => window.open(`tel:${displayData.telepon}`)}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                        >
                            <Phone className="h-4 w-4" />
                            Hubungi Siswa
                        </button>
                    )}
                    <button
                        className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
                        disabled
                    >
                        <Activity className="h-4 w-4 text-gray-400" />
                        Lihat Rapor (Segera)
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ProfileCard;
