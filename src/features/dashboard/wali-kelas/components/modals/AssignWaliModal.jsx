import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Loader2, X, AlertTriangle, Save } from 'lucide-react';
import { Button } from '../../../../../components/ui/Button';
import { Badge } from '../../../../../components/ui/Badge';
import { useSearchWaliCandidates } from '../../hooks/useWaliKelasStudents';

const AssignWaliModal = ({ student, onConfirm, onClose, loading }) => {
    const [mode, setMode] = useState('search'); // 'search' or 'create'

    // Search Mode State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [hubungan, setHubungan] = useState('Ayah');

    // Create Mode State
    const [newWali, setNewWali] = useState({ name: '', email: '', phone: '', hubungan: 'Ayah' });
    const [createError, setCreateError] = useState('');

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Use Query for search
    const { data: searchResults = [], isLoading: searching } = useSearchWaliCandidates(debouncedSearchTerm);

    const handleCreateSubmit = () => {
        // Validate form
        if (!newWali.name || !newWali.email) {
            setCreateError('Nama dan Email wajib diisi');
            return;
        }
        if (!newWali.email.includes('@')) {
            setCreateError('Format email tidak valid');
            return;
        }
        setCreateError('');

        onConfirm(null, newWali.hubungan, newWali);
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-6 text-white">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-xl">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Atur Wali Murid</h2>
                                <p className="text-indigo-100 text-sm">Untuk siswa: {student?.name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Mode Tabs */}
                    <div className="flex border-b border-gray-100">
                        <button
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'search' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setMode('search')}
                        >
                            Cari yang Ada
                        </button>
                        <button
                            className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'create' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setMode('create')}
                        >
                            Buat Baru
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {mode === 'search' ? (
                            // Search Mode
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Cari Orang Tua/Wali</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Cari nama atau email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                        {searching && (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
                                        )}
                                    </div>

                                    {/* Search Results */}
                                    {searchResults.length > 0 && !selectedUser && (
                                        <div className="max-h-40 overflow-y-auto border border-gray-100 rounded-lg bg-gray-50 mt-2">
                                            {searchResults.map(user => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setSearchTerm('');
                                                    }}
                                                    className="p-3 hover:bg-indigo-50 cursor-pointer flex items-center gap-3 transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                                                        {user.avatar_url ? (
                                                            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full" />
                                                        ) : (
                                                            user.full_name.charAt(0)
                                                        )}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="font-medium text-gray-900 truncate">{user.full_name}</div>
                                                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                                                    </div>
                                                    {user.is_wali && (
                                                        <Badge variant="secondary" className="ml-auto text-xs">Wali</Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Selected User & Hubungan */}
                                {selectedUser && (
                                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-sm font-bold text-indigo-600 border border-indigo-200">
                                                {selectedUser.avatar_url ? (
                                                    <img src={selectedUser.avatar_url} alt={selectedUser.full_name} className="w-full h-full rounded-full" />
                                                ) : (
                                                    selectedUser.full_name.charAt(0)
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{selectedUser.full_name}</div>
                                                <div className="text-xs text-gray-500">{selectedUser.email}</div>
                                            </div>
                                            <button
                                                onClick={() => setSelectedUser(null)}
                                                className="ml-auto p-1 hover:bg-indigo-200 rounded-full text-indigo-600"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-medium text-gray-500 uppercase">Hubungan</label>
                                            <select
                                                value={hubungan}
                                                onChange={(e) => setHubungan(e.target.value)}
                                                className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="Ayah">Ayah</option>
                                                <option value="Ibu">Ibu</option>
                                                <option value="Wali">Wali</option>
                                                <option value="Kakak">Kakak</option>
                                                <option value="Paman">Paman</option>
                                                <option value="Bibi">Bibi</option>
                                                <option value="Kakek">Kakek</option>
                                                <option value="Nenek">Nenek</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Create Mode
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
                                        <input
                                            type="text"
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Contoh: Budi Santoso"
                                            value={newWali.name}
                                            onChange={(e) => setNewWali({ ...newWali, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Email</label>
                                        <input
                                            type="email"
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Contoh: budi@gmail.com"
                                            value={newWali.email}
                                            onChange={(e) => setNewWali({ ...newWali, email: e.target.value })}
                                        />
                                        <p className="text-xs text-gray-500">Email akan digunakan untuk login oleh wali murid.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Nomor Telepon / WhatsApp</label>
                                        <input
                                            type="tel"
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Contoh: 081234567890"
                                            value={newWali.phone}
                                            onChange={(e) => setNewWali({ ...newWali, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-gray-700">Hubungan</label>
                                        <select
                                            value={newWali.hubungan}
                                            onChange={(e) => setNewWali({ ...newWali, hubungan: e.target.value })}
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="Ayah">Ayah</option>
                                            <option value="Ibu">Ibu</option>
                                            <option value="Wali">Wali</option>
                                            <option value="Kakak">Kakak</option>
                                            <option value="Paman">Paman</option>
                                            <option value="Bibi">Bibi</option>
                                            <option value="Kakek">Kakek</option>
                                            <option value="Nenek">Nenek</option>
                                        </select>
                                    </div>
                                </div>
                                {createError && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        {createError}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-6 pt-0 flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Batal
                        </Button>
                        <Button
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => {
                                if (mode === 'search') {
                                    onConfirm(selectedUser.id, hubungan, null);
                                } else {
                                    handleCreateSubmit();
                                }
                            }}
                            disabled={loading || (mode === 'search' && !selectedUser)}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Simpan
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AssignWaliModal;
