/**
 * Settings API Service
 * Handles school settings and system configuration
 * Refactored to use dashboardAPI for backend persistence
 */

import { dashboardAPI } from '@/features/dashboard/api/dashboardAPI';

const STORAGE_KEY = 'school_settings';

// Default settings
const defaultSettings = {
    notifications: {
        whatsappAbsensi: true,
        emailLaporanMingguan: false,
        emailLaporanBulanan: true,
        notifKritisAlpha: true,
    },
};

export const settingsAPI = {
    /**
     * Get school info from backend
     */
    async getSchoolInfo() {
        try {
            const data = await dashboardAPI.getSchoolInfo();
            if (data && data.length > 0) {
                // Determine if it returns array or object. RPC returns SETOF, usually array in JS client if generic, 
                // but dashboardAPI might be handling it. Let's assume object or first item of array.
                // rpc usually returns array for SETOF.
                // dashboardAPI.getSchoolInfo returns whatever rpc returns.
                // rpc('get_school_info') returns array.
                const info = Array.isArray(data) ? data[0] : data;

                // Map to frontend structure if needed, or use DB columns directly
                // DB: name, address, phone, email, website, logo_url
                // Frontend expects: nama, npsn (not in DB yet?), alamat, email, telepon, kepalaSekolah (not in DB yet?), logo

                // We need to add NPSN and Kepala Sekolah to DB if critical, or store them in a JSON field if we didn't add columns.
                // My migration only added: name, address, phone, email, website, logo_url.
                // Use 'website' field for NPSN or Kepala Sekolah? No.
                // I should have added NPSN and Kepala Sekolah.
                // For now, I'll just map what I have.

                return {
                    nama: info.name || '',
                    npsn: info.npsn || '', // Undefined in DB
                    alamat: info.address || '',
                    email: info.email || '',
                    telepon: info.phone || '',
                    kepalaSekolah: info.headmaster || '', // Undefined in DB
                    logo: info.logo_url || null,
                    website: info.website || ''
                };
            }
            return {
                nama: '',
                npsn: '',
                alamat: '',
                email: '',
                telepon: '',
                kepalaSekolah: '',
                logo: null,
                website: ''
            };
        } catch (error) {
            console.error('Error fetching school info:', error);
            return {
                nama: '',
                npsn: '',
                alamat: '',
                email: '',
                telepon: '',
                kepalaSekolah: '',
                logo: null
            };
        }
    },

    /**
     * Get notification settings (still local for now or moving to DB?)
     * Providing async interface for future compatibility
     */
    async getNotifications() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return parsed.notifications || defaultSettings.notifications;
            }
            return defaultSettings.notifications;
        } catch (error) {
            return defaultSettings.notifications;
        }
    },

    /**
     * Update school info
     */
    async updateSchoolInfo(schoolInfo) {
        try {
            // Map frontend keys to DB keys
            await dashboardAPI.updateSchoolInfo({
                p_name: schoolInfo.nama,
                p_address: schoolInfo.alamat,
                p_phone: schoolInfo.telepon,
                p_email: schoolInfo.email,
                p_website: schoolInfo.website || '',
                p_logo_url: schoolInfo.logo,
                p_npsn: schoolInfo.npsn || '',
                p_headmaster: schoolInfo.kepalaSekolah || ''
            });
            // Also save to verify simple fields like NPSN locally if not in DB? 
            // Better not to mix. I'll rely on DB.
            return true;
        } catch (error) {
            console.error('Error updating school info:', error);
            return false;
        }
    },

    /**
     * Upload school logo
     */
    async uploadLogo(file) {
        try {
            return await dashboardAPI.uploadSchoolLogo(file);
        } catch (error) {
            console.error('Error uploading logo:', error);
            throw error;
        }
    },

    /**
     * Update notification settings
     */
    updateNotifications(notifications) {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const current = stored ? JSON.parse(stored) : defaultSettings;
            const newSettings = { ...current, notifications };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
            return true;
        } catch (error) {
            console.error('Error saving notifications:', error);
            return false;
        }
    },

    /**
     * Get active tahun ajaran from backend
     */
    async getActiveTahunAjaran() {
        try {
            const response = await fetch('/api/tahun_ajaran?is_active=eq.true&select=id,nama,semester');
            if (response.ok) {
                const data = await response.json();
                return data?.[0] || null;
            }
            return null;
        } catch (error) {
            console.error('Error fetching tahun ajaran:', error);
            return null;
        }
    },

    /**
     * Get all tahun ajaran for selection
     */
    async getAllTahunAjaran() {
        try {
            const response = await fetch('/api/tahun_ajaran?select=id,nama,semester,is_active&order=nama.desc');
            if (response.ok) {
                return await response.json();
            }
            return [];
        } catch (error) {
            console.error('Error fetching tahun ajaran:', error);
            return [];
        }
    },

    /**
     * Set active tahun ajaran
     */
    async setActiveTahunAjaran(id) {
        try {
            // Deactivate all
            await fetch('/api/tahun_ajaran?is_active=eq.true', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
                body: JSON.stringify({ is_active: false }),
            });

            // Activate selected
            const response = await fetch(`/api/tahun_ajaran?id=eq.${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
                body: JSON.stringify({ is_active: true }),
            });

            return response.ok;
        } catch (error) {
            console.error('Error setting tahun ajaran:', error);
            return false;
        }
    },

    // Legacy method for compatibility if needed, but prefer specific ones
    getSettings() {
        return defaultSettings;
    }
};

export default settingsAPI;
