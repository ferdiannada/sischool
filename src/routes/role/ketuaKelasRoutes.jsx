import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleLayout } from '../../components/layout/RoleLayout';

// Lazy loaded pages
import KetuaKelasDashboard from '../../features/dashboard/ketua-kelas';
import KetuaKelasInputAttendancePage from '../../features/attendance/pages/KetuaKelasInputAttendancePage';
import ClassSchedulePage from '../../features/schedule/pages/ClassSchedulePage';
import ClassmatesPage from '../../features/users/pages/ClassmatesPage';
import KetuaKelasProfilePage from '../../features/users/pages/KetuaKelasProfilePage';

/**
 * Ketua Kelas Routes Bundle
 * All routes for the ketua_kelas role
 */
const KetuaKelasRoutesComponent = () => {
    return (
        <RoleLayout role="ketua_kelas">
            <Routes>
                <Route path="dashboard" element={<KetuaKelasDashboard />} />
                <Route path="absensi" element={<KetuaKelasInputAttendancePage />} />
                <Route path="jadwal" element={<ClassSchedulePage />} />
                <Route path="teman" element={<ClassmatesPage />} />
                <Route path="profil" element={<KetuaKelasProfilePage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
        </RoleLayout>
    );
};

export default KetuaKelasRoutesComponent;
