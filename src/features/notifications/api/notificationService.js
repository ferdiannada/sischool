import { supabase } from '@/lib/supabase';

/**
 * Notification Service - Handles notification operations
 */
export const notificationService = {
    /**
     * Get notifications for current user
     */
    async getNotifications({ userId, unreadOnly = false, page = 1, limit = 20 } = {}) {
        let query = supabase
            .from('notification_recipients')
            .select(`
        *,
        notification:notifications (
          id,
          title,
          message,
          type,
          category,
          priority,
          data,
          created_at,
          creator:users!notifications_created_by_fkey (full_name)
        )
      `, { count: 'exact' })
            .eq('user_id', userId);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await query
            .range(from, to)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Flatten data for frontend consumption
        const flattenedData = data.map(item => ({
            ...item,
            ...item.notification, // Spread notification details (title, message, etc.)
            notification_id: item.notification?.id,
            // Keep recipient id as the main id
            id: item.id
        }));

        return { data: flattenedData, count, page, limit };
    },

    /**
     * Get unread count
     */
    async getUnreadCount(userId) {
        const { count, error } = await supabase
            .from('notification_recipients')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
        return count || 0;
    },

    /**
     * Mark notification as read
     */
    async markAsRead(notificationRecipientId) {
        const { data, error } = await supabase
            .from('notification_recipients')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('id', notificationRecipientId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Mark all as read for a user
     */
    async markAllAsRead(userId) {
        const { error } = await supabase
            .from('notification_recipients')
            .update({
                is_read: true,
                read_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;
    },

    /**
     * Send notification to specific users
     */
    async sendNotification({ title, message, type, priority = 'normal', data, createdBy, recipientIds }) {
        // Create notification
        const { data: notification, error: notifError } = await supabase
            .from('notifications')
            .insert({
                title,
                message,
                type,
                priority,
                data,
                created_by: createdBy,
            })
            .select()
            .single();

        if (notifError) throw notifError;

        // Create recipients
        const recipients = recipientIds.map(userId => ({
            notification_id: notification.id,
            user_id: userId,
        }));

        const { error: recipientError } = await supabase
            .from('notification_recipients')
            .insert(recipients);

        if (recipientError) throw recipientError;

        return notification;
    },

    /**
     * Send notification to users by role
     */
    async sendToRole({ title, message, type, priority = 'normal', data, createdBy, roleName }) {
        // Get all users with the specified role
        const { data: userRoles, error: roleError } = await supabase
            .from('user_roles')
            .select(`
        user_id,
        roles!inner (name)
      `)
            .eq('roles.name', roleName);

        if (roleError) throw roleError;

        const recipientIds = userRoles.map(ur => ur.user_id);

        if (recipientIds.length === 0) {
            return null;
        }

        return this.sendNotification({
            title,
            message,
            type,
            priority,
            data,
            createdBy,
            recipientIds,
        });
    },

    /**
     * Subscribe to real-time notifications
     */
    subscribeToNotifications(userId, callback) {
        return supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notification_recipients',
                    filter: `user_id=eq.${userId}`,
                },
                callback
            )
            .subscribe();
    },

    /**
     * Unsubscribe from notifications channel
     */
    unsubscribe(channel) {
        return supabase.removeChannel(channel);
    },
};

export default notificationService;
