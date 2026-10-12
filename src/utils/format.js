import { startOfWeek, endOfWeek, format } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Format number to IDR currency
 * @param {number} amount 
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

/**
 * Format date to Indonesian locale standard
 * @param {Date|string|number} date Date to format
 * @param {Object} options Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
    if (!date) return '-';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '-';

    const defaultOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        ...options
    };

    return d.toLocaleDateString('id-ID', defaultOptions);
};

/**
 * Get month name in Indonesian
 * @param {number} monthIndex 1-12 usually
 * @returns {string} Month name
 */
export const formatMonth = (monthIndex) => {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[monthIndex - 1] || '';
};

/**
 * Get today's date in YYYY-MM-DD format
 */
export const getTodayStr = () => {
    return new Date().toLocaleDateString('sv-SE');
};

/**
 * Get start of week (Monday) in YYYY-MM-DD format
 */
export const getStartOfWeek = (date = new Date()) => {
    return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
};

/**
 * Get end of week (Saturday) in YYYY-MM-DD format
 */
export const getEndOfWeek = (date = new Date()) => {
    // School usually Mon-Sat
    const saturday = endOfWeek(date, { weekStartsOn: 1 });
    // Adjust from Sunday to Saturday if needed, but endOfWeek with weekStartsOn: 1 returns Sunday
    // date-fns endOfWeek returns the last day of the week.
    // If week starts on Mon (1), end is Sun (0/7). We want Sat (6).
    const mon = startOfWeek(date, { weekStartsOn: 1 });
    const sat = new Date(mon);
    sat.setDate(mon.getDate() + 5);
    return format(sat, 'yyyy-MM-dd');
};
