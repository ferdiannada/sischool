import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleLayout } from '../../components/layout/RoleLayout';

// Lazy loaded pages
import WaliKelasDashboard from '../../features/dashboard/wali-kelas';
import ClassDetailPage from '../../features/academic/pages/ClassDetailPage';
import AttendanceMonitoringPage from '../../features/attendance/pages/AttendanceMonitoringPage';
import WaliKelasReportsPage from '../../features/reports/pages/WaliKelasReportsPage';
import WaliKelasProfilePage from '../../features/users/pages/WaliKelasProfilePage';

/**
 * Wali Kelas Routes Bundle
 * All routes for the wali_kelas role
 */
const WaliKelasRoutesComponent = () => {
    return (
        <RoleLayout role="wali_kelas">
            <Routes>
                <Route path="dashboard" element={<WaliKelasDashboard />} />
                <Route path="kelas" element={<ClassDetailPage />} />
                <Route path="monitoring" element={<AttendanceMonitoringPage />} />
                <Route path="laporan" element={<WaliKelasReportsPage />} />
                <Route path="profil" element={<WaliKelasProfilePage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
        </RoleLayout>
    );
};

export default WaliKelasRoutesComponent;
