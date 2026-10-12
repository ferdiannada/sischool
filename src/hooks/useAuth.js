import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getDashboardPath } from '../routes/routeConfig';

/**
 * useAuth Hook
 * Provides convenient access to authentication state and actions
 */
const useAuth = () => {
    const navigate = useNavigate();

    // Store state
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const token = useAuthStore((state) => state.token);

    // Store actions
    const storeLogin = useAuthStore((state) => state.login);
    const storeLogout = useAuthStore((state) => state.logout);
    const updateLastActivity = useAuthStore((state) => state.updateLastActivity);
    const checkSession = useAuthStore((state) => state.checkSession);

    // Store helpers
    const hasPermission = useAuthStore((state) => state.hasPermission);
    const getRole = useAuthStore((state) => state.getRole);
    const getRoleLabel = useAuthStore((state) => state.getRoleLabel);

    /**
     * Login and redirect to dashboard
     */
    const login = useCallback((userData, authToken = null) => {
        storeLogin(userData, authToken);
        const dashboardPath = getDashboardPath(userData.role);
        navigate(dashboardPath);
    }, [storeLogin, navigate]);

    /**
     * Logout and redirect to login page
     */
    const logout = useCallback(() => {
        storeLogout();
        navigate('/login');
    }, [storeLogout, navigate]);

    /**
     * Check if user has specific role
     */
    const hasRole = useCallback((role) => {
        return user?.role === role;
    }, [user]);

    /**
     * Check if user has any of the specified roles
     */
    const hasAnyRole = useCallback((roles) => {
        return roles.includes(user?.role);
    }, [user]);

    /**
     * Update activity timestamp on user interaction
     */
    useEffect(() => {
        if (!isAuthenticated) return;

        const handleActivity = () => {
            updateLastActivity();
        };

        // Track user activity
        window.addEventListener('click', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('scroll', handleActivity);

        return () => {
            window.removeEventListener('click', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [isAuthenticated, updateLastActivity]);

    /**
     * Check session periodically
     */
    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(() => {
            const isValid = checkSession();
            if (!isValid) {
                navigate('/login');
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [isAuthenticated, checkSession, navigate]);

    return {
        // State
        user,
        isAuthenticated,
        token,
        role: getRole(),
        roleLabel: getRoleLabel(),

        // Actions
        login,
        logout,

        // Helpers
        hasRole,
        hasAnyRole,
        hasPermission,
    };
};

export { useAuth };
