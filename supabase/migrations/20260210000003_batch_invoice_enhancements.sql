-- Migration: Batch Invoice Enhancements
-- Created at: 2026-02-10 11:10

-- 1. Add unique constraint to invoices (excluding voided ones)
-- This ensures a student cannot have the same type of bill for the same month/year twice.
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_unique_billing 
ON public.invoices (siswa_id, payment_type_id, bulan, tahun) 
WHERE status != 'void';

-- 2. Update create_invoice_batch to support All Classes (NULL p_class_id)
CREATE OR REPLACE FUNCTION public.create_invoice_batch(
    p_payment_type_id INTEGER,
    p_class_id INTEGER DEFAULT NULL,
    p_bulan INTEGER DEFAULT NULL,
    p_tahun INTEGER DEFAULT NULL,
    p_due_date DATE DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_nominal decimal(12,2);
    v_count int := 0;
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Get nominal from payment type
    SELECT nominal_default INTO v_nominal
    FROM public.payment_types
    WHERE id = p_payment_type_id;

    IF v_nominal IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Invalid payment type');
    END IF;

    -- Insert Invoices for active students
    -- If p_class_id is NULL, it applies to all classes
    INSERT INTO public.invoices (siswa_id, payment_type_id, bulan, tahun, nominal, status, jatuh_tempo)
    SELECT id, p_payment_type_id, p_bulan, p_tahun, v_nominal, 'unpaid', p_due_date
    FROM public.siswa
    WHERE (p_class_id IS NULL OR kelas_id = p_class_id) 
      AND status = 'aktif'
    ON CONFLICT (siswa_id, payment_type_id, bulan, tahun) WHERE status != 'void' DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN json_build_object(
        'success', true,
        'created', v_count
    );
END;
$$;

-- 3. New function to check if batch invoice already exists for a class/period
CREATE OR REPLACE FUNCTION public.check_batch_invoice_exists(
    p_payment_type_id INTEGER,
    p_bulan INTEGER,
    p_tahun INTEGER,
    p_class_id INTEGER DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_exists BOOLEAN;
    v_message TEXT;
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT EXISTS (
        SELECT 1 
        FROM public.invoices i
        JOIN public.siswa s ON i.siswa_id = s.id
        WHERE i.payment_type_id = p_payment_type_id
          AND i.bulan = p_bulan
          AND i.tahun = p_tahun
          AND (p_class_id IS NULL OR s.kelas_id = p_class_id)
          AND i.status != 'void'
    ) INTO v_exists;

    v_message := CASE 
        WHEN v_exists AND p_class_id IS NOT NULL THEN 'Tagihan ini sudah pernah dibuat untuk kelas tersebut.'
        WHEN v_exists AND p_class_id IS NULL THEN 'Tagihan ini sudah pernah dibuat untuk beberapa/semua kelas.'
        ELSE 'Belum ada tagihan.'
    END;

    RETURN json_build_object(
        'exists', v_exists,
        'message', v_message
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_invoice_batch(INTEGER, INTEGER, INTEGER, INTEGER, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_batch_invoice_exists(INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
