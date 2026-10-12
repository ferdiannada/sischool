import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getDashboardPath } from './routeConfig';
import { LoadingScreen } from '../components/ui/LoadingScreen';

/**
 * ProtectedRoute Component
 * Guards routes based on authentication and role permissions
 * Supports multi-role users with activeRole switching
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, isAuthenticated } = useAuthStore();
    const activeRole = useAuthStore((state) => state.activeRole);
    const isSessionInitialized = useAuthStore((state) => state.isSessionInitialized);

    // Wait until session has been verified before making auth decisions
    if (!isSessionInitialized) {
        return <LoadingScreen message="Memverifikasi sesi..." />;
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check role permissions with multi-role support
    const userRoles = user?.roles || (user?.role ? [user.role] : []);
    const hasPermission = allowedRoles
        ? allowedRoles.some(role => userRoles.includes(role))
        : true;

    if (allowedRoles && !hasPermission) {
        // Redirect to user's own dashboard based on activeRole
        const redirectRole = activeRole || user?.role;
        return <Navigate to={getDashboardPath(redirectRole)} replace />;
    }

    return children;
};

/**
 * PublicRoute Component
 * Redirects authenticated users to their dashboard (based on activeRole)
 */
const PublicRoute = ({ children }) => {
    const { user, isAuthenticated } = useAuthStore();
    const activeRole = useAuthStore((state) => state.activeRole);
    const isSessionInitialized = useAuthStore((state) => state.isSessionInitialized);

    // Wait until session has been verified before making redirect decisions
    if (!isSessionInitialized) {
        return <LoadingScreen message="Memverifikasi sesi..." />;
    }

    if (isAuthenticated) {
        const redirectRole = activeRole || user?.role;
        const dashboardPath = getDashboardPath(redirectRole);

        // ONLY redirect if the target path is NOT /login to prevent infinite redirect loops
        if (dashboardPath && dashboardPath !== '/login') {
            return <Navigate to={dashboardPath} replace />;
        }
    }

    return children;
};

export { ProtectedRoute, PublicRoute };
