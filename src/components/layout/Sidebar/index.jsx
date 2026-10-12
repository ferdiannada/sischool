import * as React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { X, GraduationCap, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Modal } from '../../ui/Modal';


const SidebarItem = ({ item }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    // Check if any child is active to auto-expand
    const location = useLocation(); // Need to import useLocation from react-router-dom

    React.useEffect(() => {
        if (item.children) {
            const isChildActive = item.children.some(child => location.pathname.startsWith(child.path));
            if (isChildActive) {
                setIsOpen(true);
            }
        }
    }, [location.pathname, item.children]);

    if (item.children) {
        return (
            <div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                        isOpen && "bg-gray-100"
                    )}
                >
                    <div className="flex items-center gap-3">
                        {item.icon && <item.icon className="h-5 w-5" />}
                        {item.label}
                    </div>
                    {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                </button>
                {isOpen && (
                    <div className="mt-1 space-y-1 pl-10">
                        {item.children.map((child) => (
                            <NavLink
                                key={child.path}
                                to={child.path}
                                className={({ isActive }) => cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary-50 text-primary-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                {child.label}
                            </NavLink>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <NavLink
            to={item.path}
            className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            )}
        >
            {item.icon && <item.icon className="h-5 w-5" />}
            {item.label}
        </NavLink>
    );
};

const Sidebar = ({ className, isOpen, onClose, navItems = [], userRole, user, onLogout }) => {
    const [isLogoutModalOpen, setIsLogoutModalOpen] = React.useState(false);

    const handleLogoutClick = (e) => {
        e.preventDefault();
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        if (onLogout) {
            onLogout();
        }
        setIsLogoutModalOpen(false);
    };

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-gray-900/50 transition-opacity lg:hidden",
                    isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            {/* Sidebar Content */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto lg:flex lg:flex-col",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    className
                )}
            >
                <div className="flex h-16 shrink-0 items-center justify-between px-6 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <span className="text-lg font-bold text-gray-900">SiSchool</span>
                    </div>
                    <button
                        type="button"
                        className="lg:hidden text-gray-500 hover:text-gray-900"
                        onClick={onClose}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                    {navItems.map((item) => (
                        <SidebarItem key={item.path || item.label} item={item} />
                    ))}
                </nav>

                <div className="border-t border-gray-100 p-4 space-y-3">
                    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                            {user?.name ? user.name.charAt(0).toUpperCase() : (typeof userRole === 'string' ? userRole.charAt(0).toUpperCase() : 'U')}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{user?.name || user?.full_name || 'Guest User'}</p>
                            <p className="truncate text-xs text-gray-500 capitalize">
                                {user?.roles && user.roles.length > 0
                                    ? user.roles.map(r => String(r || '').replace('_', ' ')).join(', ')
                                    : (typeof userRole === 'string' ? userRole.replace('_', ' ') : 'Guest')}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogoutClick}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        Keluar Aplikasi
                    </button>
                </div>
            </aside>

            <Modal
                isOpen={isLogoutModalOpen}
                onClose={() => {
                    console.log('Logout modal closed without confirmation');
                    setIsLogoutModalOpen(false);
                }}
                className="max-w-md"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mb-4 ring-4 ring-red-50/50">
                        <LogOut className="h-7 w-7 text-red-600" />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Konfirmasi Keluar
                    </h3>

                    <p className="text-sm text-gray-500 mb-6 max-w-xs">
                        Apakah Anda yakin ingin mengakhiri sesi ini? Anda perlu login kembali untuk mengakses akun Anda.
                    </p>

                    <div className="flex gap-3 w-full">
                        <Button
                            variant="outline"
                            onClick={() => setIsLogoutModalOpen(false)}
                            className="flex-1"
                            type="button"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="danger"
                            onClick={confirmLogout}
                            className="flex-1"
                            type="button"
                        >
                            Ya, Keluar
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export { Sidebar };
