import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleLayout } from '../../components/layout/RoleLayout';

// Lazy loaded pages
import SiswaDashboard from '../../features/dashboard/siswa';
import StudentSchedulePage from '../../features/schedule/pages/StudentSchedulePage';
import AttendanceHistoryPage from '../../features/attendance/pages/AttendanceHistoryPage';
import StudentProfilePage from '../../features/users/pages/StudentProfilePage';

/**
 * Siswa Routes Bundle
 * All routes for the siswa role
 */
const SiswaRoutesComponent = () => {
    return (
        <RoleLayout role="siswa">
            <Routes>
                <Route path="dashboard" element={<SiswaDashboard />} />
                <Route path="jadwal" element={<StudentSchedulePage />} />
                <Route path="kehadiran" element={<AttendanceHistoryPage />} />
                <Route path="profil" element={<StudentProfilePage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
        </RoleLayout>
    );
};

export default SiswaRoutesComponent;
