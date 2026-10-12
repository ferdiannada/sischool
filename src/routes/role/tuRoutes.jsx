import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { RoleLayout } from '../../components/layout/RoleLayout';

// Lazy loaded pages
import TuDashboard from '../../features/dashboard/tu';
const PembayaranPage = React.lazy(() => import('../../features/finance/pages/PembayaranPage'));
const CatatPembayaranPage = React.lazy(() => import('../../features/finance/pages/CatatPembayaranPage'));
const MasterPembayaranPage = React.lazy(() => import('../../features/finance/pages/MasterPembayaranPage'));
const TagihanPage = React.lazy(() => import('../../features/finance/pages/TagihanPage'));
const PengeluaranPage = React.lazy(() => import('../../features/finance/pages/PengeluaranPage'));
const LaporanPage = React.lazy(() => import('../../features/finance/pages/LaporanPage'));
const SettingsPage = React.lazy(() => import('../../features/finance/pages/SettingsPage'));

/**
 * TU Routes Bundle
 * All routes for the TU/Keuangan role
 */
const TuRoutesComponent = () => {
    return (
        <RoleLayout role="tu">
            <Routes>
                <Route path="dashboard" element={<TuDashboard />} />
                <Route path="pembayaran" element={<PembayaranPage />} />
                <Route path="pembayaran/create" element={<CatatPembayaranPage />} />
                <Route path="tagihan" element={<TagihanPage />} />
                <Route path="pengeluaran" element={<PengeluaranPage />} />
                <Route path="master-pembayaran" element={<MasterPembayaranPage />} />
                <Route path="laporan" element={<LaporanPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Routes>
        </RoleLayout>
    );
};

export default TuRoutesComponent;
