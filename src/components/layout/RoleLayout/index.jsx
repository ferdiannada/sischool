import * as React from 'react';
import { Sidebar } from '../Sidebar';
import { Topbar } from '../Topbar';
import useAuthStore from '../../../store/authStore';
import {
    ADMIN_NAV_ITEMS,
    GURU_NAV_ITEMS,
    WALI_KELAS_NAV_ITEMS,
    KETUA_KELAS_NAV_ITEMS,
    SISWA_NAV_ITEMS,
    WALI_MURID_NAV_ITEMS,
    TU_NAV_ITEMS,
} from '../../../constants/navigation';

/**
 * Role to navigation items mapping
 */
const ROLE_NAV_MAP = {
    admin: { navItems: ADMIN_NAV_ITEMS, label: 'Administrator' },
    guru: { navItems: GURU_NAV_ITEMS, label: 'Guru' },
    wali_kelas: { navItems: WALI_KELAS_NAV_ITEMS, label: 'Wali Kelas' },
    ketua_kelas: { navItems: KETUA_KELAS_NAV_ITEMS, label: 'Ketua Kelas' },
    siswa: { navItems: SISWA_NAV_ITEMS, label: 'Siswa' },
    wali_murid: { navItems: WALI_MURID_NAV_ITEMS, label: 'Wali Murid' },
    tu: { navItems: TU_NAV_ITEMS, label: 'Tata Usaha' },
};

/**
 * RoleLayout Component
 * Unified layout that automatically injects navigation items based on role
 * Supports multi-role users with dynamic role switching
 */
const RoleLayout = ({ children, role }) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const activeRole = useAuthStore((state) => state.activeRole);

    // IMPORTANT: Always use the role prop from route config for sidebar navigation.
    // The role prop determines which route/page we're on, so sidebar must match.
    // activeRole from store is only used for multi-role badge display, not nav items.
    const effectiveRole = role;

    // Get navigation config for the effective role
    const roleConfig = ROLE_NAV_MAP[effectiveRole] || ROLE_NAV_MAP.siswa;
    const { navItems, label } = roleConfig;

    // Use user name if available, otherwise fall back to role label
    const displayName = user?.name || label;

    return (
        <div className="h-screen overflow-hidden bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                navItems={navItems}
                userRole={label}
                userName={displayName}
                user={user}
                onLogout={logout}
            />

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-200 ease-in-out lg:ml-0 h-full">
                <Topbar onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export { RoleLayout };
