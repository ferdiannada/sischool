-- Resolve function overloading for get_financial_transaction_log
-- Fixed version: Explicitly cast all string columns to TEXT to avoid type mismatch (VARCHAR vs TEXT)

-- 1. Drop existing versions
DROP FUNCTION IF EXISTS public.get_financial_transaction_log(DATE, DATE, TEXT, TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_financial_transaction_log(DATE, DATE, VARCHAR, VARCHAR, INTEGER, INTEGER);

-- 2. Create the definitive version using TEXT
CREATE OR REPLACE FUNCTION public.get_financial_transaction_log(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_type TEXT DEFAULT 'all',
    p_category TEXT DEFAULT 'all',
    p_limit INTEGER DEFAULT NULL,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id TEXT,
    date DATE,
    type TEXT,
    category TEXT,
    description TEXT,
    pic TEXT,
    amount NUMERIC,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    RETURN QUERY
    WITH transactions AS (
        -- Income (Payments)
        SELECT 
            ('INC-' || p.id::TEXT)::TEXT AS id,
            p.tanggal_bayar::DATE AS date,
            'Pemasukan'::TEXT AS type,
            pt.nama::TEXT AS category,
            ('Pembayaran ' || pt.nama || ' - ' || u.full_name)::TEXT AS description,
            u.full_name::TEXT AS pic,
            p.nominal AS amount,
            'Lunas'::TEXT AS status
        FROM public.payments p
        JOIN public.invoices i ON p.invoice_id = i.id
        JOIN public.siswa s ON i.siswa_id = s.id
        JOIN public.users u ON s.user_id = u.id
        JOIN public.payment_types pt ON i.payment_type_id = pt.id
        WHERE 
            (p_start_date IS NULL OR p.tanggal_bayar::DATE >= p_start_date)
            AND (p_end_date IS NULL OR p.tanggal_bayar::DATE <= p_end_date)
            AND (p_type = 'all' OR p_type = 'income')

        UNION ALL

        -- Expenses
        SELECT 
            ('EXP-' || e.id::TEXT)::TEXT AS id,
            e.transaction_date AS date,
            'Pengeluaran'::TEXT AS type,
            COALESCE(ec.name::TEXT, 'Uncategorized'::TEXT)::TEXT AS category,
            e.description::TEXT AS description,
            e.pic::TEXT AS pic,
            e.amount AS amount,
            e.status::TEXT AS status
        FROM public.expenses e
        LEFT JOIN public.expense_categories ec ON e.category_id = ec.id
        WHERE 
            (p_start_date IS NULL OR e.transaction_date >= p_start_date)
            AND (p_end_date IS NULL OR e.transaction_date <= p_end_date)
            AND (p_type = 'all' OR p_type = 'expense')
            AND (p_category = 'all' OR ec.name::TEXT = p_category)
    )
    SELECT 
        t.id,
        t.date,
        t.type,
        t.category,
        t.description,
        t.pic,
        t.amount,
        t.status
    FROM transactions t
    ORDER BY t.date DESC, t.id DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- Grant permissions
GRANT ALL ON FUNCTION public.get_financial_transaction_log(DATE, DATE, TEXT, TEXT, INTEGER, INTEGER) TO anon;
GRANT ALL ON FUNCTION public.get_financial_transaction_log(DATE, DATE, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT ALL ON FUNCTION public.get_financial_transaction_log(DATE, DATE, TEXT, TEXT, INTEGER, INTEGER) TO service_role;
