import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
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
    Search,
    Filter,
    FileText,
    TrendingUp,
    AlertTriangle,
    Download,
    Receipt,
    CheckCircle,
    Clock,
    Trash2,
    Edit,
    Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';
import {
    useExpenseCategories,
    useExpenseStats,
    useExpenses,
    useCreateExpense,
    useUpdateExpense,
    useDeleteExpense,
} from '@/features/finance/hooks/useExpenses';

const PengeluaranPage = () => {
    // UI State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [page, setPage] = useState(1);

    // Form State
    const [formData, setFormData] = useState({
        item: '',
        category_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        pic: '',
        proof_url: '',
        status: 'Approved'
    });
    const [editingId, setEditingId] = useState(null);

    // ============================================
    // TANSTACK QUERY HOOKS
    // ============================================

    // Reference data
    const { data: categories = [] } = useExpenseCategories();
    const { data: statsData } = useExpenseStats();
    const budgets = useMemo(() => statsData?.count_by_category || [], [statsData]);

    // Expenses with filters/pagination
    const { data: expensesData, isLoading: loading } = useExpenses({
        search: debouncedSearch,
        categoryId: selectedCategory === 'all' ? null : parseInt(selectedCategory),
        limit: 10,
        offset: (page - 1) * 10
    });
    const expenses = useMemo(() => expensesData || [], [expensesData]);

    // Mutations
    const createMutation = useCreateExpense();
    const updateMutation = useUpdateExpense();
    const deleteMutation = useDeleteExpense();

    const submitting = createMutation.isPending || updateMutation.isPending;

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Handle category change
    const handleCategoryChange = (category) => {
        setSelectedCategory(category);
        setPage(1);
    };

    // Handlers
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            item: '',
            category_id: categories.length > 0 ? categories[0].id : '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            pic: '',
            proof_url: '',
            status: 'Approved'
        });
        setEditingId(null);
    };

    const openCreateModal = () => {
        resetForm();
        if (categories.length > 0) {
            setFormData(prev => ({ ...prev, category_id: categories[0].id }));
        }
        setIsCreateModalOpen(true);
    };

    const openEditModal = (expense) => {
        // Find category ID by name if category_id not available directly in expense object (depends on RPC)
        console.log("Editing expense:", expense);
        // Assuming we might need to match by name if ID is missing or ensure RPC returns it.
        // The RPC returns: id, category_name, description, amount... NO category_id.
        // We need to match category_name to ID from categories list.
        const cat = categories.find(c => c.name === expense.category_name);

        setFormData({
            item: expense.description,
            category_id: cat ? cat.id : '',
            amount: expense.amount,
            date: expense.transaction_date, // Date string YYYY-MM-DD
            pic: expense.pic,
            proof_url: expense.proof_url || '',
            status: expense.status
        });
        setEditingId(expense.id);
        setIsEditModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            categoryId: parseInt(formData.category_id),
            description: formData.item,
            amount: parseFloat(formData.amount),
            transactionDate: formData.date,
            pic: formData.pic,
            status: formData.status,
            proofUrl: formData.proof_url
        };

        const onSuccess = () => {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: `Data pengeluaran berhasil ${editingId ? 'diperbarui' : 'disimpan'}`,
                timer: 1500,
                showConfirmButton: false
            });
            setIsCreateModalOpen(false);
            setIsEditModalOpen(false);
        };

        const onError = (error) => {
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: error.message
            });
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, ...payload }, { onSuccess, onError });
        } else {
            createMutation.mutate(payload, { onSuccess, onError });
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Apakah anda yakin?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, hapus!',
            cancelButtonText: 'Batal'
        });

        if (result.isConfirmed) {
            deleteMutation.mutate(id, {
                onSuccess: () => {
                    Swal.fire('Terhapus!', 'Data pengeluaran telah dihapus.', 'success');
                },
                onError: (error) => {
                    Swal.fire('Error!', error.message, 'error');
                }
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Catatan Pengeluaran</h1>
                    <p className="text-gray-500">Monitoring pengeluaran operasional sekolah.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Laporan
                    </Button>
                    <Button onClick={openCreateModal} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-sm">
                        <Plus className="w-4 h-4" />
                        Catat Pengeluaran
                    </Button>
                </div>
            </div>

            {/* Budget Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {budgets.map((budget, index) => {
                    const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500'];
                    return (
                        <Card key={index} className="p-4 border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-sm font-medium text-gray-500 mb-2">{budget.category_name}</h3>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-lg font-bold text-gray-900">
                                        Rp {parseInt(budget.total || 0).toLocaleString('id-ID')}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full ${colors[index % colors.length]}`}
                                        style={{ width: '100%' }}
                                    ></div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
                {budgets.length === 0 && !loading && (
                    <div className="col-span-full text-center py-4 text-gray-500">
                        Belum ada data pengeluaran bulan ini.
                    </div>
                )}
            </div>

            {/* Filters */}
            <Card className="p-4 border-gray-100 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <Input
                            placeholder="Cari item pengeluaran atau PIC..."
                            icon={Search}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-white"
                        />
                    </div>
                    <div className="flex gap-4">
                        <div className="w-48">
                            <select
                                className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                value={selectedCategory}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                            >
                                <option value="all">Semua Kategori</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <Button variant="secondary" className="gap-2 border-gray-200">
                            <Filter className="w-4 h-4" />
                            Filter
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Table */}
            <Card className="overflow-hidden border-gray-100 shadow-sm relative min-h-[300px]">
                {loading && expenses.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    </div>
                ) : expenses.length > 0 ? (
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-600">ID</TableHead>
                                <TableHead className="font-semibold text-gray-600">Item Pengeluaran</TableHead>
                                <TableHead className="font-semibold text-gray-600">Kategori</TableHead>
                                <TableHead className="font-semibold text-gray-600">Tanggal</TableHead>
                                <TableHead className="font-semibold text-gray-600">PIC</TableHead>
                                <TableHead className="font-semibold text-gray-600">Jumlah</TableHead>
                                <TableHead className="font-semibold text-gray-600">Status</TableHead>
                                <TableHead className="text-right font-semibold text-gray-600">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.map((expense) => (
                                <TableRow key={expense.id} className="hover:bg-gray-50 transition-colors">
                                    <TableCell className="font-medium text-emerald-600">#{expense.id}</TableCell>
                                    <TableCell className="font-medium text-gray-900">{expense.description}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-md text-xs font-medium border border-gray-100 ${expense.category_color ? `${expense.category_color} bg-opacity-10 text-gray-800` : 'bg-gray-50 text-gray-600'}`}>
                                            {expense.category_name}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-gray-500">{new Date(expense.transaction_date).toLocaleDateString('id-ID')}</TableCell>
                                    <TableCell className="text-gray-700">{expense.pic}</TableCell>
                                    <TableCell className="font-bold text-red-600 font-mono">Rp {parseInt(expense.amount).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center w-fit gap-1.5 ${expense.status === 'Approved'
                                            ? 'bg-green-100 text-green-800 border-green-200'
                                            : expense.status === 'Pending'
                                                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                                                : 'bg-red-100 text-red-800 border-red-200'
                                            }`}>
                                            {expense.status === 'Approved' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                            {expense.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(expense)}
                                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                title="Hapus"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <EmptyState
                        title="Tidak ada pengeluaran"
                        description="Belum ada data pengeluaran yang tercatat sesuai filter Anda."
                        icon={Receipt}
                        action={searchTerm ? {
                            label: 'Reset Filter',
                            onClick: () => { setSearchTerm(''); handleCategoryChange('all'); },
                            props: { variant: 'outline' }
                        } : {
                            label: 'Catat Pengeluaran',
                            onClick: openCreateModal,
                            props: { className: 'bg-emerald-600 hover:bg-emerald-700 text-white' }
                        }}
                    />
                )}
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isCreateModalOpen || isEditModalOpen}
                onClose={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}
                title={editingId ? "Edit Data Pengeluaran" : "Catat Pengeluaran Baru"}
                description="Masukkan detail pengeluaran operasional."
                footer={
                    <>
                        <Button variant="secondary" onClick={() => { setIsCreateModalOpen(false); setIsEditModalOpen(false); }}>
                            Batal
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    Menyimpan...
                                </>
                            ) : (
                                'Simpan Data'
                            )}
                        </Button>
                    </>
                }
            >
                <form className="space-y-4">
                    <Input
                        label="Item Pengeluaran"
                        placeholder="Contoh: Pembelian Kertas A4"
                        name="item"
                        value={formData.item}
                        onChange={handleInputChange}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori</label>
                            <select
                                name="category_id"
                                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                value={formData.category_id}
                                onChange={handleInputChange}
                            >
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Tanggal Transaksi"
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                        />
                    </div>

                    <Input
                        label="Jumlah Pengeluaran (Rp)"
                        placeholder="0"
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                    />

                    <Input
                        label="PIC (Person In Charge)"
                        placeholder="Nama Penanggung Jawab"
                        name="pic"
                        value={formData.pic}
                        onChange={handleInputChange}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                        <select
                            name="status"
                            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={formData.status}
                            onChange={handleInputChange}
                        >
                            <option value="Approved">Approved</option>
                            <option value="Pending">Pending</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Upload Bukti (Struk/Nota)</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center">
                            <p className="text-sm text-gray-500">Klik untuk upload atau drag & drop</p>
                            <input type="file" className="hidden" disabled />
                            <p className="text-xs text-gray-400 mt-2">(Fitur upload file belum tersedia)</p>
                        </div>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default PengeluaranPage;
