import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell
} from '@/components/ui/Table';
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    BookOpen,
    Filter,
    Wallet,
    TrendingUp,
    CheckCircle,
    XCircle,
    MoreVertical,
    RefreshCw
} from 'lucide-react';
import {
    usePaymentTypes,
    useCreatePaymentType,
    useUpdatePaymentType,
    useDeletePaymentType
} from '@/features/finance/hooks/useFinance';

const MasterPembayaranPage = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    // TanStack Query Hooks
    const { data: paymentTypes = [], isLoading: loadingTypes } = usePaymentTypes();
    const createMutation = useCreatePaymentType();
    const updateMutation = useUpdatePaymentType();
    const deleteMutation = useDeletePaymentType();

    const loading = loadingTypes || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    // Form State
    const [formData, setFormData] = useState({
        id: null,
        nama: '',
        nominal: '',
        type: 'Bulanan',
        description: '',
        isActive: true
    });

    // Stats Calculation
    const stats = useMemo(() => {
        const total = paymentTypes.length;
        const active = paymentTypes.filter(t => t.is_active !== false).length;
        const recurring = paymentTypes.filter(t => t.is_active !== false && (t.billing_cycle === 'Bulanan' || t.billing_cycle === 'Semesteran')).length;
        return { total, active, recurring };
    }, [paymentTypes]);

    const handleSaveType = async (e) => {
        e.preventDefault();

        // Normalize nominal to number
        const nominalValue = typeof formData.nominal === 'string'
            ? parseInt(formData.nominal.replace(/\./g, ''), 10) || 0
            : formData.nominal;

        const isRecurring = formData.type !== 'Sekali Bayar';
        const payload = {
            nama: formData.nama,
            nominal: nominalValue,
            isRecurring,
            billingCycle: formData.type,
            description: formData.description,
            isActive: formData.isActive
        };

        try {
            if (formData.id) {
                // Update existing
                await updateMutation.mutateAsync({
                    id: formData.id,
                    ...payload
                });
            } else {
                // Create new
                await createMutation.mutateAsync(payload);
            }
            setIsCreateModalOpen(false);
            resetForm();
        } catch (error) {
            console.error('Failed to save type', error);
            // Error handling is done in mutation hooks via toast
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Apakah Anda yakin ingin menghapus jenis pembayaran "${name}"? Data yang sudah terpakai tidak dapat dihapus.`)) return;

        try {
            await deleteMutation.mutateAsync(id);
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    const handleEdit = (type) => {
        setFormData({
            id: type.id,
            nama: type.nama,
            nominal: type.nominal_default,
            // Use saved billing_cycle if available, otherwise fallback to inference
            type: type.billing_cycle || (type.is_recurring ? 'Bulanan' : 'Sekali Bayar'),
            description: type.description || '',
            isActive: type.is_active !== undefined ? type.is_active : true
        });
        setIsCreateModalOpen(true);
    };

    const resetForm = () => {
        setFormData({ id: null, nama: '', nominal: '', type: 'Bulanan', description: '', isActive: true });
    };

    const openCreateModal = () => {
        resetForm();
        setIsCreateModalOpen(true);
    };

    const filteredPaymentTypes = paymentTypes.filter(type => {
        const matchesSearch = type.nama.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' ||
            (filterType === 'Bulanan' && (type.billing_cycle === 'Bulanan' || (!type.billing_cycle && type.is_recurring))) ||
            (filterType === 'Sekali Bayar' && (type.billing_cycle === 'Sekali Bayar' || (!type.billing_cycle && !type.is_recurring)));
        return matchesSearch && matchesFilter;
    });

    // Animation Variants
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
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8 pb-10"
        >
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Master Data Pembayaran</h1>
                    <p className="text-gray-500 mt-1">Kelola kategori dan jenis tagihan sekolah secara terpusat.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { }} disabled={loading} className="gap-2">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={openCreateModal}
                        className="gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg shadow-emerald-200 border-none transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        Tambah Jenis Baru
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.div variants={itemVariants}>
                    <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-white to-emerald-50/50 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                                <Wallet className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Total Jenis Tagihan</p>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.total}</h3>
                            </div>
                        </div>
                    </Card>
                </motion.div>
                <motion.div variants={itemVariants}>
                    <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-white to-blue-50/50 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Status Aktif</p>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.active}</h3>
                            </div>
                        </div>
                    </Card>
                </motion.div>
                <motion.div variants={itemVariants}>
                    <Card className="p-6 border-none shadow-lg bg-gradient-to-br from-white to-orange-50/50 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tagihan Rutin</p>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.recurring}</h3>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            </div>

            {/* Filters & Actions */}
            <motion.div variants={itemVariants}>
                <Card className="p-1 border-gray-100 shadow-sm bg-white rounded-2xl overflow-hidden">
                    <div className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                                placeholder="Cari nama pembayaran..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="relative">
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <select
                                    className="pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none cursor-pointer transition-all"
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                >
                                    <option value="all">Semua Tipe</option>
                                    <option value="Bulanan">Rutin (Bulanan/Semester)</option>
                                    <option value="Sekali Bayar">Sekali Bayar</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {filteredPaymentTypes.length > 0 ? (
                            <Table>
                                <TableHeader className="bg-gray-50/80 border-y border-gray-100">
                                    <TableRow>
                                        <TableHead className="pl-6 font-semibold text-gray-600">Nama Pembayaran</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Tipe</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Deskripsi</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Nominal Standar</TableHead>
                                        <TableHead className="font-semibold text-gray-600">Status</TableHead>
                                        <TableHead className="text-right pr-6 font-semibold text-gray-600">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence>
                                        {filteredPaymentTypes.map((type, index) => (
                                            <motion.tr
                                                key={type.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group hover:bg-emerald-50/30 transition-colors border-b border-gray-50 last:border-none"
                                            >
                                                <TableCell className="pl-6 py-4">
                                                    <div className="font-medium text-gray-900 group-hover:text-emerald-700 transition-colors">
                                                        {type.nama}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${type.billing_cycle === 'Bulanan' || type.billing_cycle === 'Semesteran'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                        : 'bg-purple-50 text-purple-700 border-purple-100'
                                                        }`}>
                                                        {type.billing_cycle || (type.is_recurring ? 'Bulanan' : 'Sekali Bayar')}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-4 max-w-xs truncate text-gray-500">
                                                    {type.description || '-'}
                                                </TableCell>
                                                <TableCell className="py-4 font-bold text-gray-900 font-mono">
                                                    Rp {(type.nominal_default || 0).toLocaleString('id-ID')}
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${(type.is_active !== false)
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : 'bg-gray-100 text-gray-500 border-gray-200'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${(type.is_active !== false) ? 'bg-emerald-500' : 'bg-gray-400'
                                                            }`} />
                                                        {(type.is_active !== false) ? 'Active' : 'Inactive'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right pr-6 py-4">
                                                    <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full"
                                                            title="Edit"
                                                            onClick={() => handleEdit(type)}
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                                            title="Hapus"
                                                            onClick={() => handleDelete(type.id, type.nama)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="py-12">
                                <EmptyState
                                    title="Data tidak ditemukan"
                                    description="Belum ada data master pembayaran yang sesuai dengan filter Anda."
                                    icon={Search}
                                />
                            </div>
                        )}
                    </div>
                    {/* Pagination or Footer info could go here */}
                    <div className="p-4 border-t border-gray-100 bg-gray-50/30 text-xs text-gray-500 flex justify-between items-center">
                        <span>Menampilkan {filteredPaymentTypes.length} tipe pembayaran</span>
                    </div>
                </Card>
            </motion.div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title={formData.id ? "Edit Jenis Pembayaran" : "Tambah Jenis Pembayaran"}
                description={formData.id ? "Perbarui informasi jenis pembayaran." : "Tambahkan kategori tagihan baru ke dalam sistem."}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleSaveType} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent">
                            {loading ? 'Menyimpan...' : 'Simpan Data'}
                        </Button>
                    </>
                }
            >
                <form className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <Input
                                label="Nama Pembayaran"
                                placeholder="Contoh: Kunjungan Industri"
                                value={formData.nama}
                                onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                fullWidth
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipe Tagihan</label>
                            <select
                                className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="Bulanan">Bulanan</option>
                                <option value="Semesteran">Semesteran</option>
                                <option value="Tahunan">Tahunan</option>
                                <option value="Sekali Bayar">Sekali Bayar</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <Input
                                label="Nominal Standar (Rp)"
                                type="number"
                                placeholder="0"
                                value={formData.nominal}
                                onChange={e => setFormData({ ...formData, nominal: e.target.value })}
                                fullWidth
                            />
                        </div>
                        <div className="col-span-2">
                            <Input
                                label="Deskripsi"
                                placeholder="Keterangan singkat mengenai tagihan ini..."
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                fullWidth
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="relative flex items-start">
                            <div className="flex h-5 items-center">
                                <input
                                    id="isActive"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="isActive" className="font-medium text-gray-700">Status Aktif</label>
                                <p className="text-gray-500">Nonaktifkan jika jenis pembayaran ini sudah tidak digunakan lagi.</p>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>
        </motion.div>
    );
};

export default MasterPembayaranPage;
