/**
 * Auth Service - Handles authentication using Supabase Native Auth
 */

import { supabase } from '../../../lib/supabase';

export const authService = {
    /**
     * Sign in with email and password
     */
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            const user = await this.enrichUser(data.user);
            return { user, session: data.session };

        } catch (error) {
            console.error('Sign in error:', error);
            throw new Error(error.message || 'Login failed');
        }
    },

    /**
     * Sign out
     */
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Sign out error:', error);
        localStorage.removeItem('school_ai_user_cache');
    },

    /**
     * Get current user
     */
    async getCurrentUser() {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return null;
        return await this.enrichUser(session.user);
    },

    /**
     * Check if user is authenticated
     */
    async isAuthenticated() {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    },

    /**
     * Get session token
     */
    async getToken() {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token || null;
    },

    /**
     * Helper to add role/profile info to the auth user object
     */
    async enrichUser(authUser) {
        if (!authUser) return null;

        // metadata from jwt
        const metadata = authUser.user_metadata || {};
        let roles = metadata.roles || [];

        // Always fetch roles from DB to ensure they are up to date
        try {
            const { data: userRoles, error } = await supabase
                .from('user_roles')
                .select('roles(name)')
                .eq('user_id', authUser.id);

            if (!error && userRoles && userRoles.length > 0) {
                const dbRoles = userRoles.map(ur => ur.roles?.name).filter(Boolean);
                if (dbRoles.length > 0) {
                    roles = dbRoles;
                }
            }
        } catch (e) {
            console.warn('Failed to fetch roles from DB:', e.message);
        }

        if (roles.length === 0) roles = ['authenticated'];

        return {
            id: authUser.id,
            email: authUser.email,
            full_name: metadata.full_name || authUser.email,
            avatar_url: metadata.avatar_url,
            roles: roles,
            role: roles[0] || 'no_role', // Compatibility
            primaryRole: roles[0] || 'no_role',
        };
    },

    /**
     * Update current user's password
     */
    async updatePassword(newPassword) {
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Update password error:', error);
            throw new Error(error.message || 'Gagal memperbarui password');
        }
    }
};

export default authService;

