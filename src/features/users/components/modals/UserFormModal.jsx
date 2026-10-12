import React from 'react';
import { Modal } from '../../../../components/ui/Modal';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { User, Shield, Briefcase, GraduationCap, Users, CheckCircle2 } from 'lucide-react';

const getRoleConfig = (roleName) => {
    switch (roleName) {
        case 'admin':
            return {
                icon: <Shield className="h-5 w-5" />,
                label: 'Administrator',
                description: 'Akses penuh ke seluruh sistem',
                theme: {
                    active: 'border-blue-500 bg-blue-50 text-blue-700',
                    iconBg: 'bg-blue-100 text-blue-600',
                    inactive: 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/30'
                }
            };
        case 'guru':
            return {
                icon: <Briefcase className="h-5 w-5" />,
                label: 'Guru',
                description: 'Manajemen KBM dan penilaian',
                theme: {
                    active: 'border-emerald-500 bg-emerald-50 text-emerald-700',
                    iconBg: 'bg-emerald-100 text-emerald-600',
                    inactive: 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30'
                }
            };
        case 'siswa':
            return {
                icon: <GraduationCap className="h-5 w-5" />,
                label: 'Siswa',
                description: 'Akses dashboard siswa & materi',
                theme: {
                    active: 'border-violet-500 bg-violet-50 text-violet-700',
                    iconBg: 'bg-violet-100 text-violet-600',
                    inactive: 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/30'
                }
            };
        case 'wali_kelas':
            return {
                icon: <Users className="h-5 w-5" />,
                label: 'Wali Kelas',
                description: 'Manajemen kelas & laporan',
                theme: {
                    active: 'border-orange-500 bg-orange-50 text-orange-700',
                    iconBg: 'bg-orange-100 text-orange-600',
                    inactive: 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/30'
                }
            };
        case 'wali_murid':
            return {
                icon: <User className="h-5 w-5" />,
                label: 'Wali Murid',
                description: 'Monitoring perkembangan anak',
                theme: {
                    active: 'border-cyan-500 bg-cyan-50 text-cyan-700',
                    iconBg: 'bg-cyan-100 text-cyan-600',
                    inactive: 'border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/30'
                }
            };
        case 'tu':
            return {
                icon: <Briefcase className="h-5 w-5" />,
                label: 'Tata Usaha',
                description: 'Administrasi & Keuangan',
                theme: {
                    active: 'border-pink-500 bg-pink-50 text-pink-700',
                    iconBg: 'bg-pink-100 text-pink-600',
                    inactive: 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/30'
                }
            };
        default:
            return {
                icon: <User className="h-5 w-5" />,
                label: roleName?.replace(/_/g, ' ') || 'User',
                description: 'Akses standar sistem',
                theme: {
                    active: 'border-gray-500 bg-gray-50 text-gray-700',
                    iconBg: 'bg-gray-100 text-gray-600',
                    inactive: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
            };
    }
};

const UserFormModal = ({
    isOpen,
    onClose,
    formData,
    setFormData,
    roles,
    onSubmit,
    isSubmitting,
    title = "Tambah User Baru"
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description="Isi informasi user di bawah ini."
            size="xl"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>Batal</Button>
                    <Button onClick={onSubmit} isLoading={isSubmitting}>Simpan</Button>
                </>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Personal Info */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                        <User className="h-4 w-4 text-gray-500" />
                        <h4 className="font-medium text-sm text-gray-700">Informasi Pribadi</h4>
                    </div>
                    <Input
                        label="Nama Lengkap"
                        placeholder="Contoh: Budi Santoso"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Input
                        label="Email"
                        type="email"
                        placeholder="budi@school.ai"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <Input
                        label="No. Telepon"
                        placeholder="081234567890"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <div className="space-y-2 pt-2">
                        <label className="text-sm font-medium">Status Akun</label>
                        <select
                            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            value={formData.isActive ? 'active' : 'inactive'}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Right Column: Roles */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b">
                        <Shield className="h-4 w-4 text-gray-500" />
                        <h4 className="font-medium text-sm text-gray-700">Role & Hak Akses</h4>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-500">Pilih role untuk user ini</label>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-[300px] overflow-y-auto pr-2">
                            {roles.map(role => {
                                const isSelected = formData.roleIds.includes(role.id);
                                const config = getRoleConfig(role.name);
                                return (
                                    <div
                                        key={role.id}
                                        onClick={() => {
                                            const newRoleIds = isSelected
                                                ? formData.roleIds.filter(id => id !== role.id)
                                                : [...formData.roleIds, role.id];
                                            setFormData({ ...formData, roleIds: newRoleIds });
                                        }}
                                        className={`
                                            relative flex items-start p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 group h-full
                                            ${isSelected ? config.theme.active : config.theme.inactive}
                                        `}
                                    >
                                        <div className={`p-2 rounded-lg mr-3 transition-colors shrink-0 ${isSelected ? config.theme.iconBg : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-gray-600'}`}>
                                            {config.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-sm capitalize truncate pr-2">
                                                    {config.label}
                                                </p>
                                                {isSelected && (
                                                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${config.theme.active.split(' ').pop()}`} />
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                {config.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default UserFormModal;
