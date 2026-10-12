import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Search, Plus, RefreshCw, FileSpreadsheet, LayoutGrid, List as ListIcon } from 'lucide-react';
import ExcelImport from '../../../components/shared/ExcelImport';

import { useUserManagement } from '../hooks/useUserManagement';
import { useUserForm } from '../hooks/useUserForm';
import { useUserImport } from '../hooks/useUserImport.jsx';

import UserFormModal from '../components/modals/UserFormModal';
import TeacherStats from '../components/TeacherStats';
import TeacherGrid from '../components/TeacherGrid';
import TeacherTable from '../components/TeacherTable';
import Pagination from '../../../components/ui/Pagination';

const TeacherUsersPage = () => {
    // 1. Logic Hooks
    const {
        users, stats, roles, kelasList, filteredUsers, loading,
        searchTerm, setSearchTerm, refreshData,
        handleDelete, handleToggleStatus,
        selectedUsers, toggleSelectUser, selectAll, clearSelection,
        page, setPage, meta
    } = useUserManagement('guru');

    const {
        formData, setFormData, handleSubmit, resetForm, setFormFromUser, isSubmitting
    } = useUserForm(refreshData);

    const { handleImportUsers } = useUserImport(roles, kelasList, refreshData, users); // Changed roleUsers to users (current page) - verify if this breaks import duplicate check?

    // 2. Local UI State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // reset page when search changes
    // handled in hook

    // Derived Data
    // pagination handled by server

    // Handlers
    // Grid View Load More - Not easily supported with standard pagination unless we append data using infinite query.
    // For now, let's make Grid View just show the current page, or support pagination at bottom.
    // Removing infinite scroll logic for now to simplify.

    const handleEditClickWrapper = (user) => {
        setEditingUserId(user.id);
        setFormFromUser(user, roles);
        setIsAddModalOpen(true);
    };

    const handleAddClickWrapper = () => {
        setEditingUserId(null);
        const teacherRole = roles.find(r => r.name === 'guru');
        resetForm(teacherRole ? [teacherRole] : []);
        setIsAddModalOpen(true);
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-600 to-emerald-600 p-6 rounded-2xl shadow-lg text-white">
                <div>
                    <h1 className="text-3xl font-bold mb-1">Manajemen Guru</h1>
                    <p className="text-teal-100 opacity-90">Kelola akun dan data pengajar.</p>
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
                        className="bg-white text-teal-600 hover:bg-teal-50 border-0 shadow-md font-semibold"
                        onClick={handleAddClickWrapper}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Tambah Guru
                    </Button>
                </div>
            </div>

            {/* Stats Overview */}
            <TeacherStats stats={stats} />

            {/* Main Content Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Cari guru berdasarkan nama atau email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-11 bg-white border-gray-200 focus:border-teal-500 focus:ring-teal-500 rounded-xl shadow-sm w-full"
                    />
                </div>

                <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <LayoutGrid className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-teal-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <ListIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
                    <p className="text-gray-500">Memuat data guru...</p>
                </div>
            ) : (
                <div className="min-h-[400px]">
                    {viewMode === 'grid' ? (
                        <>
                            <TeacherGrid
                                users={users}
                                onEdit={handleEditClickWrapper}
                                onDelete={handleDelete}
                                onToggleStatus={handleToggleStatus}
                                // onLoadMore removed as we paginate
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
                            <TeacherTable
                                users={users}
                                selectedUsers={selectedUsers}
                                onSelectUser={toggleSelectUser}
                                onSelectAll={(checked) => checked ? selectAll(users.map(u => u.id)) : clearSelection()}
                                onEdit={handleEditClickWrapper}
                                onDelete={handleDelete}
                                onToggleStatus={handleToggleStatus}
                            />
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
                title={editingUserId ? "Edit Guru" : "Tambah Guru Baru"}
            />

            <Modal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Import Data Guru"
                description="Upload file Excel berisi data guru."
                footer={<Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>Tutup</Button>}
            >
                <ExcelImport
                    type="users"
                    onImport={(data) => handleImportUsers(data).then(() => setIsImportModalOpen(false))}
                />
            </Modal>
        </div >
    );
};

export default TeacherUsersPage;
