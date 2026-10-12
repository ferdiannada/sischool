/**
 * Finance API Service
 * Handles all financial operations: Invoices, Payments, Reports
 * Refactored to use Supabase Client
 */

import { supabase } from '../../../lib/supabase';

export const financeService = {
    /**
     * Get TU (Keuangan) dashboard data
     */
    async getTuDashboard() {
        try {
            const { data: result, error } = await supabase.rpc('get_tu_financial_dashboard');

            if (error) throw error;
            if (!result?.success) throw new Error(result?.message || 'Gagal memuat dashboard keuangan');

            return {
                stats: result.stats,
                monthlyTrend: result.monthlyTrend || [],
                recentTransactions: result.recentTransactions || [],
                paymentMethods: result.paymentMethods || []
            };
        } catch (error) {
            console.error('getTuDashboard error:', error);
            throw error;
        }
    },

    /**
     * Get all payment types
     */
    async getPaymentTypes() {
        try {
            const { data, error } = await supabase.rpc('get_payment_types');
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('getPaymentTypes error:', error);
            throw error;
        }
    },

    /**
     * Create a new payment type
     */
    async createPaymentType(nama, nominal, isRecurring = false, billingCycle = 'Bulanan') {
        try {
            const { data, error } = await supabase.rpc('create_payment_type', {
                p_nama: nama,
                p_nominal_default: nominal,
                p_is_recurring: isRecurring,
                p_billing_cycle: billingCycle
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('createPaymentType error:', error);
            throw error;
        }
    },

    /**
     * Update an existing payment type
     */
    async updatePaymentType(id, nama, nominal, isRecurring = false, description = '', isActive = true, billingCycle = 'Bulanan') {
        try {
            const { data, error } = await supabase.rpc('update_payment_type', {
                p_id: id,
                p_nama: nama,
                p_nominal_default: nominal,
                p_is_recurring: isRecurring,
                p_description: description,
                p_is_active: isActive,
                p_billing_cycle: billingCycle
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('updatePaymentType error:', error);
            throw error;
        }
    },

    /**
     * Delete a payment type
     */
    async deletePaymentType(id) {
        try {
            const { data, error } = await supabase.rpc('delete_payment_type', { p_id: id });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('deletePaymentType error:', error);
            throw error;
        }
    },

    /**
     * Get invoices list with filters
     */
    async getInvoices({ page = 1, limit = 20, status = null, studentId = null, classId = null, month = null, year = null }) {
        try {
            const { data, error } = await supabase.rpc('get_invoices', {
                p_page: parseInt(page) || 1,
                p_limit: parseInt(limit) || 20,
                p_status: status === 'all' || !status ? null : status,
                p_siswa_id: parseInt(studentId) || null,
                p_class_id: parseInt(classId) || null,
                p_month: parseInt(month) || null,
                p_year: parseInt(year) || null
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getInvoices error:', error);
            throw error;
        }
    },

    /**
     * Get billable invoices (unpaid + partial) with payment progress
     */
    async getBillableInvoices(siswaId) {
        try {
            const { data, error } = await supabase.rpc('get_billable_invoices', {
                p_siswa_id: parseInt(siswaId) || null
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getBillableInvoices error:', error);
            throw error;
        }
    },

    /**
     * Create a single invoice
     */
    async createInvoiceSingle(siswaId, paymentTypeId, nominal, month, year, dueDate, notes = '') {
        try {
            const { data, error } = await supabase.rpc('create_invoice_single', {
                p_siswa_id: parseInt(siswaId) || null,
                p_payment_type_id: parseInt(paymentTypeId) || null,
                p_nominal: parseFloat(nominal) || 0,
                p_bulan: parseInt(month) || null,
                p_tahun: parseInt(year) || null,
                p_due_date: dueDate,
                p_notes: notes
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('createInvoiceSingle error:', error);
            throw error;
        }
    },

    /**
     * Create invoice batch for a class (or all classes if classId is null)
     */
    async createInvoiceBatch(paymentTypeId, classId, month, year, dueDate) {
        try {
            const { data, error } = await supabase.rpc('create_invoice_batch', {
                p_payment_type_id: parseInt(paymentTypeId) || null,
                p_class_id: classId ? parseInt(classId) : null,
                p_bulan: parseInt(month) || null,
                p_tahun: parseInt(year) || null,
                p_due_date: dueDate
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('createInvoiceBatch error:', error);
            throw error;
        }
    },

    /**
     * Check if batch invoice already exists
     */
    async checkBatchInvoiceExists(paymentTypeId, month, year, classId = null) {
        try {
            const { data, error } = await supabase.rpc('check_batch_invoice_exists', {
                p_payment_type_id: parseInt(paymentTypeId) || null,
                p_bulan: parseInt(month) || null,
                p_tahun: parseInt(year) || null,
                p_class_id: classId ? parseInt(classId) : null
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('checkBatchInvoiceExists error:', error);
            throw error;
        }
    },

    /**
     * Record a payment
     */
    async recordPayment(invoiceId, amount, method) {
        try {
            const { data, error } = await supabase.rpc('record_payment', {
                p_invoice_id: invoiceId,
                p_amount: amount,
                p_method: method
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('recordPayment error:', error);
            throw error;
        }
    },

    /**
     * Get payments list with filters
     */
    async getPayments({ page = 1, limit = 20, search = '', method = null, startDate = null, endDate = null, paymentTypeId = null }) {
        try {
            const { data, error } = await supabase.rpc('get_payments', {
                p_page: page,
                p_limit: limit,
                p_search: search,
                p_method: method,
                p_start_date: startDate,
                p_end_date: endDate,
                p_payment_type_id: paymentTypeId
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getPayments error:', error);
            throw error;
        }
    },

    /**
     * Get daily finance recap
     */
    async getDailyFinanceRecap(date) {
        try {
            const { data, error } = await supabase.rpc('get_daily_finance_recap', { p_date: date });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getDailyFinanceRecap error:', error);
            throw error;
        }
    },

    /**
     * Void an invoice
     */
    async voidInvoice(invoiceId) {
        try {
            const { data, error } = await supabase.rpc('void_invoice', { p_id: invoiceId });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('voidInvoice error:', error);
            throw error;
        }
    },

    /**
     * Get billing stats per class
     */
    async getBillingStatsByClass() {
        try {
            const { data, error } = await supabase.rpc('get_billing_stats_by_class');
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getBillingStatsByClass error:', error);
            throw error;
        }
    },

    /**
     * Get billing summary per student for a specific class
     */
    async getStudentBillingSummary(classId) {
        try {
            const { data, error } = await supabase.rpc('get_student_billing_summary', { p_class_id: parseInt(classId) || null });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getStudentBillingSummary error:', error);
            throw error;
        }
    },

    /**
     * Get expense categories
     */
    async getExpenseCategories() {
        try {
            const { data, error } = await supabase.rpc('get_expense_categories');
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('getExpenseCategories error:', error);
            throw error;
        }
    },

    /**
     * Get expense statistics
     */
    async getExpenseStats() {
        try {
            const { data, error } = await supabase.rpc('get_expense_stats');
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('getExpenseStats error:', error);
            throw error;
        }
    },

    /**
     * Get expenses with search and pagination
     */
    async getExpenses({ search = '', categoryId = null, status = null, limit = 10, offset = 0 } = {}) {
        try {
            const { data, error } = await supabase.rpc('get_expenses', {
                p_search: search,
                p_category_id: categoryId,
                p_status: status,
                p_limit: limit,
                p_offset: offset
            });
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('getExpenses error:', error);
            throw error;
        }
    },

    /**
     * Create expense
     */
    async createExpense(data) {
        try {
            const { data: result, error } = await supabase.rpc('create_expense', {
                p_category_id: data.categoryId || data.category_id,
                p_description: data.description,
                p_amount: data.amount,
                p_transaction_date: data.transactionDate || data.transaction_date,
                p_pic: data.pic,
                p_status: data.status || 'Approved',
                p_proof_url: data.proofUrl || data.proof_url
            });
            if (error) throw error;
            return result;
        } catch (error) {
            console.error('createExpense error:', error);
            throw error;
        }
    },

    /**
     * Update expense
     */
    async updateExpense(id, data) {
        try {
            const { data: result, error } = await supabase.rpc('update_expense', {
                p_id: id,
                p_category_id: data.categoryId || data.category_id,
                p_description: data.description,
                p_amount: data.amount,
                p_transaction_date: data.transactionDate || data.transaction_date,
                p_pic: data.pic,
                p_status: data.status,
                p_proof_url: data.proofUrl || data.proof_url
            });
            if (error) throw error;
            return result;
        } catch (error) {
            console.error('updateExpense error:', error);
            throw error;
        }
    },

    /**
     * Delete expense
     */
    async deleteExpense(id) {
        try {
            const { data: result, error } = await supabase.rpc('delete_expense', { p_id: id });
            if (error) throw error;
            return result;
        } catch (error) {
            console.error('deleteExpense error:', error);
            throw error;
        }
    },

    /**
     * Get expense breakdown for reports
     */
    async getExpenseBreakdown(startDate = null, endDate = null) {
        try {
            const { data, error } = await supabase.rpc('get_expense_breakdown', {
                p_start_date: startDate,
                p_end_date: endDate
            });
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('getExpenseBreakdown error:', error);
            throw error;
        }
    },

    /**
     * Get financial transaction log (combined income and expense)
     */
    async getFinancialTransactionLog(startDate = null, endDate = null, type = 'all', category = 'all') {
        try {
            const { data, error } = await supabase.rpc('get_financial_transaction_log', {
                p_start_date: startDate,
                p_end_date: endDate,
                p_type: type,
                p_category: category
            });
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('getFinancialTransactionLog error:', error);
            throw error;
        }
    },

    /**
     * Get financial report summary (for LaporanPage)
     */
    async getFinancialReportSummary(startDate = null, endDate = null) {
        try {
            // Fetch dashboard stats and daily trend in parallel
            const [dashboardData, dailyTrend] = await Promise.all([
                supabase.rpc('get_tu_financial_dashboard'),
                supabase.rpc('get_daily_financial_trend', {
                    p_start_date: startDate,
                    p_end_date: endDate
                })
            ]);

            const dashboardResult = dashboardData.data;
            const trendResult = dailyTrend.data;

            if (dashboardResult?.success) {
                const stats = dashboardResult.stats || {};
                return {
                    success: true,
                    data: {
                        total_income: stats.totalPemasukan || 0,
                        total_expense: stats.totalPengeluaran || 0,
                        net_cash_flow: (stats.totalPemasukan || 0) - (stats.totalPengeluaran || 0),
                        daily_trend: trendResult || []
                    }
                };
            }
            throw new Error(dashboardResult?.message || 'Gagal memuat ringkasan laporan');
        } catch (error) {
            console.error('getFinancialReportSummary error:', error);
            throw error;
        }
    },

    /**
     * Get arrears report for LaporanPage (supports optional class filter)
     */
    async getArrearsReport(classId = null) {
        try {
            const { data, error } = await supabase.rpc('get_arrears_report_table', {
                p_class_id: classId ? parseInt(classId) : null
            });
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('getArrearsReport error:', error);
            throw error;
        }
    },

    /**
     * Get children for a wali murid
     */
    async getWaliMuridChildren(userId) {
        try {
            const { data: children, error } = await supabase.rpc('get_wali_children', { p_user_id: userId });

            if (error) throw error;
            return children || [];
        } catch (error) {
            console.error('getWaliMuridChildren error:', error);
            throw error;
        }
    },

    /**
     * Get invoices for a specific child
     */
    async getChildInvoices(studentId, status = 'all') {
        try {
            return await this.getInvoices({
                studentId,
                status: status === 'all' ? undefined : status,
                limit: 100
            });
        } catch (error) {
            console.error('getChildInvoices error:', error);
            throw error;
        }
    }
};

export default financeService;
