import { supabase } from '@/lib/supabase';

/**
 * Users Service - Handles user profile and role operations
 */
export const usersService = {
    /**
     * Get user profile with roles
     */
    async getUserProfile(userId) {
        const { data, error } = await supabase
            .from('users')
            .select(`
        *,
        user_roles (
          role_id,
          roles (name, description)
        )
      `)
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get all users (admin only)
     */
    async getUsers({ page = 1, limit = 20, search = '', role = '' } = {}) {
        let query = supabase
            .from('users')
            .select(`
        *,
        user_roles (
          role_id,
          roles (name)
        )
      `, { count: 'exact' });

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await query
            .range(from, to)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, count, page, limit };
    },

    /**
     * Create user profile
     */
    async createUser(userData) {
        const { data, error } = await supabase
            .from('users')
            .insert(userData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Update user profile
     */
    async updateUser(userId, updates) {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Assign role to user
     */
    async assignRole(userId, roleId) {
        const { data, error } = await supabase
            .from('user_roles')
            .insert({ user_id: userId, role_id: roleId })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Remove role from user
     */
    async removeRole(userId, roleId) {
        const { error } = await supabase
            .from('user_roles')
            .delete()
            .match({ user_id: userId, role_id: roleId });

        if (error) throw error;
    },

    /**
     * Get all roles
     */
    async getRoles() {
        const { data, error } = await supabase
            .from('roles')
            .select('*')
            .order('name');

        if (error) throw error;
        return data;
    },
};

export default usersService;
