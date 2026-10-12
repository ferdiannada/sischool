import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';
import { toast } from 'react-hot-toast';

/**
 * Hook for Notifications with Optimistic Updates
 * 
 * @param {string} userId - Current User ID
 */
export const useNotifications = (userId) => {
    const queryClient = useQueryClient();
    const queryKey = ['notifications', userId];

    const { data: notifications = [], isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            if (!userId) return [];
            const response = await dashboardAPI.getNotifications({ userId });
            return response.data || [];
        },
        enabled: !!userId,
        // Poll every minute for new notifications
        refetchInterval: 60 * 1000,
    });

    const markReadMutation = useMutation({
        mutationFn: dashboardAPI.markAsRead,
        onMutate: async (notifId) => {
            await queryClient.cancelQueries({ queryKey });

            const previousNotifs = queryClient.getQueryData(queryKey);

            queryClient.setQueryData(queryKey, (old) =>
                old ? old.map(n => n.id === notifId ? { ...n, is_read: true } : n) : []
            );

            return { previousNotifs };
        },
        onError: (err, notifId, context) => {
            queryClient.setQueryData(queryKey, context.previousNotifs);
            toast.error('Gagal menandai notifikasi sebagai dibaca');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => dashboardAPI.markAllAsRead(userId),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey });

            const previousNotifs = queryClient.getQueryData(queryKey);

            queryClient.setQueryData(queryKey, (old) =>
                old ? old.map(n => ({ ...n, is_read: true })) : []
            );

            return { previousNotifs };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(queryKey, context.previousNotifs);
            toast.error('Gagal menandai semua sebagai dibaca');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey });
        }
    });

    return {
        notifications,
        isLoading,
        markAsRead: markReadMutation.mutate,
        markAllAsRead: markAllReadMutation.mutate,
    };
};
