import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import usersAPI from '@/features/users/api/usersAPI';
import { toast } from 'react-hot-toast';

export const useGuruProfile = () => {
    return useQuery({
        queryKey: ['guru', 'profile'],
        queryFn: async () => {
            const data = await usersAPI.getGuruProfile();
            return data;
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useUpdateGuruProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data) => {
            return await usersAPI.updateGuruProfile(data);
        },
        onSuccess: () => {
            toast.success('Profil berhasil diperbarui');
            queryClient.invalidateQueries({ queryKey: ['guru', 'profile'] });
        },
        onError: (error) => {
            console.error('Failed to update profile:', error);
            toast.error('Gagal memperbarui profil');
        }
    });
};
