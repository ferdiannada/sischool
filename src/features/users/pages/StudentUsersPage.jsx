import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Search, Plus, RefreshCw, FileSpreadsheet, LayoutGrid, List as ListIcon, CheckSquare, Users } from 'lucide-react';

import { useUserManagement } from '../hooks/useUserManagement';
import { useUserForm } from '../hooks/useUserForm';
import { useUserImport } from '../hooks/useUserImport.jsx';

import UserFormModal from '../components/modals/UserFormModal';
import ExcelImport from '../../../components/shared/ExcelImport';
import StudentStats from '../components/StudentStats';
import StudentGrid from '../components/StudentGrid';
import StudentTable from '../components/StudentTable';
import Pagination from '../../../components/ui/Pagination';

const StudentUsersPage = () => {
    // 1. Logic Hooks
    const {
        users, stats, roles, kelasList, filteredUsers, loading,
        searchTerm, setSearchTerm, refreshData,
        handleDelete, handleToggleStatus, // missing in previous code snippet? check destructuring carefully
        selectedUsers, toggleSelectUser, selectAll, clearSelection,
        handleBulkAssignToKelas, isAssigning,
        page, setPage, meta
    } = useUserManagement('siswa');

    const {
        formData, setFormData, handleSubmit, resetForm, setFormFromUser, isSubmitting
    } = useUserForm(refreshData);

    const { handleImportUsers, validateImportData } = useUserImport(roles, kelasList, refreshData, users); // roleUsers -> users

    // 2. Local UI State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [targetKelasId, setTargetKelasId] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const [editingUserId, setEditingUserId] = useState(null);

    // Pagination State
    // handled by hook

    // Pagination Logic
    // handled by hook

    // Lazy Loading State for Grid View
    // handled by hook (just 1 page)

    // Grid View Data
    // handled by hook

    // 3. Handlers
    const handleEditClickWrapper = (user) => {
        setEditingUserId(user.id);
        setFormFromUser(user, roles);
        setIsAddModalOpen(true);
    };

    const handleAddClickWrapper = () => {
        setEditingUserId(null); // Clear editing ID
        const studentRole = roles.find(r => r.name === 'siswa');
        resetForm(studentRole ? [studentRole] : []);
        setIsAddModalOpen(true);
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-violet-600 to-indigo-600 p-6 rounded-2xl shadow-lg text-white">
                <div>
                    <h1 className="text-3xl font-bold mb-1">Manajemen Siswa</h1>
                    <p className="text-violet-100 opacity-90">Kelola data siswa, absensi, dan prestasi.</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                        onClick={refreshData}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button
                        variant="secondary"
                        className="bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                        onClick={() => setIsImportModalOpen(true)}
                    >
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Import Excel
                    </Button>
                    <Button
                        className="bg-white text-violet-600 hover:bg-violet-50 border-0 shadow-md font-semibold"
                        onClick={handleAddClickWrapper}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Tambah Siswa
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <StudentStats stats={stats} />

            {/* Main Content Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Cari siswa berdasarkan nama atau email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 bg-white border-gray-200 focus:border-violet-500 focus:ring-violet-500 rounded-xl shadow-sm w-full"
                    />
                </div>

                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <LayoutGrid className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-violet-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <ListIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedUsers.size > 0 && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-200 bg-violet-50 border border-violet-100 rounded-xl p-4 flex flex-wrap items-center gap-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="bg-violet-100 p-2 rounded-lg">
                            <CheckSquare className="h-5 w-5 text-violet-600" />
                        </div>
                        <span className="font-semibold text-violet-800">
                            {selectedUsers.size} siswa dipilih
                        </span>
                    </div>
                    <div className="h-6 w-px bg-violet-200 mx-2 hidden sm:block"></div>
                    <div className="flex items-center gap-3 flex-1">
                        <select
                            className="h-10 rounded-lg border-gray-200 bg-white px-3 py-2 text-sm min-w-48 focus:border-violet-500 focus:ring-violet-500"
                            value={targetKelasId}
                            onChange={(e) => setTargetKelasId(e.target.value)}
                        >
                            <option value="">Pilih Kelas Tujuan...</option>
                            {kelasList.map(k => (
                                <option key={k.id} value={k.id}>{k.nama}</option>
                            ))}
                        </select>
                        <Button
                            onClick={() => handleBulkAssignToKelas(targetKelasId)}
                            isLoading={isAssigning}
                            disabled={!targetKelasId}
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                        >
                            <Users className="mr-2 h-4 w-4" /> Masukkan ke Kelas
                        </Button>
                        <Button variant="ghost" onClick={clearSelection} className="text-gray-500 hover:text-gray-700">
                            Batal
                        </Button>
                    </div>
                </div>
            )}

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mb-4"></div>
                    <p className="text-gray-500">Memuat data siswa...</p>
                </div>
            ) : (
                <div className="min-h-[400px]">
                    {viewMode === 'grid' ? (
                        <>
                            <StudentGrid
                                users={users}
                                onEdit={handleEditClickWrapper}
                                onDelete={handleDelete}
                                onToggleStatus={handleToggleStatus}
                                hasMore={false}
                            />
                            <div className="mt-6">
                                <Pagination
                                    currentPage={page}
                                    totalPages={meta?.totalPages || 1}
                                    onPageChange={setPage}
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <StudentTable
                                users={users}
                                selectedUsers={selectedUsers}
                                onSelectUser={toggleSelectUser}
                                onSelectAll={(checked) => checked ? selectAll(users.map(u => u.id)) : clearSelection()}
                                onEdit={handleEditClickWrapper}
                                onDelete={handleDelete}
                                onToggleStatus={handleToggleStatus}
                            />

                            {/* Pagination Control */}
                            <div className="mt-6">
                                <Pagination
                                    currentPage={page}
                                    totalPages={meta?.totalPages || 1}
                                    onPageChange={setPage}
                                />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Modals */}
            <UserFormModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                formData={formData}
                setFormData={setFormData}
                roles={roles}
                onSubmit={() => handleSubmit(editingUserId).then(success => success && setIsAddModalOpen(false))}
                isSubmitting={isSubmitting}
                title={editingUserId ? "Edit Siswa" : "Tambah Siswa Baru"}
            />

            {isImportModalOpen && (
                <ExcelImport
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    onImport={handleImportUsers}
                    onValidate={validateImportData}
                    importType="siswa"
                />
            )}
        </div>
    );
};

export default StudentUsersPage;
