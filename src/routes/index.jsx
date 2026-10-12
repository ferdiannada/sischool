import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';
import {
    AdminRoutes,
    GuruRoutes,
    WaliKelasRoutes,
    KetuaKelasRoutes,
    SiswaRoutes,
    WaliMuridRoutes,
    TuRoutes,
    LoginPage,
} from './routeConfig';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ErrorBoundary } from '../components/ErrorBoundary';
import useAuthStore from '../store/authStore';
import { getDashboardPath } from './routeConfig';

/**
 * DashboardRedirect
 * Redirects /dashboard to role-specific dashboard.
 * If roles are not yet loaded, shows loading.
 */
const DashboardRedirect = () => {
    const { activeRole, user, isAuthenticated } = useAuthStore();

    // Fallback to role or primaryRole if activeRole is null
    const role = activeRole || user?.role || user?.primaryRole;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!role) {
        // Roles might still be syncing from Supabase
        return <LoadingScreen message="Menyiapkan dashboard..." />;
    }

    return <Navigate to={getDashboardPath(role)} replace />;
};

/**
 * AppRoutes Component
 * Main routing configuration with lazy loading and error boundaries
 */
const AppRoutes = () => {
    return (
        <BrowserRouter>
            <ErrorBoundary>
                <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                        {/* Public Routes */}
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <LoginPage />
                                </PublicRoute>
                            }
                        />

                        {/* Admin Routes - Lazy Loaded */}
                        <Route
                            path="/admin/*"
                            element={
                                <ProtectedRoute allowedRoles={['admin']}>
                                    <AdminRoutes />
                                </ProtectedRoute>
                            }
                        />

                        {/* Guru Routes - Lazy Loaded */}
                        <Route
                            path="/guru/*"
                            element={
                                <ProtectedRoute allowedRoles={['guru']}>
                                    <GuruRoutes />
                                </ProtectedRoute>
                            }
                        />

                        {/* Wali Kelas Routes - Lazy Loaded */}
                        <Route
                            path="/wali-kelas/*"
                            element={
                                <ProtectedRoute allowedRoles={['wali_kelas']}>
                                    <WaliKelasRoutes />
                                </ProtectedRoute>
                            }
                        />

                        {/* Ketua Kelas Routes - Lazy Loaded */}
                        <Route
                            path="/ketua-kelas/*"
                            element={
                                <ProtectedRoute allowedRoles={['ketua_kelas', 'siswa']}>
                                    <KetuaKelasRoutes />
                                </ProtectedRoute>
                            }
                        />

                        {/* Siswa Routes - Lazy Loaded */}
                        <Route
                            path="/siswa/*"
                            element={
                                <ProtectedRoute allowedRoles={['siswa', 'ketua_kelas']}>
                                    <SiswaRoutes />
                                </ProtectedRoute>
                            }
                        />

                        {/* Wali Murid Routes - Lazy Loaded */}
                        <Route
                            path="/wali-murid/*"
                            element={
                                <ProtectedRoute allowedRoles={['wali_murid']}>
                                    <WaliMuridRoutes />
                                </ProtectedRoute>
                            }
                        />

                        {/* TU Routes - Lazy Loaded */}
                        <Route
                            path="/tu/*"
                            element={
                                <ProtectedRoute allowedRoles={['tu']}>
                                    <TuRoutes />
                                </ProtectedRoute>
                            }
                        />

                        {/* Generic Dashboard Redirect */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <DashboardRedirect />
                                </ProtectedRoute>
                            }
                        />

                        {/* Fallback Routes */}
                        <Route path="/" element={<Navigate to="/login" replace />} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </Routes>
                </Suspense>
            </ErrorBoundary>
        </BrowserRouter>
    );
};

export default AppRoutes;
