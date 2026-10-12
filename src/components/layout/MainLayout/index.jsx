import * as React from 'react';
import { Sidebar } from '../Sidebar';
import { Topbar } from '../Topbar';
import useAuthStore from '../../../store/authStore';

const MainLayout = ({ children, navItems, userRole }) => {
    const [sidebarOpen, setSidebarOpen] = React.useState(false);
    const logout = useAuthStore((state) => state.logout);

    return (
        <div className="h-screen overflow-hidden bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                navItems={navItems}
                userRole={userRole}
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

export { MainLayout };
