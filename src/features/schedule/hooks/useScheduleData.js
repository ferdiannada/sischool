import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleAPI } from '@/features/schedule/api/scheduleAPI';
import { masterDataAPI } from '@/features/master-data/api/masterDataAPI';
import { toast } from 'react-hot-toast';

/**
 * Hook for managing Schedule Data
 * Handles fetching of schedules, reference data, and CRUD operations
 */
export const useScheduleData = (filters = {}) => {
    const queryClient = useQueryClient();

    // 1. Reference Data (Stale after 5 minutes)
    const { data: kelasList = [], isLoading: loadingKelas } = useQuery({
        queryKey: ['schedule', 'refs', 'kelas'],
        queryFn: scheduleAPI.getKelasList,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const { data: mapelList = [], isLoading: loadingMapel } = useQuery({
        queryKey: ['schedule', 'refs', 'mapel'],
        queryFn: scheduleAPI.getMapelList,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const { data: guruList = [], isLoading: loadingGuru } = useQuery({
        queryKey: ['schedule', 'refs', 'guru'],
        queryFn: scheduleAPI.getGuruList,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const { data: jamPelajaran = [], isLoading: loadingJam } = useQuery({
        queryKey: ['schedule', 'refs', 'jam'],
        queryFn: masterDataAPI.getJamPelajaran,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    // 2. Schedule Data (Stale after 30 seconds)
    const { data: schedules = [], isLoading: loadingSchedules } = useQuery({
        queryKey: ['schedules', filters],
        queryFn: scheduleAPI.getSchedules,
        staleTime: 30 * 1000,
    });

    // 3. Mutations
    const createMutation = useMutation({
        mutationFn: scheduleAPI.createSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries(['schedules']);
            toast.success('Jadwal berhasil ditambahkan');
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal menambahkan jadwal');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => scheduleAPI.updateSchedule(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['schedules']);
            toast.success('Jadwal berhasil diupdate');
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal update jadwal');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: scheduleAPI.deleteSchedule,
        onSuccess: () => {
            queryClient.invalidateQueries(['schedules']);
            toast.success('Jadwal berhasil dihapus');
        },
        onError: (error) => {
            toast.error(error.message || 'Gagal menghapus jadwal');
        }
    });

    return {
        // Data
        kelasList,
        mapelList,
        guruList,
        jamPelajaran,
        schedules,

        // Loading States
        isLoading: loadingKelas || loadingMapel || loadingGuru || loadingJam || loadingSchedules,
        isLoadingRefs: loadingKelas || loadingMapel || loadingGuru || loadingJam,
        isLoadingSchedules: loadingSchedules,

        // Actions
        createSchedule: createMutation.mutateAsync,
        updateSchedule: updateMutation.mutateAsync,
        deleteSchedule: deleteMutation.mutateAsync,

        // State
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
};
