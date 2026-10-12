import React, { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { usersAPI } from '@/features/users/api/usersAPI';
import { siswaAPI } from '@/features/users/api/siswaAPI';
import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';

export const useUserImport = (roles, kelasList, loadingCallback, existingUsers = []) => {

    // Helper to normalize class names for comparison (e.g., "X IPA 1" -> "x ipa 1")
    const normalizeClassName = (name) => {
        if (!name) return '';
        return name.toString().toLowerCase()
            .replace(/[-_]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const validateImportData = useCallback(async (data) => {
        const errors = [];
        const warnings = [];
        const existingEmails = new Set(existingUsers.map(u => u.email.toLowerCase()));

        data.forEach(row => {
            const rowIndex = row._rowIndex;

            // 1. Check Email Duplicates (In System)
            if (row.email && existingEmails.has(row.email.toLowerCase())) {
                errors.push({ rowIndex, message: `Email ${row.email} sudah terdaftar di sistem` });
            }

            // 2. Check Duplicate Emails (In File) - Optional but good
            // const currentEmailCount = data.filter(r => r.email === row.email).length;
            // if (currentEmailCount > 1) { ... }

            // 3. Check Kelas (Only for Siswa)
            if (!row.role || row.role.toLowerCase() === 'siswa') {
                if (row.kelas) {
                    const normalizedInput = normalizeClassName(row.kelas);
                    const foundClass = kelasList.find(k => normalizeClassName(k.nama) === normalizedInput);
                    if (!foundClass) {
                        errors.push({ rowIndex, message: `Kelas "${row.kelas}" tidak ditemukan` });
                    }
                } else {
                    // warnings.push({ rowIndex, message: 'Data kelas kosong' }); 
                    // Optional: is Kelas mandatory? If yes, push to errors.
                }
            }
        });

        return { errors, warnings };
    }, [kelasList, existingUsers]);

    const handleImportUsers = async (importData) => {
        let successCount = 0;
        let errorCount = 0;
        let errors = [];

        // No need to track warnings here as they are handled in validation step, 
        // but we can log them if needed.

        for (const userData of importData) {
            try {
                const roleName = (userData.role || 'siswa').toLowerCase();
                const roleMap = {
                    admin: roles.find(r => r.name === 'admin')?.id,
                    guru: roles.find(r => r.name === 'guru')?.id,
                    siswa: roles.find(r => r.name === 'siswa')?.id,
                    tu: roles.find(r => r.name === 'tu')?.id,
                };
                const roleId = roleMap[roleName] || roleMap.siswa;

                // Create User
                const createdUser = await usersAPI.createUser({
                    name: userData.name,
                    email: userData.email,
                    phone: userData.phone,
                    roleIds: [roleId],
                    isActive: true,
                    password: 'password123', // Default password
                });

                // Handle Siswa Specifics
                if (roleName === 'siswa' && createdUser && createdUser.id) {
                    let kelasId = null;
                    if (userData.kelas) {
                        const normalizedInputClass = normalizeClassName(userData.kelas);
                        const matchingKelas = kelasList.find(
                            k => normalizeClassName(k.nama) === normalizedInputClass
                        );

                        if (matchingKelas) {
                            kelasId = matchingKelas.id;
                        }
                    }

                    try {
                        // 1. Create Siswa Profile
                        // We need the siswa ID for linking, createSiswa should return it.
                        // Currently siswaAPI.createSiswa returns fetch properties.
                        // We might need to fetch the siswa ID after creation or adjust createSiswa to return ID.
                        // Standard RPC 'create_siswa_profile' usually returns void or success.
                        // Let's check siswaAPI.createSiswa again or assume we can fetch it.
                        // Actually, 'create_siswa_profile' automatically creates, but doesn't return ID easily?
                        // Let's assume we can query it or the RPC returns it.
                        // Wait, looking at previous knowledge, create_siswa_profile is an RPC.
                        // Let's just call it.
                        const siswaResponse = await siswaAPI.createSiswa({
                            userId: createdUser.id,
                            nis: userData.nis || null,
                            nisn: userData.nisn || null,
                            kelasId: kelasId,
                            jenisKelamin: userData.jenisKelamin || null,
                            tanggalLahir: userData.tanggalLahir || null,
                        });

                        // 2. Handle Wali Murid if present
                        // 2. Handle Wali Murid if present
                        if (userData.wali && userData.wali.email) {
                            // Poll for Siswa Profile with exponential backoff
                            let siswaProfile = null;
                            const maxRetries = 5;
                            for (let i = 0; i < maxRetries; i++) {
                                siswaProfile = await siswaAPI.getSiswaByUserId(createdUser.id);
                                if (siswaProfile) break;
                                await new Promise(r => setTimeout(r, 500 * Math.pow(1.5, i))); // 500ms, 750ms, 1125ms...
                            }

                            if (siswaProfile) {
                                // 3. Use unified service to handle Wali creation/finding & assignment
                                try {
                                    await dashboardAPI.createAndAssignWali(siswaProfile.id, {
                                        name: userData.wali.name,
                                        email: userData.wali.email,
                                        phone: userData.wali.phone,
                                        hubungan: userData.wali.hubungan || 'Orang Tua'
                                    });
                                } catch (waliError) {
                                    console.error("Error linking wali:", waliError);
                                    // Log warning but don't fail the whole user
                                    errors.push(`Info: Siswa created, but failed to link Guardian: ${waliError.message}`);
                                }
                            } else {
                                errors.push(`Warning: Could not link Guardian for ${userData.email} (Profile creation delay)`);
                            }
                        }

                    } catch (siswaError) {
                        console.error('Error creating siswa profile:', siswaError);

                        // Attempt rollback of created user
                        try {
                            await usersAPI.deleteUser(createdUser.id);
                        } catch (rollbackError) {
                            console.error('Failed to rollback user:', rollbackError);
                        }

                        throw new Error(`Gagal membuat profil siswa: ${siswaError.message}`);
                    }
                }

                successCount++;
            } catch (error) {
                console.error('Error importing user:', userData.email, error);
                errorCount++;
                // Check if error is "User already exists" (though we validated, race conditions exist)
                errors.push(`${userData.email}: ${error.message}`);
            }
        }

        if (loadingCallback) loadingCallback();

        return { success: successCount, failed: errorCount, errorDetails: errors };
    };

    return { handleImportUsers, validateImportData };
};
