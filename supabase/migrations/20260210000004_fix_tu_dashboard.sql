-- Migration: Fix TU Financial Dashboard
-- Created at: 2026-02-10 12:45
-- Purpose: Provide aggregated financial data for TU Dashboard

CREATE OR REPLACE FUNCTION public.get_tu_financial_dashboard()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_total_pemasukan NUMERIC;
    v_total_pengeluaran NUMERIC;
    v_total_tunggakan NUMERIC;
    v_kas_saat_ini NUMERIC;
    v_monthly_trend json;
    v_recent_transactions json;
    v_payment_methods json;
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- 1. Calculate Stats (All Time / Current Context)
    -- Total Pemasukan (All confirmed payments)
    SELECT COALESCE(SUM(nominal), 0) INTO v_total_pemasukan
    FROM public.payments;

    -- Total Pengeluaran (All approved expenses)
    SELECT COALESCE(SUM(amount), 0) INTO v_total_pengeluaran
    FROM public.expenses
    WHERE status = 'Approved';

    -- Total Tunggakan (Unpaid + Partial)
    SELECT COALESCE(SUM(
        CASE 
            WHEN status = 'unpaid' THEN nominal
            WHEN status = 'partial' THEN (
                nominal - COALESCE((
                    SELECT SUM(p.nominal) 
                    FROM public.payments p 
                    WHERE p.invoice_id = invoices.id
                ), 0)
            )
            ELSE 0
        END
    ), 0) INTO v_total_tunggakan
    FROM public.invoices
    WHERE status IN ('unpaid', 'partial');

    -- Kas Saat Ini (Pemasukan - Pengeluaran)
    v_kas_saat_ini := v_total_pemasukan - v_total_pengeluaran;

    -- 2. Monthly Trend (Last 6 Months)
    WITH months AS (
        SELECT generate_series(
            date_trunc('month', CURRENT_DATE - INTERVAL '5 months'),
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
        ) AS month_start
    ),
    monthly_income AS (
        SELECT 
            date_trunc('month', tanggal_bayar) AS month,
            SUM(nominal) as total
        FROM public.payments
        WHERE tanggal_bayar >= (CURRENT_DATE - INTERVAL '6 months')
        GROUP BY 1
    ),
    monthly_expense AS (
        SELECT 
            date_trunc('month', transaction_date) AS month,
            SUM(amount) as total
        FROM public.expenses
        WHERE status = 'Approved' 
          AND transaction_date >= (CURRENT_DATE - INTERVAL '6 months')
        GROUP BY 1
    )
    SELECT json_agg(
        json_build_object(
            'name', TO_CHAR(m.month_start, 'Mon YYYY'),
            'pemasukan', COALESCE(i.total, 0),
            'pengeluaran', COALESCE(e.total, 0)
        ) ORDER BY m.month_start
    ) INTO v_monthly_trend
    FROM months m
    LEFT JOIN monthly_income i ON i.month = m.month_start
    LEFT JOIN monthly_expense e ON e.month = m.month_start;

    -- 3. Recent Transactions (Combined Limit 5)
    -- We'll reuse get_financial_transaction_log logic but simplified for dashboard
    SELECT json_agg(t) INTO v_recent_transactions
    FROM (
        SELECT * FROM public.get_financial_transaction_log(NULL, NULL, 'all', 'all', 5, 0)
    ) t;

    -- 4. Payment Methods Distribution
    SELECT json_agg(
        json_build_object(
            'name', CASE 
                WHEN metode_bayar = 'cash' THEN 'Tunai'
                WHEN metode_bayar = 'transfer' THEN 'Transfer Bank'
                ELSE INITCAP(metode_bayar)
            END,
            'value', count
        )
    ) INTO v_payment_methods
    FROM (
        SELECT metode_bayar, COUNT(*) as count
        FROM public.payments
        GROUP BY metode_bayar
    ) pm;

    RETURN json_build_object(
        'success', true,
        'stats', json_build_object(
            'totalPemasukan', v_total_pemasukan,
            'totalPengeluaran', v_total_pengeluaran,
            'totalTunggakan', v_total_tunggakan,
            'kasSaatIni', v_kas_saat_ini
        ),
        'monthlyTrend', COALESCE(v_monthly_trend, '[]'::json),
        'recentTransactions', COALESCE(v_recent_transactions, '[]'::json),
        'paymentMethods', COALESCE(v_payment_methods, '[]'::json)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_tu_financial_dashboard() TO authenticated;
