import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleLayout } from '../../components/layout/RoleLayout';

// Lazy loaded pages
import GuruDashboard from '../../features/dashboard/guru';
import GuruSchedulePage from '../../features/schedule/pages/GuruSchedulePage';
import InputAttendancePage from '../../features/attendance/pages/InputAttendancePage';
import AttendanceRecapPage from '../../features/attendance/pages/AttendanceRecapPage';
import GuruProfilePage from '../../features/users/pages/GuruProfilePage';

/**
 * Guru Routes Bundle
 * All routes for the guru role
 */
const GuruRoutesComponent = () => {
    return (
        <RoleLayout role="guru">
            <Routes>
                <Route path="dashboard" element={<GuruDashboard />} />
                <Route path="jadwal" element={<GuruSchedulePage />} />
                <Route path="absensi" element={<InputAttendancePage />} />
                <Route path="rekap" element={<AttendanceRecapPage />} />
                <Route path="profil" element={<GuruProfilePage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
        </RoleLayout>
    );
};

export default GuruRoutesComponent;
