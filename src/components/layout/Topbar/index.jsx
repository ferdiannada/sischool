import * as React from 'react';
import { Menu, Bell, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Avatar } from '../../ui/Avatar';

const Topbar = ({ onMenuClick }) => {
    const navigate = useNavigate(); // Added this line
    const { user, roleLabel, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = () => {
        setIsDropdownOpen(false);
        logout();
    };

    const handleProfileClick = (e) => {
        e.preventDefault();
        setIsDropdownOpen(false);

        // Map roles to profile paths
        const role = user?.role;
        const rolePaths = {
            siswa: '/siswa/profil',
            guru: '/guru/profil',
            wali_kelas: '/wali-kelas/profil',
            ketua_kelas: '/ketua-kelas/profil',
            wali_murid: '/wali-murid/profil',
            admin: '/admin/settings', // Admin uses settings as profile/config
            tu: '/tu/settings'       // TU uses settings
        };

        const path = rolePaths[role] || '#';
        if (path !== '#') {
            navigate(path);
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    className="lg:hidden text-gray-500 hover:text-gray-900"
                    onClick={onMenuClick}
                >
                    <Menu className="h-6 w-6" />
                </button>
                <div className="hidden sm:block w-full max-w-sm">
                    <Input
                        placeholder="Search..."
                        icon={Search}
                        className="h-9 w-64 lg:w-80"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative text-gray-500 hover:text-gray-900">
                    <Bell className="h-6 w-6" />
                    <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-danger border-2 border-white" />
                </button>

                <div className="relative" ref={dropdownRef}>
                    <button
                        className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200 hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500">{roleLabel || 'Role'}</p>
                        </div>
                        <Avatar fallback={user?.name?.substring(0, 2).toUpperCase() || 'US'} size="sm" />
                    </button>

                    {/* Mobile View User Icon (visible only on small screens) */}
                    <button
                        className="sm:hidden flex items-center justify-center p-2 rounded-full hover:bg-gray-100"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <Avatar fallback={user?.name?.substring(0, 2).toUpperCase() || 'US'} size="sm" />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                            <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                                <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                                <p className="text-xs text-gray-500">{roleLabel || 'Role'}</p>
                            </div>

                            <button // Changed from <a> to <button>
                                className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" // Added w-full text-left
                                onClick={handleProfileClick} // Updated onClick handler
                            >
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>Profile</span>
                                </div>
                            </button>
                            <button
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                onClick={handleLogout}
                            >
                                <div className="flex items-center gap-2">
                                    <LogOut className="h-4 w-4" />
                                    <span>Logout</span>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export { Topbar };
