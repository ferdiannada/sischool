/**
 * Users API Service
 * Handles user CRUD operations for admin
 * Refactored to use Supabase Client directly
 */

import { supabase } from '../../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Helper to create a temporary client that doesn't persist session
// This allows us to create users (signUp) without logging out the admin
let tempClientInstance = null;
const getTempClient = () => {
    if (tempClientInstance) return tempClientInstance;

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    tempClientInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            storageKey: 'school-ai-temp-auth'
        }
    });
    return tempClientInstance;
};

export const usersAPI = {
    /**
     * Get all users with roles
     */
    /**
     * Get all users with roles (Paginated)
     */
    async getUsers({ page = 1, limit = 10, search = '', role = 'all', isActive = undefined } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            let query = supabase
                .from('users')
                .select(`
                    id,
                    email,
                    full_name,
                    phone,
                    avatar_url,
                    is_active,
                    created_at,
                    user_roles!inner (
                        roles!inner (id, name)
                    )
                `, { count: 'exact' });

            // Apply Filters
            if (search) {
                query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
            }

            if (isActive !== undefined) {
                query = query.eq('is_active', isActive);
            }

            // Role Filter
            if (role && role !== 'all') {
                // Using nested filter syntax: user_roles.roles.name
                // Ensure we handle the nested value correctly
                query = query.eq('user_roles.roles.name', role);
            }

            // Pagination & Sorting
            const { data: users, error, count } = await query
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            // When filtering by role, the !inner join only returns matching
            // user_roles rows (e.g. only 'guru'), hiding other roles the user
            // has (e.g. 'wali_kelas'). Fix: re-fetch ALL roles for these users.
            let allRolesMap = {};
            if (role && role !== 'all' && users?.length > 0) {
                const userIds = users.map(u => u.id);
                const { data: allUserRoles } = await supabase
                    .from('user_roles')
                    .select('user_id, roles!inner (id, name)')
                    .in('user_id', userIds);

                if (allUserRoles) {
                    for (const ur of allUserRoles) {
                        if (!allRolesMap[ur.user_id]) allRolesMap[ur.user_id] = [];
                        if (ur.roles?.name) allRolesMap[ur.user_id].push(ur.roles.name);
                    }
                }
            }

            const formattedUsers = users?.map(user => {
                const userRoles = allRolesMap[user.id]
                    || user.user_roles?.map(ur => ur.roles?.name).filter(Boolean)
                    || [];
                return {
                    id: user.id,
                    email: user.email,
                    name: user.full_name,
                    phone: user.phone,
                    avatarUrl: user.avatar_url,
                    isActive: user.is_active,
                    createdAt: user.created_at,
                    roles: userRoles,
                    primaryRole: userRoles[0] || 'no_role',
                };
            }) || [];


            return {
                data: formattedUsers,
                meta: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages: Math.ceil((count || 0) / limit)
                }
            };

        } catch (error) {
            console.error('Error fetching users:', error);
            // Return empty structure on error to prevent UI crash
            return { data: [], meta: { page, limit, total: 0, totalPages: 0 } };
        }
    },

    /**
     * Get user statistics for a specific role or all users
     */
    async getUserStats(roleFilter = 'all') {
        try {
            // We use a separate query for stats to be accurate
            // Count total, active, and inactive for the specific role
            let query = supabase
                .from('users')
                .select('id, is_active, user_roles!inner(roles!inner(name))');

            if (roleFilter !== 'all') {
                query = query.eq('user_roles.roles.name', roleFilter);
            }

            const { data, error } = await query;
            if (error) throw error;

            const total = data?.length || 0;
            const active = data?.filter(u => u.is_active).length || 0;

            return {
                total,
                active,
                inactive: total - active
            };
        } catch (error) {
            console.error('Error in getUserStats:', error);
            return { total: 0, active: 0, inactive: 0 };
        }
    },

    /**
     * Get all available roles
     */
    async getRoles() {
        const { data: roles, error } = await supabase
            .from('roles')
            .select('id, name, description')
            .order('name');

        if (error) {
            console.error('Error fetching roles:', error);
            return [];
        }

        return roles || [];
    },

    /**
     * Get single user by ID
     */
    async getUserById(userId) {
        const { data: user, error } = await supabase
            .from('users')
            .select(`
                *,
                user_roles (
                    roles (id, name)
                )
            `)
            .eq('id', userId)
            .single();

        if (error) {
            console.error('Error fetching user:', error);
            return null;
        }

        if (!user) return null;

        return {
            id: user.id,
            email: user.email,
            name: user.full_name,
            phone: user.phone,
            avatarUrl: user.avatar_url,
            isActive: user.is_active,
            roles: user.user_roles?.map(ur => ur.roles?.name).filter(Boolean) || [],
        };
    },

    /**
     * Create new user
     */
    /**
     * Helper: Ensure guru record exists
     */
    async ensureGuruRecord(userId) {
        try {
            // Check if exists
            const { data: existing, error } = await supabase
                .from('guru')
                .select('id')
                .eq('user_id', userId);

            if (error && error.code !== 'PGRST116') { // Ignore "no rows" if single not used, but using select returns array
                console.error('Check guru error', error);
            }

            if (!existing || existing.length === 0) {
                // Create guru record
                const { error: insertError } = await supabase
                    .from('guru')
                    .insert({
                        user_id: userId,
                        status: 'aktif',
                        nip: null
                    });

                if (insertError) throw insertError;
            }
            return true;
        } catch (error) {
            console.error('Error ensuring guru record:', error);
            return false;
        }
    },

    /**
     * Create new user
     * Uses Supabase Auth via temporary client to avoid session conflict
     */
    async createUser(userData) {
        const tempClient = getTempClient();

        // 0. Prepare Metadata (Roles)
        // We need to send role data so the trigger doesn't default to 'siswa'
        let metadata = {
            full_name: userData.name,
            avatar_url: userData.avatarUrl || null,
        };

        try {
            const roleIds = Array.isArray(userData.roleIds) ? userData.roleIds : (userData.roleId ? [userData.roleId] : []);

            if (roleIds.length > 0) {
                // Fetch all roles to map IDs to names
                const allRoles = await this.getRoles();
                const assignedRoles = allRoles.filter(r => roleIds.includes(r.id)).map(r => r.name);

                if (assignedRoles.length > 0) {
                    metadata.roles = assignedRoles;
                    metadata.primaryRole = assignedRoles[0];
                }
            }
        } catch (e) {
            console.warn("Failed to prepare role metadata:", e);
        }

        // 1. Create User in Auth System
        const { data: authData, error: authError } = await tempClient.auth.signUp({
            email: userData.email,
            password: userData.password || 'password123', // Default if not provided
            options: {
                data: metadata
            }
        });

        if (authError) {
            // Check if user already exists
            if (authError.message.includes('already registered')) {
                throw new Error('Email sudah terdaftar (Auth)');
            }
            throw new Error(`Gagal membuat user auth: ${authError.message}`);
        }

        const newUserId = authData.user?.id;
        if (!newUserId) {
            throw new Error('Gagal mendapatkan ID user baru');
        }

        // 2. Wait for Public Profile (Trigger creates it)
        // Polling to ensure trigger has finished
        const maxRetries = 10;
        let profileCreated = false;

        for (let i = 0; i < maxRetries; i++) {
            try {
                // Try to fetch the user from public table
                const user = await this.getUserById(newUserId);
                if (user) {
                    profileCreated = true;
                    break;
                }
            } catch (ignore) { }
            // Wait 500ms
            await new Promise(r => setTimeout(r, 500));
        }

        if (!profileCreated) {
            // Fallback: Try to insert manually if trigger failed (though it shouldn't)
            try {
                await supabase.from('users').insert({
                    id: newUserId,
                    email: userData.email,
                    full_name: userData.name,
                    avatar_url: userData.avatarUrl || null,
                });
            } catch (e) {
                console.warn("Manual rollback insert failed or already exists:", e);
            }
        }

        const updateData = {};
        if (userData.phone) updateData.phone = userData.phone;
        if (userData.isActive !== undefined) updateData.is_active = userData.isActive;

        if (Object.keys(updateData).length > 0) {
            try {
                await supabase.from('users').update(updateData).eq('id', newUserId);
            } catch (e) {
                console.warn("Failed to update user profile", e);
            }
        }

        // Return the user object in expected format
        const newUser = {
            id: newUserId,
            email: userData.email,
            full_name: userData.name,
            ...updateData
        };

        // 3. Assign Roles
        // Handle multiple roles or single role
        const roleIds = Array.isArray(userData.roleIds) ? userData.roleIds : (userData.roleId ? [userData.roleId] : []);

        if (roleIds.length > 0) {
            const rolePromises = roleIds.map(async (roleId) => {
                try {
                    // Check if role already assigned to avoid 409 error logging
                    const { data: existingRoles } = await supabase
                        .from('user_roles')
                        .select('id')
                        .eq('user_id', newUserId)
                        .eq('role_id', roleId);

                    if (existingRoles && existingRoles.length > 0) {
                        return; // Already exists
                    }

                    await supabase.from('user_roles').upsert({
                        user_id: newUserId,
                        role_id: roleId,
                    });
                } catch (error) {
                    console.error("Error creating user role:", error);
                }
            });
            await Promise.all(rolePromises);

            // Check for Guru role and create specific record
            const roles = await this.getRoles();
            const guruRole = roles.find(r => r.name === 'guru');

            if (guruRole && roleIds.includes(guruRole.id)) {
                await this.ensureGuruRecord(newUserId);
            }
        }

        // 4. Cleanup: Remove default 'siswa' role if it wasn't requested
        // The backend trigger handles security by defaulting public signups to 'siswa'.
        // Since we are admin creating a privileged user (e.g. guru), we need to revert that default assignment
        // if 'siswa' was not among the requested roles.
        try {
            const allRoles = await this.getRoles();
            const siswaRole = allRoles.find(r => r.name === 'siswa');

            // If we found the siswa role, and it was NOT in the requested roleIds
            if (siswaRole && !roleIds.includes(siswaRole.id)) {
                // Remove it directly to avoid overhead
                await supabase
                    .from('user_roles')
                    .delete()
                    .eq('user_id', newUserId)
                    .eq('role_id', siswaRole.id);
            }
        } catch (cleanupError) {
            console.warn('Failed to cleanup default role:', cleanupError);
        }

        return newUser;
    },

    /**
     * Update user
     */
    async updateUser(userId, userData) {
        const updateData = {};

        if (userData.name !== undefined) updateData.full_name = userData.name;
        if (userData.email !== undefined) updateData.email = userData.email;
        if (userData.phone !== undefined) updateData.phone = userData.phone;
        if (userData.isActive !== undefined) updateData.is_active = userData.isActive;
        if (userData.avatarUrl !== undefined) updateData.avatar_url = userData.avatarUrl;

        const { data, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select();

        if (error) throw error;
        return data?.[0];
    },

    /**
     * Delete user
     */
    async deleteUser(userId) {
        // Cascade delete handled by valid logic in RPC
        try {
            const { error } = await supabase.rpc('delete_user_completely', { p_user_id: userId });
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting user completely:', error);
            // Fallback for older schema versions or if RPC fails
            await supabase.from('users').delete().eq('id', userId);
            return true;
        }
    },

    /**
     * Toggle user active status
     */
    async toggleUserStatus(userId, isActive) {
        return this.updateUser(userId, { isActive });
    },

    /**
     * Assign roles to user (Multi-role support)
     */
    async assignRoles(userId, roleIds) {
        // Ensure roleIds is an array
        const roles = Array.isArray(roleIds) ? roleIds : [roleIds];

        // Remove existing roles first
        await supabase.from('user_roles').delete().eq('user_id', userId);

        // Assign new roles
        if (roles.length > 0) {
            const rolePromises = roles.map(roleId =>
                supabase.from('user_roles').insert({
                    user_id: userId,
                    role_id: roleId,
                })
            );
            await Promise.all(rolePromises);

            // Check for Guru role
            const allRoles = await this.getRoles();
            const guruRole = allRoles.find(r => r.name === 'guru');

            if (guruRole && roles.includes(guruRole.id)) {
                await this.ensureGuruRecord(userId);
            }
        }

        return true;
    },

    /**
     * Add a specific role to a user
     */
    async addRoleToUser(userId, roleName) {
        try {
            // 1. Get role ID
            const roles = await this.getRoles();
            const role = roles.find(r => r.name === roleName);
            if (!role) throw new Error(`Role ${roleName} not found`);

            // 2. Check if user already has role
            const user = await this.getUserById(userId);
            const hasRole = user?.roles?.includes(roleName);
            if (hasRole) return true; // Already has role

            // 3. Assign role
            await supabase.from('user_roles').insert({
                user_id: userId,
                role_id: role.id
            });

            // 4. Specific logic for roles
            if (roleName === 'guru') {
                await this.ensureGuruRecord(userId);
            }

            // 5. Cleanup: If assigning privileged role, remove 'siswa' if exists
            // This fixes legacy users who might have stuck with 'siswa' role due to trigger defaults
            if (['guru', 'wali_kelas', 'admin', 'tu'].includes(roleName)) {
                const siswaRole = roles.find(r => r.name === 'siswa');
                const hasSiswa = user?.roles?.includes('siswa');

                if (siswaRole && hasSiswa) {
                    // We use del directly to avoid infinite recursion or overhead
                    try {
                        await supabase
                            .from('user_roles')
                            .delete()
                            .eq('user_id', userId)
                            .eq('role_id', siswaRole.id);
                    } catch (e) {
                        console.warn("Failed to cleanup siswa role during promotion", e);
                    }
                }
            }

            return true;
        } catch (error) {
            console.error(`Error adding role ${roleName} to user ${userId}:`, error);
            // Don't modify return type to keep consistent, but log error
            return false;
        }
    },

    /**
     * Remove a specific role from a user
     */
    async removeRoleFromUser(userId, roleName) {
        try {
            // 1. Get role ID
            const roles = await this.getRoles();
            const role = roles.find(r => r.name === roleName);
            if (!role) throw new Error(`Role ${roleName} not found`);

            // 2. Delete role assignment
            await supabase
                .from('user_roles')
                .delete()
                .eq('user_id', userId)
                .eq('role_id', role.id);

            // 3. Cleanup specific tables if needed
            if (roleName === 'guru') {
                await supabase.from('guru').delete().eq('user_id', userId);
            }

            return true;
        } catch (error) {
            console.error(`Error removing role ${roleName} from user ${userId}:`, error);
            return false;
        }
    },

    /**
     * Get Guru Profile (Self)
     */
    async getGuruProfile() {
        const { data, error } = await supabase.rpc('get_guru_profile');
        if (error) throw error;
        // Result is an array of objects, but we expect one or none
        return data?.[0] || null;
    },

    /**
     * Update Guru Profile (Self)
     */
    async updateGuruProfile(profileData) {
        // profileData should contain keys matching the RPC params:
        // p_phone, p_alamat, p_pendidikan_terakhir, p_sertifikasi
        const { data, error } = await supabase.rpc('update_guru_profile', {
            p_phone: profileData.phone,
            p_alamat: profileData.alamat,
            p_pendidikan_terakhir: profileData.pendidikanTerakhir,
            p_sertifikasi: profileData.sertifikasi
        });

        return { data, error };
    },

    /**
     * Helper: Get Siswa Profiles by array of User IDs
     * Used for bulk operations
     */
    async getSiswaProfilesByUserIds(userIds) {
        if (!userIds || userIds.length === 0) return [];

        try {
            const { data, error } = await supabase
                .from('siswa')
                .select('id, user_id')
                .in('user_id', userIds);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching siswa profiles by user ids:', error);
            return [];
        }
    },
};

export default usersAPI;
