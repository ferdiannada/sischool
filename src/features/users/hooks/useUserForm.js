import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '@/features/users/api/usersAPI';

export const useUserForm = (onSuccess) => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        roleIds: [],
        isActive: true,
        password: '',
    });

    const resetForm = (roles = []) => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            roleIds: roles.length > 0 ? [roles[0].id] : [],
            isActive: true,
            password: 'password123', // Default
        });
    };

    const setFormFromUser = (user, roles) => {
        const userRoleIds = user.roles && user.roles.length > 0
            ? user.roles.map(roleName => roles.find(r => r.name === roleName)?.id).filter(Boolean)
            : [];

        setFormData({
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            roleIds: userRoleIds,
            isActive: user.isActive,
            password: '', // Don't fill password on edit
        });
    };

    const handleSubmit = async (editingUserId = null) => {
        if (!formData.name || !formData.email) {
            toast.error('Nama dan email wajib diisi');
            return false;
        }

        if (formData.roleIds.length === 0) {
            toast.error('Pilih minimal satu role');
            return false;
        }

        setIsSubmitting(true);
        try {
            if (editingUserId) {
                // Update
                await usersAPI.updateUser(editingUserId, {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    isActive: formData.isActive,
                });

                // Update roles
                await usersAPI.assignRoles(editingUserId, formData.roleIds);
                toast.success('User berhasil diupdate');
            } else {
                // Create
                await usersAPI.createUser({
                    ...formData,
                    roleIds: formData.roleIds,
                });
                toast.success('User berhasil ditambahkan');
            }

            if (onSuccess) onSuccess();
            // Invalidate admin stats to reflect role changes immediately
            queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
            return true;
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error(editingUserId ? 'Gagal mengupdate user' : 'Gagal menambahkan user');
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        formData,
        setFormData,
        handleSubmit,
        resetForm,
        setFormFromUser,
        isSubmitting
    };
};
