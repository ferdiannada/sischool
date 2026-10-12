import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Search, Plus, RefreshCw, Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

import { useUserManagement } from '../hooks/useUserManagement';
import { useUserForm } from '../hooks/useUserForm';

import UserTable from '../components/tables/UserTable';
import UserFormModal from '../components/modals/UserFormModal';
import Pagination from '../../../components/ui/Pagination';

import StatsCard from '../../../components/shared/StatsCard';

const StaffUsersPage = () => {
    const {
        users, stats, roles, filteredUsers, loading,
        searchTerm, setSearchTerm, refreshData,
        handleDelete, handleToggleStatus,
        page, setPage, meta
    } = useUserManagement('tu');

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
        const tuRole = roles.find(r => r.name === 'tu');
        resetForm(tuRole ? [tuRole] : []);
        setIsAddModalOpen(true);
    };

    // Use stats from hook
    const total = stats?.total || 0;
    const active = stats?.active || 0;
    const inactive = stats?.inactive || 0;
    const activeRate = total > 0 ? ((active / total) * 100).toFixed(0) : 0;

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
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100
            }
        }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-8 p-2 min-h-screen"
        >
            {/* Header Section */}
            <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Manajemen Tata Usaha
                    </h1>
                    <p className="mt-1 text-gray-500">
                        Kelola akun dan akses staf Tata Usaha sekolah.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={refreshData}
                        className="bg-white/50 backdrop-blur-sm border-gray-200/60 hover:bg-white/80 transition-all active:scale-95"
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        onClick={handleAddClickWrapper}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 focus:ring-offset-2 transition-all active:scale-95"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Staff
                    </Button>
                </div>
            </motion.div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <StatsCard
                    title="Total Staff TU"
                    value={total}
                    icon={Users}
                    color="blue"
                    delay={0.1}
                />
                <StatsCard
                    title="Akun Aktif"
                    value={active}
                    icon={UserCheck}
                    color="emerald"
                    subtext={
                        <span className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <TrendingUp className="mr-1 h-3 w-3" />
                            {activeRate}% Rate Keaktifan
                        </span>
                    }
                    delay={0.2}
                />
                <StatsCard
                    title="Non-Aktif"
                    value={inactive}
                    icon={UserX}
                    color="rose"
                    delay={0.3}
                />
            </div>

            {/* Content Section */}
            <motion.div variants={itemVariants} className="rounded-3xl border border-white/20 bg-white/60 shadow-xl backdrop-blur-xl overflow-hidden">
                <div className="border-b border-gray-100/50 bg-white/40 p-6 backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                        <div className="relative w-full sm:max-w-md group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari nama atau email staff..."
                                className="block w-full pl-10 pr-4 py-2.5 rounded-xl border-gray-200/60 bg-white/50 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:bg-white transition-all duration-200 sm:text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                            {/* Menampilkan {filteredUsers.length} user */}
                            halaman {page} dari {meta?.totalPages || 1}
                        </div>
                    </div>
                </div>

                <div className="p-0">
                    <UserTable
                        users={users} // Use paginated users
                        onEdit={handleEditClickWrapper}
                        onDelete={handleDelete}
                        onToggleStatus={handleToggleStatus}
                        showSelection={false}
                    />
                    <div className="p-4 border-t border-gray-100/50">
                        <Pagination
                            currentPage={page}
                            totalPages={meta?.totalPages || 1}
                            onPageChange={setPage}
                        />
                    </div>
                </div>
            </motion.div>

            <UserFormModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                formData={formData}
                setFormData={setFormData}
                roles={roles}
                onSubmit={() => handleSubmit(editingUserId).then(success => success && setIsAddModalOpen(false))}
                isSubmitting={isSubmitting}
                title={editingUserId ? "Edit User Staff" : "Tambah Staff Baru"}
            />
        </motion.div>
    );
};

export default StaffUsersPage;
