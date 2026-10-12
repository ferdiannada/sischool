import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleLayout } from '../../components/layout/RoleLayout';

// Lazy loaded pages
// Lazy loaded pages
import WaliMuridDashboard from '@/features/dashboard/wali-murid';
import ChildProfilePage from '@/features/users/pages/ChildProfilePage';
import ChildAttendancePage from '@/features/attendance/pages/ChildAttendancePage';
import NotificationsPage from '@/features/notifications/pages/NotificationsPage';
import ParentProfilePage from '@/features/users/pages/ParentProfilePage';
import ChildBillingPage from '@/features/finance/pages/ChildBillingPage';

/**
 * Wali Murid Routes Bundle
 * All routes for the wali_murid role
 */
const WaliMuridRoutesComponent = () => {
    return (
        <RoleLayout role="wali_murid">
            <Routes>
                <Route path="dashboard" element={<WaliMuridDashboard />} />
                <Route path="anak" element={<ChildProfilePage />} />
                <Route path="kehadiran" element={<ChildAttendancePage />} />
                <Route path="notifikasi" element={<NotificationsPage />} />
                <Route path="tagihan" element={<ChildBillingPage />} />
                <Route path="profil" element={<ParentProfilePage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
        </RoleLayout>
    );
};

export default WaliMuridRoutesComponent;
