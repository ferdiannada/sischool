import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Role permissions configuration
 */
const ROLE_PERMISSIONS = {
    admin: ['manage_users', 'manage_schedule', 'view_reports', 'manage_master_data', 'system_settings'],
    guru: ['input_attendance', 'view_schedule', 'view_class_recap'],
    wali_kelas: ['monitor_attendance', 'view_class_reports', 'view_students'],
    ketua_kelas: ['input_attendance', 'view_schedule', 'view_classmates'],
    siswa: ['view_schedule', 'view_attendance_history'],
    wali_murid: ['view_child_profile', 'view_child_attendance', 'receive_notifications'],
};

/**
 * Session configuration
 */
const SESSION_CONFIG = {
    // Session timeout in milliseconds (30 minutes)
    TIMEOUT_MS: 30 * 60 * 1000,
    // Storage key
    STORAGE_KEY: 'sischool-auth',
};

/**
 * Role labels for display
 */
const ROLE_LABELS = {
    admin: 'Administrator',
    guru: 'Guru',
    wali_kelas: 'Wali Kelas',
    ketua_kelas: 'Ketua Kelas',
    siswa: 'Siswa',
    wali_murid: 'Wali Murid',
    tu: 'Tata Usaha',
};

/**
 * Auth Store
 * Handles authentication state, user data, and session management
 * Supports multi-role users with role switching
 */
export const useAuthStore = create(
    persist(
        (set, get) => ({
            // State
            user: null,
            isAuthenticated: false,
            isSessionInitialized: false, // Not persisted — always false until App.jsx verifies session
            lastActivity: null,
            token: null,
            activeRole: null, // Currently active role for multi-role users

            // Actions
            login: (userData, token = null) => {
                // Determine initial active role (prioritize ketua_kelas if exists, else first role)
                const roles = userData?.roles || (userData?.role ? [userData.role] : []);
                const initialRole = roles.includes('ketua_kelas') ? 'ketua_kelas'
                    : roles.includes('siswa') ? 'siswa'
                        : roles[0] || null;

                set({
                    user: userData,
                    isAuthenticated: true,
                    lastActivity: Date.now(),
                    token,
                    activeRole: initialRole,
                });
            },

            logout: () => {
                set({
                    user: null,
                    isAuthenticated: false,
                    lastActivity: null,
                    token: null,
                    activeRole: null,
                });
            },

            /**
             * Switch to a different role (for multi-role users)
             */
            switchRole: (role) => {
                const { user } = get();
                const roles = user?.roles || (user?.role ? [user.role] : []);
                if (roles.includes(role)) {
                    set({ activeRole: role });
                    return true;
                }
                return false;
            },

            updateLastActivity: () => {
                set({ lastActivity: Date.now() });
            },

            setSessionInitialized: (value = true) => {
                set({ isSessionInitialized: value });
            },

            updateUser: (userData) => {
                set((state) => ({
                    user: { ...state.user, ...userData },
                }));
            },

            updateToken: (token) => {
                set({ token });
            },

            /**
             * Sync session from Supabase (used in auth listener)
             */
            syncSession: (session, userData = null) => {
                if (session) {
                    const roles = userData?.roles || (userData?.role ? [userData.role] : session.user?.user_metadata?.roles || []);
                    const currentActiveRole = get().activeRole;

                    // Keep current active role if it's still valid, otherwise re-initialize
                    const newActiveRole = roles.includes(currentActiveRole)
                        ? currentActiveRole
                        : (roles.includes('ketua_kelas') ? 'ketua_kelas' : (roles.includes('siswa') ? 'siswa' : (roles[0] || null)));

                    set({
                        user: userData || get().user || session.user,
                        isAuthenticated: true,
                        token: session.access_token,
                        lastActivity: Date.now(),
                        activeRole: newActiveRole
                    });
                } else {
                    get().logout();
                }
            },

            // Getters / Helpers

            /**
             * Get all roles for current user
             */
            getAllRoles: () => {
                const { user } = get();
                return user?.roles || (user?.role ? [user.role] : []);
            },

            /**
             * Check if user has multiple roles
             */
            hasMultipleRoles: () => {
                const { getAllRoles } = get();
                return getAllRoles().length > 1;
            },

            hasPermission: (permission) => {
                const { activeRole, user } = get();
                const role = activeRole || user?.role;
                if (!role) return false;
                const permissions = ROLE_PERMISSIONS[role] || [];
                return permissions.includes(permission);
            },

            hasAnyPermission: (permissions) => {
                const { hasPermission } = get();
                return permissions.some((p) => hasPermission(p));
            },

            hasAllPermissions: (permissions) => {
                const { hasPermission } = get();
                return permissions.every((p) => hasPermission(p));
            },

            isSessionExpired: () => {
                const { lastActivity, isAuthenticated } = get();
                if (!isAuthenticated || !lastActivity) return false;
                return Date.now() - lastActivity > SESSION_CONFIG.TIMEOUT_MS;
            },

            checkSession: () => {
                const { isSessionExpired, logout } = get();
                if (isSessionExpired()) {
                    logout();
                    return false;
                }
                return true;
            },

            /**
             * Get currently active role
             */
            getRole: () => {
                const { activeRole, user } = get();
                return activeRole || user?.role || null;
            },

            /**
             * Get label for currently active role
             */
            getRoleLabel: () => {
                const { getRole } = get();
                const role = getRole();
                return ROLE_LABELS[role] || 'Guest';
            },
        }),
        {
            name: SESSION_CONFIG.STORAGE_KEY,
            storage: createJSONStorage(() => localStorage),
            // Only persist these fields
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                token: state.token,
                lastActivity: state.lastActivity,
                activeRole: state.activeRole, // Persist active role
            }),
        }
    )
);

export default useAuthStore;
export { ROLE_PERMISSIONS, SESSION_CONFIG };
