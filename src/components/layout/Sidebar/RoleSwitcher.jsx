import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { ArrowLeftRight, Crown, User, ChevronDown } from 'lucide-react';
import useAuthStore from '../../../store/authStore';
import { getDashboardPath } from '../../../routes/routeConfig';

/**
 * Role labels and icons for display
 */
const ROLE_CONFIG = {
    siswa: {
        label: 'Siswa',
        icon: User,
        color: 'bg-blue-500',
        description: 'Mode siswa biasa'
    },
    ketua_kelas: {
        label: 'Ketua Kelas',
        icon: Crown,
        color: 'bg-amber-500',
        description: 'Mode ketua kelas'
    },
    guru: { label: 'Guru', icon: User, color: 'bg-green-500' },
    wali_kelas: { label: 'Wali Kelas', icon: User, color: 'bg-purple-500' },
    admin: { label: 'Admin', icon: User, color: 'bg-red-500' },
    tu: { label: 'Tata Usaha', icon: User, color: 'bg-gray-500' },
    wali_murid: { label: 'Wali Murid', icon: User, color: 'bg-teal-500' },
};

/**
 * RoleSwitcher Component
 * Allows users with multiple roles to switch between them
 */
const RoleSwitcher = ({ className }) => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef(null);

    const activeRole = useAuthStore((state) => state.activeRole);
    const getAllRoles = useAuthStore((state) => state.getAllRoles);
    const hasMultipleRoles = useAuthStore((state) => state.hasMultipleRoles);
    const switchRole = useAuthStore((state) => state.switchRole);

    const roles = getAllRoles();
    const currentRoleConfig = ROLE_CONFIG[activeRole] || ROLE_CONFIG.siswa;
    const IconComponent = currentRoleConfig.icon;

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Don't render if user has only one role
    if (!hasMultipleRoles()) {
        return null;
    }

    const handleRoleSwitch = (role) => {
        if (role !== activeRole) {
            switchRole(role);
            setIsOpen(false);
            // Navigate to the new role's dashboard
            navigate(getDashboardPath(role));
        }
    };

    return (
        <div className={cn("relative", className)} ref={dropdownRef}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg",
                    "bg-gradient-to-r from-primary-50 to-indigo-50 border border-primary-100",
                    "hover:from-primary-100 hover:to-indigo-100 transition-all duration-200",
                    "text-sm font-medium text-primary-800"
                )}
            >
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "h-7 w-7 rounded-full flex items-center justify-center text-white",
                        currentRoleConfig.color
                    )}>
                        <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                        <span className="block text-primary-900 font-semibold">
                            {currentRoleConfig.label}
                        </span>
                        <span className="text-xs text-primary-600">
                            Klik untuk ganti mode
                        </span>
                    </div>
                </div>
                <ChevronDown className={cn(
                    "h-4 w-4 text-primary-500 transition-transform duration-200",
                    isOpen && "rotate-180"
                )} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                            <ArrowLeftRight className="h-3 w-3" />
                            Pilih Mode Akses
                        </p>
                    </div>
                    <div className="p-1">
                        {roles.map((role) => {
                            const config = ROLE_CONFIG[role] || ROLE_CONFIG.siswa;
                            const RoleIcon = config.icon;
                            const isActive = role === activeRole;

                            return (
                                <button
                                    key={role}
                                    onClick={() => handleRoleSwitch(role)}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                                        isActive
                                            ? "bg-primary-50 text-primary-700"
                                            : "hover:bg-gray-50 text-gray-700"
                                    )}
                                >
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center text-white shrink-0",
                                        config.color
                                    )}>
                                        <RoleIcon className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">
                                            {config.label}
                                            {isActive && (
                                                <span className="ml-2 text-xs text-primary-500">(aktif)</span>
                                            )}
                                        </p>
                                        {config.description && (
                                            <p className="text-xs text-gray-500 truncate">
                                                {config.description}
                                            </p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export { RoleSwitcher };
