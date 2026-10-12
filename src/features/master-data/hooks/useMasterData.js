import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { masterDataAPI } from '@/features/master-data/api/masterDataAPI';
import { usersAPI } from '@/features/users/api/usersAPI';
import { toast } from 'react-hot-toast';

// --- CLASSES ---
export const useClasses = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['master', 'classes'],
        queryFn: masterDataAPI.getKelas,
    });

    const createMutation = useMutation({
        mutationFn: async (data) => {
            await masterDataAPI.createKelas(data);
            if (data.waliKelasId) {
                await usersAPI.addRoleToUser(data.waliKelasId, 'wali_kelas');
            }
        },
        onSuccess: (responseData, variables) => {
            queryClient.invalidateQueries({ queryKey: ['master', 'classes'] });
            if (variables.waliKelasId) {
                queryClient.invalidateQueries({ queryKey: ['users'] });
            }
            toast.success('Kelas berhasil ditambahkan');
        },
        onError: () => toast.error('Gagal menambahkan kelas'),
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }) => {
            await masterDataAPI.updateKelas(id, data);
            if (data.waliKelasId) {
                await usersAPI.addRoleToUser(data.waliKelasId, 'wali_kelas');
            }
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['master', 'classes'] });
            if (variables.data.waliKelasId) {
                queryClient.invalidateQueries({ queryKey: ['users'] });
            }
            toast.success('Kelas berhasil diupdate');
        },
        onError: () => toast.error('Gagal mengupdate kelas'),
    });

    const deleteMutation = useMutation({
        mutationFn: masterDataAPI.deleteKelas,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master', 'classes'] });
            toast.success('Kelas berhasil dihapus');
        },
        onError: () => toast.error('Gagal menghapus kelas'),
    });

    const unassignWaliKelasMutation = useMutation({
        mutationFn: async (item) => {
            await masterDataAPI.updateKelas(item.id, { waliKelasId: null });
            if (item.waliKelasId) {
                await usersAPI.removeRoleFromUser(item.waliKelasId, 'wali_kelas');
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master', 'classes'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Wali kelas berhasil dilepas');
        },
        onError: () => toast.error('Gagal melepas wali kelas'),
    });

    return {
        data: query.data || [],
        isLoading: query.isLoading,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
        unassignWaliKelas: unassignWaliKelasMutation.mutateAsync,
    };
};

// --- SUBJECTS (Mata Pelajaran) ---
export const useSubjects = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['master', 'subjects'],
        queryFn: masterDataAPI.getMataPelajaran,
    });

    const createMutation = useMutation({
        mutationFn: masterDataAPI.createMataPelajaran,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master', 'subjects'] });
            toast.success('Mata pelajaran berhasil ditambahkan');
        },
        onError: () => toast.error('Gagal menambahkan mata pelajaran'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => masterDataAPI.updateMataPelajaran(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master', 'subjects'] });
            toast.success('Mata pelajaran berhasil diupdate');
        },
        onError: () => toast.error('Gagal mengupdate mata pelajaran'),
    });

    const deleteMutation = useMutation({
        mutationFn: masterDataAPI.deleteMataPelajaran,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master', 'subjects'] });
            toast.success('Mata pelajaran berhasil dihapus');
        },
        onError: () => toast.error('Gagal menghapus mata pelajaran'),
    });

    return {
        data: query.data || [],
        isLoading: query.isLoading,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
    };
};

// --- ACADEMIC YEARS (Tahun Ajaran) ---
export const useAcademicYears = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['master', 'years'],
        queryFn: masterDataAPI.getTahunAjaran,
    });

    const createMutation = useMutation({
        mutationFn: masterDataAPI.createTahunAjaran,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master', 'years'] });
            toast.success('Tahun ajaran berhasil ditambahkan');
        },
        onError: () => toast.error('Gagal menambahkan tahun ajaran'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => masterDataAPI.updateTahunAjaran(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master', 'years'] });
            toast.success('Tahun ajaran berhasil diupdate');
        },
        onError: () => toast.error('Gagal mengupdate tahun ajaran'),
    });

    const setActiveMutation = useMutation({
        mutationFn: masterDataAPI.setActiveTahunAjaran,
        onSuccess: (data, id) => {
            queryClient.invalidateQueries({ queryKey: ['master', 'years'] });
            toast.success('Tahun ajaran aktif berhasil diubah');
        },
        onError: () => toast.error('Gagal mengubah tahun ajaran aktif'),
    });

    const deleteMutation = useMutation({
        mutationFn: masterDataAPI.deleteTahunAjaran,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master', 'years'] });
            toast.success('Tahun ajaran berhasil dihapus');
        },
        onError: () => toast.error('Gagal menghapus tahun ajaran'),
    });

    return {
        data: query.data || [],
        isLoading: query.isLoading,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        setActive: setActiveMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
    };
};

// --- MAJORS (Jurusan) ---
export const useMajors = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['master', 'majors'],
        queryFn: masterDataAPI.getJurusan,
    });

    const createMutation = useMutation({
        mutationFn: masterDataAPI.createJurusan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master', 'majors'] });
            toast.success('Jurusan berhasil ditambahkan');
        },
        onError: () => toast.error('Gagal menambahkan jurusan'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => masterDataAPI.updateJurusan(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master', 'majors'] });
            toast.success('Jurusan berhasil diupdate');
        },
        onError: () => toast.error('Gagal mengupdate jurusan'),
    });

    const deleteMutation = useMutation({
        mutationFn: masterDataAPI.deleteJurusan,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master', 'majors'] });
            toast.success('Jurusan berhasil dihapus');
        },
        onError: () => toast.error('Gagal menghapus jurusan'),
    });

    return {
        data: query.data || [],
        isLoading: query.isLoading,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
    };
};

// --- TIME SLOTS (Jam Pelajaran) ---
export const useTimeSlots = () => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['master', 'timeslots'],
        queryFn: masterDataAPI.getJamPelajaran,
    });

    const createMutation = useMutation({
        mutationFn: masterDataAPI.createJamPelajaran,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master', 'timeslots'] });
            toast.success('Jam pelajaran berhasil ditambahkan');
        },
        onError: () => toast.error('Gagal menambahkan jam pelajaran'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => masterDataAPI.updateJamPelajaran(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master', 'timeslots'] });
            toast.success('Jam pelajaran berhasil diupdate');
        },
        onError: () => toast.error('Gagal mengupdate jam pelajaran'),
    });

    const deleteMutation = useMutation({
        mutationFn: masterDataAPI.deleteJamPelajaran,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['master', 'timeslots'] });
            toast.success('Jam pelajaran berhasil dihapus');
        },
        onError: () => toast.error('Gagal menghapus jam pelajaran'),
    });

    return {
        data: query.data || [],
        isLoading: query.isLoading,
        create: createMutation.mutateAsync,
        update: updateMutation.mutateAsync,
        remove: deleteMutation.mutateAsync,
    };
};

// --- HELPERS (Teachers) ---
export const useTeachers = () => {
    return useQuery({
        queryKey: ['users', 'teachers'],
        queryFn: masterDataAPI.getGuruList,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
