import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../../store/authStore';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/Card';
import { GraduationCap, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { authService } from '@/features/auth/api/authService';

const LoginPage = () => {
    const navigate = useNavigate();
    const login = useAuthStore((state) => state.login);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    // Role to route mapping
    const roleRoutes = {
        admin: '/admin/dashboard',
        guru: '/guru/dashboard',
        wali_kelas: '/wali-kelas/dashboard',
        ketua_kelas: '/ketua-kelas/dashboard',
        siswa: '/siswa/dashboard',
        wali_murid: '/wali-murid/dashboard',
        tu: '/tu/dashboard',
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { user } = await authService.signIn(formData.email, formData.password);

            // Update auth store
            login({
                id: user.id,
                name: user.full_name,
                email: user.email,
                role: user.primaryRole || user.roles?.[0],
                roles: user.roles,
            });

            toast.success(`Selamat datang, ${user.full_name}!`);

            // Redirect based on primary role
            const primaryRole = user.primaryRole || user.roles?.[0];

            if (!primaryRole || primaryRole === 'authenticated' || primaryRole === 'no_role') {
                throw new Error('Akun Anda belum memiliki role yang valid. Silakan hubungi Administrator.');
            }

            const redirectPath = roleRoutes[primaryRole] || '/dashboard';
            navigate(redirectPath);

        } catch (err) {
            console.error('Login error:', err);
            setError(err.message || 'Login gagal. Periksa email dan password Anda.');
            toast.error(err.message || 'Login gagal');
        } finally {
            setIsLoading(false);
        }
    };

    // Quick login buttons for development
    const devUsers = [
        { email: 'admin@school.ai', password: 'admin123', label: 'Admin' },
        { email: 'guru1@school.ai', password: 'guru123', label: 'Guru' },
        { email: 'siswa1@school.ai', password: 'siswa123', label: 'Siswa/Ketua' },
        { email: 'walimurid1@school.ai', password: 'wali123', label: 'Wali Murid' },
        { email: 'tu@school.ai', password: 'tu123', label: 'TU' },
    ];

    const handleQuickLogin = (user) => {
        setFormData({ email: user.email, password: user.password });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-indigo-900 relative overflow-hidden px-4">
            {/* Ambient Background Shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-500/20 blur-3xl" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-500/20 blur-3xl" />
                <div className="absolute -bottom-[10%] left-[20%] w-[30%] h-[40%] rounded-full bg-purple-500/20 blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative z-10 bg-white/90 backdrop-blur-xl border-white/20 shadow-2xl">
                <CardHeader className="space-y-2 text-center pb-6 pt-8">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                            <GraduationCap className="h-9 w-9" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary-700 to-indigo-700 bg-clip-text text-transparent">
                        SiSchool
                    </CardTitle>
                    <CardDescription className="text-base">
                        Sistem Informasi Sekolah Terpadu
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4 px-8">
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-1">
                            <Input
                                type="email"
                                label="Email"
                                placeholder="Masukkan email anda"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                className="bg-white/50 border-gray-200 focus:bg-white transition-all h-11"
                            />
                        </div>
                        <div className="space-y-1">
                            <Input
                                type="password"
                                label="Password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                className="bg-white/50 border-gray-200 focus:bg-white transition-all h-11"
                            />
                        </div>

                        {/* Quick Login for Development */}
                        <div className="pt-2">
                            <p className="text-xs text-gray-500 mb-2">Quick Login (Dev):</p>
                            <div className="flex flex-wrap gap-1">
                                {devUsers.map((user) => (
                                    <button
                                        key={user.email}
                                        type="button"
                                        onClick={() => handleQuickLogin(user)}
                                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded text-gray-600 transition-colors"
                                    >
                                        {user.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="pb-8 px-8 flex flex-col gap-4">
                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            isLoading={isLoading}
                            className="text-base font-semibold shadow-lg shadow-primary-500/25 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 border-0"
                        >
                            Log In
                        </Button>
                        <p className="text-xs text-center text-gray-400">
                            Lupa password? Hubungi administrator sekolah.
                        </p>
                    </CardFooter>
                </form>
            </Card>

            <div className="absolute bottom-6 text-white/40 text-xs font-medium">
                © 2026 SiSchool AI Powered System
            </div>
        </div>
    );
};

export default LoginPage;
