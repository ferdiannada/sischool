import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';

export const useClassStudents = (userId) => {
    return useQuery({
        queryKey: ['class-students', userId],
        queryFn: () => dashboardAPI.getWaliKelasClassStudents(userId),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });
};

export const useAssignKetuaKelas = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ kelasId, studentUserId }) => dashboardAPI.assignKetuaKelas(kelasId, studentUserId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['class-students'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'wali-kelas'] });
        },
    });
};

export const useSearchWaliCandidates = (term) => {
    return useQuery({
        queryKey: ['wali-candidates', term],
        queryFn: () => dashboardAPI.searchWaliCandidates(term),
        enabled: !!term && term.length >= 2,
        staleTime: 1 * 60 * 1000,
    });
};

export const useAssignWali = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ studentId, userId, hubungan, newWaliData }) => {
            if (newWaliData) {
                return dashboardAPI.createAndAssignWali(studentId, {
                    name: newWaliData.name,
                    email: newWaliData.email,
                    phone: newWaliData.phone,
                    hubungan: newWaliData.hubungan
                });
            } else {
                return dashboardAPI.assignWaliToStudent(studentId, userId, hubungan);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['class-students'] });
        },
    });
};
