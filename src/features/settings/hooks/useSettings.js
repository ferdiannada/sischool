import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '@/features/settings/api/settingsAPI';
import { toast } from 'react-hot-toast';

/**
 * Hook for System Settings
 * Handles School Info, Notifications, and Academic Years
 */
export const useSettings = () => {
    const queryClient = useQueryClient();

    // --- Queries ---

    // 1. School Info
    const { data: schoolInfo, isLoading: loadingInfo } = useQuery({
        queryKey: ['settings', 'schoolInfo'],
        queryFn: settingsAPI.getSchoolInfo,
        staleTime: Infinity, // Rarely changes
    });

    // 2. Notifications
    const { data: notifications, isLoading: loadingNotifs } = useQuery({
        queryKey: ['settings', 'notifications'],
        queryFn: settingsAPI.getNotifications,
    });

    // 3. Academic Years
    const { data: tahunAjaranList = [], isLoading: loadingYears } = useQuery({
        queryKey: ['settings', 'tahunAjaran'],
        queryFn: settingsAPI.getAllTahunAjaran,
    });

    // 4. Active Academic Year
    const { data: activeTahunAjaran, isLoading: loadingActiveYear } = useQuery({
        queryKey: ['settings', 'activeTahunAjaran'],
        queryFn: settingsAPI.getActiveTahunAjaran,
    });


    // --- Mutations ---

    // 1. Update School Info
    const updateInfoMutation = useMutation({
        mutationFn: async ({ info, logoFile }) => {
            let logoUrl = info.logo;

            // Upload logo if provided
            if (logoFile) {
                logoUrl = await settingsAPI.uploadLogo(logoFile);
            }

            const updatedInfo = { ...info, logo: logoUrl };
            await settingsAPI.updateSchoolInfo(updatedInfo);
            return updatedInfo;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['settings', 'schoolInfo'], data);
            toast.success('Informasi sekolah berhasil disimpan');
        },
        onError: (error) => {
            console.error(error);
            toast.error('Gagal menyimpan informasi sekolah');
        }
    });

    // 2. Update Notifications
    const updateNotifsMutation = useMutation({
        mutationFn: async (newSettings) => {
            const success = settingsAPI.updateNotifications(newSettings);
            if (!success) throw new Error('Failed');
            return newSettings;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(['settings', 'notifications'], data);
            toast.success('Pengaturan notifikasi berhasil disimpan');
        },
        onError: () => {
            toast.error('Gagal menyimpan notifikasi');
        }
    });

    // 3. Set Active Academic Year
    const setActiveYearMutation = useMutation({
        mutationFn: settingsAPI.setActiveTahunAjaran,
        onSuccess: () => {
            queryClient.invalidateQueries(['settings', 'tahunAjaran']);
            queryClient.invalidateQueries(['settings', 'activeTahunAjaran']);
            toast.success('Tahun ajaran aktif berhasil diubah');
        },
        onError: () => {
            toast.error('Gagal mengubah tahun ajaran');
        }
    });

    return {
        // Data
        schoolInfo,
        notifications,
        tahunAjaranList,
        activeTahunAjaran,

        // Loading States
        isLoading: loadingInfo || loadingNotifs || loadingYears || loadingActiveYear,

        // Actions
        updateSchoolInfo: updateInfoMutation.mutateAsync,
        isUpdatingInfo: updateInfoMutation.isPending,

        updateNotifications: updateNotifsMutation.mutateAsync,
        isUpdatingNotifs: updateNotifsMutation.isPending,

        setActiveTahunAjaran: setActiveYearMutation.mutateAsync,
        isUpdatingYear: setActiveYearMutation.isPending,
    };
};
