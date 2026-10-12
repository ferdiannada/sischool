/**
 * Route Configuration
 * Centralized route definitions with lazy loading support
 */
import { lazy } from 'react';

// Lazy load role-specific route bundles
export const AdminRoutes = lazy(() => import('./role/adminRoutes'));
export const GuruRoutes = lazy(() => import('./role/guruRoutes'));
export const WaliKelasRoutes = lazy(() => import('./role/waliKelasRoutes'));
export const KetuaKelasRoutes = lazy(() => import('./role/ketuaKelasRoutes'));
export const SiswaRoutes = lazy(() => import('./role/siswaRoutes'));
export const WaliMuridRoutes = lazy(() => import('./role/waliMuridRoutes'));
export const TuRoutes = lazy(() => import('./role/tuRoutes'));

// Auth page (small, load immediately)
export { default as LoginPage } from '../features/auth/pages/LoginPage';

// Role to route mapping
export const ROLE_ROUTES = {
    admin: '/admin',
    guru: '/guru',
    wali_kelas: '/wali-kelas',
    ketua_kelas: '/ketua-kelas',
    siswa: '/siswa',
    wali_murid: '/wali-murid',
    tu: '/tu',
};

// Role to dashboard path mapping
export const ROLE_DASHBOARD = {
    admin: '/admin/dashboard',
    guru: '/guru/dashboard',
    wali_kelas: '/wali-kelas/dashboard',
    ketua_kelas: '/ketua-kelas/dashboard',
    siswa: '/siswa/dashboard',
    wali_murid: '/wali-murid/dashboard',
    tu: '/tu/dashboard',
};

// Get dashboard path for a role
export const getDashboardPath = (role) => {
    if (!role || role === 'authenticated' || role === 'no_role') {
        // Return a path that is NOT /dashboard to prevent recursion
        return '/login';
    }
    return ROLE_DASHBOARD[role] || '/login';
};
