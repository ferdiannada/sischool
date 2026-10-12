import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Search, Plus, RefreshCw } from 'lucide-react';

import { useUserManagement } from '../hooks/useUserManagement';
import { useUserForm } from '../hooks/useUserForm';

import UserTable from '../components/tables/UserTable';
import UserFormModal from '../components/modals/UserFormModal';
import UserStatsOverview from '../components/UserStatsOverview';

import Pagination from '../../../components/ui/Pagination';

const AdminUsersPage = () => {
    const {
        users, stats, filteredUsers, loading, roles,
        searchTerm, setSearchTerm, refreshData,
        handleDelete, handleToggleStatus,
        page, setPage, meta
    } = useUserManagement('admin');

    const {
        formData, setFormData, handleSubmit, resetForm, setFormFromUser, isSubmitting
    } = useUserForm(refreshData);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    const handleEditClickWrapper = (user) => {
        setEditingUserId(user.id);
        setFormFromUser(user, roles);
        setIsAddModalOpen(true);
    };

    const handleAddClickWrapper = () => {
        setEditingUserId(null);
        const adminRole = roles.find(r => r.name === 'admin');
        resetForm(adminRole ? [adminRole] : []);
        setIsAddModalOpen(true);
    };

    // I need 'roles' from useUserManagement too.
    // Let me add it back to destructuring.

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Admin</h1>
                    <p className="text-gray-500">Kelola akun administrator.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={refreshData}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button onClick={handleAddClickWrapper}>
                        <Plus className="mr-2 h-4 w-4" /> Tambah Admin
                    </Button>
                </div>
            </div>

            <UserStatsOverview stats={stats} roleLabel="Administrator" />

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Input
                            placeholder="Cari admin..."
                            icon={Search}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full sm:w-64"
                        />
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <UserTable
                        users={filteredUsers}
                        onEdit={handleEditClickWrapper}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                        showSelection={false}
                    />
                    <div className="p-4 border-t border-gray-100">
                        <Pagination
                            currentPage={page}
                            totalPages={meta?.totalPages || 1}
                            onPageChange={setPage}
                        />
                    </div>
                </CardContent>
            </Card>

            <UserFormModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                formData={formData}
                setFormData={setFormData}
                roles={roles}
                onSubmit={() => handleSubmit(editingUserId).then(success => success && setIsAddModalOpen(false))}
                isSubmitting={isSubmitting}
                title={editingUserId ? "Edit Admin" : "Tambah Admin Baru"}
            />
        </div >
    );
};

export default AdminUsersPage;
