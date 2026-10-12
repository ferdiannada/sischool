import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleLayout } from '../../components/layout/RoleLayout';

// Lazy loaded pages
import AdminDashboard from '../../features/dashboard/admin';
import StudentUsersPage from '../../features/users/pages/StudentUsersPage';
import TeacherUsersPage from '../../features/users/pages/TeacherUsersPage';
import StaffUsersPage from '../../features/users/pages/StaffUsersPage';
import AdminUsersPage from '../../features/users/pages/AdminUsersPage';
import MasterDataPage from '../../features/master-data/pages/MasterDataPage';
import ScheduleBuilderPage from '../../features/schedule/pages/ScheduleBuilderPage';
import AdminReportsPage from '../../features/reports/pages/AdminReportsPage';
import SettingsPage from '../../features/settings/pages/SettingsPage';
import ClassPromotionPage from '../../features/users/pages/ClassPromotionPage';

/**
 * Admin Routes Bundle
 * All routes for the admin role
 */
const AdminRoutesComponent = () => {
    return (
        <RoleLayout role="admin">
            <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users/siswa" element={<StudentUsersPage />} />
                <Route path="users/guru" element={<TeacherUsersPage />} />
                <Route path="users/tu" element={<StaffUsersPage />} />
                <Route path="users/admin" element={<AdminUsersPage />} />
                <Route path="users/promotion" element={<ClassPromotionPage />} />
                {/* Redirect for base users path */}
                <Route path="users" element={<Navigate to="siswa" replace />} />

                <Route path="master" element={<MasterDataPage />} />
                <Route path="schedule" element={<ScheduleBuilderPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
        </RoleLayout>
    );
};

export default AdminRoutesComponent;
