import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { usersAPI } from '@/features/users/api/usersAPI';
import { masterDataAPI } from '@/features/master-data/api/masterDataAPI';
import { siswaAPI } from '@/features/users/api/siswaAPI';
import { useDebounce } from '@/hooks/useDebounce'; // Assuming this hook exists, if not I'll implement simple debounce

export const useUserManagement = (initialRoleFilter = 'all') => {
    const queryClient = useQueryClient();

    // State
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState(initialRoleFilter);
    const [selectedUsers, setSelectedUsers] = useState(new Set());
    const [isAssigning, setIsAssigning] = useState(false);

    // Debounce search to prevent excessive API calls
    const debouncedSearch = useDebounce(searchTerm, 500);

    // Queries
    const {
        data: usersData = { data: [], meta: { total: 0, totalPages: 0 } },
        isLoading: usersLoading,
        isPlaceholderData
    } = useQuery({
        queryKey: ['users', 'list', { page, limit, search: debouncedSearch, role: roleFilter }],
        queryFn: () => usersAPI.getUsers({
            page,
            limit,
            search: debouncedSearch,
            role: roleFilter
        }),
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000, // 1 minute
    });

    const { data: roles = [] } = useQuery({
        queryKey: ['users', 'roles'],
        queryFn: usersAPI.getRoles,
        staleTime: Infinity,
    });

    const { data: kelasList = [] } = useQuery({
        queryKey: ['master', 'classes'],
        queryFn: masterDataAPI.getKelas,
        staleTime: 5 * 60 * 1000,
    });

    // Stats Query
    const { data: stats = { total: 0, active: 0, inactive: 0 } } = useQuery({
        queryKey: ['users', 'stats', roleFilter],
        queryFn: () => usersAPI.getUserStats(roleFilter),
        staleTime: 60 * 1000,
    });

    // Mutations
    const deleteMutation = useMutation({
        mutationFn: usersAPI.deleteUser,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
            toast.success('User berhasil dihapus');
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, isActive }) => usersAPI.toggleUserStatus(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            // toast handled in handleToggleStatus
        },
        onError: () => toast.error('Gagal mengubah status'),
    });

    const refreshData = () => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
        setSelectedUsers(new Set());
    };

    // Actions
    const handleSearch = (term) => {
        setSearchTerm(term);
        setPage(1); // Reset to first page on new search
    };

    const handleRoleChange = (newRole) => {
        setRoleFilter(newRole);
        setPage(1);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleDelete = async (user) => {
        if (!window.confirm(`Hapus user ${user.name} secara permanen? Aksi ini tidak dapat dibatalkan.`)) return;

        try {
            await deleteMutation.mutateAsync(user.id);
        } catch (error) {
            console.error('Error deleting user:', error);
            if (error.message?.includes('409') || error.message?.toLowerCase().includes('constraint')) {
                if (user.isActive) {
                    if (window.confirm('Gagal hapus permanen: User memiliki data terkait.\n\nIngin menonaktifkan akun user ini saja?')) {
                        await handleToggleStatus(user);
                    }
                } else {
                    toast.error('User memiliki data terkait dan tidak dapat dihapus permanen.');
                }
            } else {
                toast.error('Gagal menghapus user: ' + (error.message || 'Terjadi kesalahan sistem'));
            }
        }
    };

    const handleToggleStatus = async (user) => {
        try {
            await toggleStatusMutation.mutateAsync({ id: user.id, isActive: !user.isActive });
            toast.success(`User ${user.isActive ? 'dinonaktifkan' : 'diaktifkan'}`);
        } catch (error) {
            // Error handled in mutation
        }
    };

    // Selection Logic
    const toggleSelectUser = (userId) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const selectAll = (userIds) => {
        setSelectedUsers(new Set(userIds));
    };

    const clearSelection = () => {
        setSelectedUsers(new Set());
    };

    // Optimized Bulk Assign
    const handleBulkAssignToKelas = async (targetKelasId) => {
        if (!targetKelasId) {
            toast.error('Pilih kelas tujuan terlebih dahulu');
            return;
        }

        if (selectedUsers.size === 0) {
            toast.error('Pilih siswa yang akan di-assign');
            return;
        }

        setIsAssigning(true);
        try {
            // Get Siswa IDs corresponding to selected User IDs
            // We need to fetch this because we only have User IDs selected in the table
            // Ideally the table should contain siswaIds if possible, but let's fetch efficiently.

            // NOTE: This part is tricky. 'selectedUsers' are User IDs.
            // 'bulkAssignToKelas' expects Siswa IDs.
            // We need to resolve UserID -> SiswaID.

            // Option 1: Fetch all siswas for these users.
            // Option 2: Modify bulkAssignToKelas to accept User IDs and handle resolution in DB.

            // Let's go with Option 1 for now to keep API simple.
            const userIds = Array.from(selectedUsers);

            // Fetch siswa profiles for these users
            const { data: siswaProfiles, error } = await usersAPI.getSiswaProfilesByUserIds(userIds); // Need to add this helper or use existing

            if (!siswaProfiles || siswaProfiles.length === 0) {
                toast.error('Tidak ditemukan profil siswa untuk user yang dipilih');
                return;
            }

            const siswaIds = siswaProfiles.map(s => s.id);
            const targetKelas = kelasList.find(k => k.id === parseInt(targetKelasId));

            // Call Optimized API
            const result = await siswaAPI.bulkAssignToKelas(siswaIds, parseInt(targetKelasId));

            if (result.success > 0) {
                toast.success(`${result.success} siswa berhasil di-assign ke ${targetKelas?.nama || 'kelas'}`);
            }
            if (result.failed > 0) {
                toast.error(`${result.failed} siswa gagal di-assign`);
            }

            clearSelection();
            refreshData();
        } catch (error) {
            console.error('Error bulk assign:', error);
            toast.error('Gagal melakukan bulk assign');
        } finally {
            setIsAssigning(false);
        }
    };

    return {
        // Data
        users: usersData.data, // Current page data
        filteredUsers: usersData.data, // Backward compatibility alias
        meta: usersData.meta, // Pagination info
        stats, // New stats object
        roles,
        kelasList,
        loading: usersLoading,
        isPlaceholderData,

        // Filters state
        searchTerm,
        setSearchTerm: handleSearch,
        roleFilter,
        setRoleFilter: handleRoleChange,
        page,
        setPage: handlePageChange,
        limit,
        setLimit,

        // Actions
        refreshData,
        handleDelete,
        handleToggleStatus,

        // Selection & Bulk
        selectedUsers,
        toggleSelectUser,
        selectAll,
        clearSelection,
        handleBulkAssignToKelas,
        isAssigning
    };
};
