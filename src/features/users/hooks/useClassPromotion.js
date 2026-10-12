import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsAPI } from '@/features/settings/api/settingsAPI';
import dashboardAPI from '@/features/dashboard/api/dashboardAPI';
import { toast } from 'react-hot-toast';

/**
 * Hook for Class Promotion Wizard
 * Handles dependent data fetching and promotion mutation
 */
export const useClassPromotion = (state) => {
    const queryClient = useQueryClient();
    const { sourceYearId, targetYearId, sourceClassId } = state;

    // 1. Fetch Academic Years
    const { data: academicYears = [], isLoading: loadingYears } = useQuery({
        queryKey: ['promotion', 'years'],
        queryFn: settingsAPI.getAllTahunAjaran,
        staleTime: Infinity,
    });

    // 2. Fetch Source Classes (Dependent on Source Year)
    const { data: sourceClasses = [], isLoading: loadingSourceClasses } = useQuery({
        queryKey: ['promotion', 'classes', sourceYearId],
        queryFn: async () => {
            const id = parseInt(sourceYearId, 10);
            if (isNaN(id)) return [];
            return dashboardAPI.getClassesByAcademicYear(id);
        },
        enabled: !!sourceYearId,
    });

    // 3. Fetch Target Classes (Dependent on Target Year)
    const { data: targetClasses = [], isLoading: loadingTargetClasses } = useQuery({
        queryKey: ['promotion', 'classes', targetYearId],
        queryFn: async () => {
            const id = parseInt(targetYearId, 10);
            if (isNaN(id)) return [];
            return dashboardAPI.getClassesByAcademicYear(id);
        },
        enabled: !!targetYearId,
    });

    // 4. Fetch Students (Dependent on Source Class)
    const { data: studentsResponse, isLoading: loadingStudents } = useQuery({
        queryKey: ['promotion', 'students', sourceClassId],
        queryFn: () => dashboardAPI.getAllStudents(1, 1000, '', sourceClassId, 'aktif'),
        enabled: !!sourceClassId,
    });

    const students = studentsResponse?.data || [];

    // 5. Promote Mutation
    const promoteMutation = useMutation({
        mutationFn: async ({ studentIds, targetClassId, status }) => {
            return dashboardAPI.promoteStudents(studentIds, targetClassId, status);
        },
        onSuccess: () => {
            // Invalidate relevant queries
            queryClient.invalidateQueries(['promotion', 'students']); // Source list might change if we filter differently
            queryClient.invalidateQueries(['users', 'students']); // Main student list
            toast.success('Proses berhasil!');
        },
        onError: (error) => {
            console.error('Promotion error:', error);
            toast.error('Gagal memproses data');
        }
    });

    return {
        // Data
        academicYears,
        sourceClasses,
        targetClasses,
        students,

        // Loading States
        loadingYears,
        loadingSourceClasses,
        loadingTargetClasses,
        loadingStudents,

        // Actions
        promoteStudents: promoteMutation.mutateAsync,
        isProcessing: promoteMutation.isPending
    };
};
