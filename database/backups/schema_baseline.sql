


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "auth";


ALTER SCHEMA "auth" OWNER TO "supabase_admin";


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "auth"."aal_level" AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE "auth"."aal_level" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."code_challenge_method" AS ENUM (
    's256',
    'plain'
);


ALTER TYPE "auth"."code_challenge_method" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."factor_status" AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE "auth"."factor_status" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."factor_type" AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE "auth"."factor_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_authorization_status" AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE "auth"."oauth_authorization_status" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_client_type" AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE "auth"."oauth_client_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_registration_type" AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE "auth"."oauth_registration_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."oauth_response_type" AS ENUM (
    'code'
);


ALTER TYPE "auth"."oauth_response_type" OWNER TO "supabase_auth_admin";


CREATE TYPE "auth"."one_time_token_type" AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE "auth"."one_time_token_type" OWNER TO "supabase_auth_admin";


CREATE OR REPLACE FUNCTION "auth"."email"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION "auth"."email"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."email"() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';



CREATE OR REPLACE FUNCTION "auth"."jwt"() RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION "auth"."jwt"() OWNER TO "supabase_auth_admin";


CREATE OR REPLACE FUNCTION "auth"."role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION "auth"."role"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."role"() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';



CREATE OR REPLACE FUNCTION "auth"."uid"() RETURNS "uuid"
    LANGUAGE "sql" STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION "auth"."uid"() OWNER TO "supabase_auth_admin";


COMMENT ON FUNCTION "auth"."uid"() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';



CREATE OR REPLACE FUNCTION "public"."assign_ketua_kelas"("p_kelas_id" integer, "p_siswa_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_wali_kelas_id UUID;
    v_current_ketua_id UUID;
    v_ketua_role_id INTEGER;
    v_siswa_kelas_id INTEGER;
    v_student_name TEXT;
BEGIN
    -- Get the ketua_kelas role id
    SELECT id INTO v_ketua_role_id FROM public.roles WHERE name = 'ketua_kelas';
    
    IF v_ketua_role_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Role ketua_kelas tidak ditemukan');
    END IF;

    -- Get the wali_kelas_id and current_ketua_id for this kelas
    SELECT wali_kelas_id, ketua_kelas_id 
    INTO v_wali_kelas_id, v_current_ketua_id
    FROM public.kelas 
    WHERE id = p_kelas_id;
    
    IF v_wali_kelas_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kelas tidak ditemukan');
    END IF;
    
    -- Validate that the current user is the wali kelas
    IF v_wali_kelas_id != auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Anda bukan wali kelas untuk kelas ini');
    END IF;
    
    -- Validate that the student belongs to this class
    SELECT s.kelas_id, u.full_name
    INTO v_siswa_kelas_id, v_student_name
    FROM public.siswa s
    JOIN public.users u ON s.user_id = u.id
    WHERE s.user_id = p_siswa_user_id AND s.status = 'aktif';
    
    IF v_siswa_kelas_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Siswa tidak ditemukan');
    END IF;
    
    IF v_siswa_kelas_id != p_kelas_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Siswa bukan anggota kelas ini');
    END IF;
    
    -- If this student is already ketua kelas, do nothing
    IF v_current_ketua_id = p_siswa_user_id THEN
        RETURN jsonb_build_object('success', true, 'message', 'Siswa sudah menjadi ketua kelas', 'student_name', v_student_name);
    END IF;
    
    -- Remove ketua_kelas role from previous ketua (if any)
    IF v_current_ketua_id IS NOT NULL THEN
        DELETE FROM public.user_roles 
        WHERE user_id = v_current_ketua_id AND role_id = v_ketua_role_id;
    END IF;
    
    -- Assign ketua_kelas role to new student
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (p_siswa_user_id, v_ketua_role_id)
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
    -- Update kelas.ketua_kelas_id
    UPDATE public.kelas 
    SET ketua_kelas_id = p_siswa_user_id, updated_at = NOW()
    WHERE id = p_kelas_id;
    
    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Berhasil menunjuk ketua kelas baru',
        'student_name', v_student_name,
        'student_id', p_siswa_user_id
    );
END;
$$;


ALTER FUNCTION "public"."assign_ketua_kelas"("p_kelas_id" integer, "p_siswa_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_wali_to_student"("p_siswa_id" integer, "p_wali_user_id" "uuid", "p_hubungan" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_wali_id int;
BEGIN
    -- 1. Ensure User has Wali Murid Profile
    SELECT id INTO v_wali_id FROM public.wali_murid WHERE user_id = p_wali_user_id;

    IF v_wali_id IS NULL THEN
        INSERT INTO public.wali_murid (user_id, hubungan)
        VALUES (p_wali_user_id, p_hubungan)
        RETURNING id INTO v_wali_id;
        
        -- Also assign 'wali_murid' role if not exists
        INSERT INTO public.user_roles (user_id, role_id)
        SELECT p_wali_user_id, r.id
        FROM public.roles r
        WHERE r.name = 'wali_murid'
        ON CONFLICT (user_id, role_id) DO NOTHING;
    ELSE
        -- Update default Hubungan if null
        UPDATE public.wali_murid 
        SET hubungan = p_hubungan 
        WHERE id = v_wali_id AND hubungan IS NULL;
    END IF;

    -- 2. Create Relation
    INSERT INTO public.siswa_wali (siswa_id, wali_id, is_primary)
    VALUES (p_siswa_id, v_wali_id, NOT EXISTS(SELECT 1 FROM public.siswa_wali WHERE siswa_id = p_siswa_id))
    ON CONFLICT (siswa_id, wali_id) DO UPDATE
    SET is_primary = EXCLUDED.is_primary; -- No change effectively, just avoid error

    RETURN json_build_object(
        'success', true,
        'message', 'Berhasil menetapkan wali murid'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."assign_wali_to_student"("p_siswa_id" integer, "p_wali_user_id" "uuid", "p_hubungan" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_and_assign_wali"("p_siswa_id" integer, "p_user_id" "uuid", "p_hubungan" "text", "p_phone" "text" DEFAULT NULL::"text", "p_pekerjaan" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_wali_id INT;
    v_role_id INT;
BEGIN
    -- 1. Ensure user has 'wali_murid' role
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'wali_murid';
    
    IF v_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (p_user_id, v_role_id)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    -- 2. Ensure Wali Murid Profile exists
    SELECT id INTO v_wali_id FROM public.wali_murid WHERE user_id = p_user_id;

    IF v_wali_id IS NULL THEN
        INSERT INTO public.wali_murid (user_id, hubungan, pekerjaan)
        VALUES (p_user_id, p_hubungan, p_pekerjaan)
        RETURNING id INTO v_wali_id;
    ELSE
        -- Update existing profile if fields provided
        UPDATE public.wali_murid
        SET 
            hubungan = COALESCE(p_hubungan, hubungan),
            pekerjaan = COALESCE(p_pekerjaan, pekerjaan)
        WHERE id = v_wali_id;
    END IF;

    -- 3. Update Phone in public.users if provided
    IF p_phone IS NOT NULL THEN
        UPDATE public.users SET phone = p_phone WHERE id = p_user_id;
    END IF;

    -- 4. Create Link (Siswa - Wali)
    INSERT INTO public.siswa_wali (siswa_id, wali_id, is_primary)
    VALUES (
        p_siswa_id, 
        v_wali_id, 
        NOT EXISTS(SELECT 1 FROM public.siswa_wali WHERE siswa_id = p_siswa_id) -- First one is primary
    )
    ON CONFLICT (siswa_id, wali_id) DO UPDATE
    SET is_primary = EXCLUDED.is_primary; -- No effective change, just avoid error

    RETURN json_build_object(
        'success', true,
        'message', 'Berhasil menghubungkan wali murid'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."create_and_assign_wali"("p_siswa_id" integer, "p_user_id" "uuid", "p_hubungan" "text", "p_phone" "text", "p_pekerjaan" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_class"("p_nama" "text", "p_tingkat" integer, "p_tahun_ajaran_id" integer, "p_wali_kelas_id" "uuid" DEFAULT NULL::"uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    INSERT INTO public.kelas (nama, tingkat, tahun_ajaran_id, wali_kelas_id)
    VALUES (p_nama, p_tingkat, p_tahun_ajaran_id, p_wali_kelas_id);

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."create_class"("p_nama" "text", "p_tingkat" integer, "p_tahun_ajaran_id" integer, "p_wali_kelas_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_expense"("p_category_id" integer, "p_description" "text", "p_amount" numeric, "p_transaction_date" "date", "p_pic" character varying, "p_status" character varying DEFAULT 'Approved'::character varying, "p_proof_url" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_new_id INTEGER;
BEGIN
    INSERT INTO public.expenses (
        category_id,
        description,
        amount,
        transaction_date,
        pic,
        status,
        proof_url
    ) VALUES (
        p_category_id,
        p_description,
        p_amount,
        p_transaction_date,
        p_pic,
        p_status,
        p_proof_url
    )
    RETURNING id INTO v_new_id;

    RETURN jsonb_build_object('success', true, 'id', v_new_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."create_expense"("p_category_id" integer, "p_description" "text", "p_amount" numeric, "p_transaction_date" "date", "p_pic" character varying, "p_status" character varying, "p_proof_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_guru_profile"("p_email" "text", "p_full_name" "text", "p_nip" "text", "p_bidang_studi" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id uuid;
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Look up user by email
    SELECT id INTO v_user_id FROM public.users WHERE email = p_email;

    IF v_user_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'User not found. Invite user first.');
    END IF;

    -- Add 'guru' role
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT v_user_id, id FROM public.roles WHERE name = 'guru'
    ON CONFLICT DO NOTHING;

    -- Create Profile
    INSERT INTO public.guru (user_id, nip, bidang_studi, status)
    VALUES (v_user_id, p_nip, p_bidang_studi, 'aktif')
    ON CONFLICT (user_id) DO UPDATE
    SET nip = EXCLUDED.nip, bidang_studi = EXCLUDED.bidang_studi;

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."create_guru_profile"("p_email" "text", "p_full_name" "text", "p_nip" "text", "p_bidang_studi" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_invoice_batch"("p_payment_type_id" integer, "p_class_id" integer, "p_bulan" integer, "p_tahun" integer, "p_due_date" "date") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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

    -- Insert Invoices for all active students in class
    INSERT INTO public.invoices (siswa_id, payment_type_id, bulan, tahun, nominal, status, jatuh_tempo)
    SELECT id, p_payment_type_id, p_bulan, p_tahun, v_nominal, 'unpaid', p_due_date
    FROM public.siswa
    WHERE kelas_id = p_class_id AND status = 'aktif'
    ON CONFLICT DO NOTHING; -- Avoid duplicates if running again

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN json_build_object(
        'success', true,
        'created', v_count
    );
END;
$$;


ALTER FUNCTION "public"."create_invoice_batch"("p_payment_type_id" integer, "p_class_id" integer, "p_bulan" integer, "p_tahun" integer, "p_due_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_invoice_single"("p_siswa_id" integer, "p_payment_type_id" integer, "p_nominal" numeric, "p_bulan" integer, "p_tahun" integer, "p_due_date" "date") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    INSERT INTO public.invoices (siswa_id, payment_type_id, bulan, tahun, nominal, status, jatuh_tempo)
    VALUES (p_siswa_id, p_payment_type_id, p_bulan, p_tahun, p_nominal, 'unpaid', p_due_date);

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."create_invoice_single"("p_siswa_id" integer, "p_payment_type_id" integer, "p_nominal" numeric, "p_bulan" integer, "p_tahun" integer, "p_due_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_invoice_single"("p_siswa_id" integer, "p_payment_type_id" integer, "p_nominal" numeric, "p_bulan" integer, "p_tahun" integer, "p_due_date" "date", "p_notes" "text" DEFAULT ''::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    INSERT INTO public.invoices (siswa_id, payment_type_id, bulan, tahun, nominal, status, jatuh_tempo, deskripsi)
    VALUES (p_siswa_id, p_payment_type_id, p_bulan, p_tahun, p_nominal, 'unpaid', p_due_date, p_notes);

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."create_invoice_single"("p_siswa_id" integer, "p_payment_type_id" integer, "p_nominal" numeric, "p_bulan" integer, "p_tahun" integer, "p_due_date" "date", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_payment_type"("p_nama" "text", "p_nominal_default" numeric, "p_is_recurring" boolean DEFAULT false) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    INSERT INTO public.payment_types (nama, nominal_default, is_recurring)
    VALUES (p_nama, p_nominal_default, p_is_recurring);

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."create_payment_type"("p_nama" "text", "p_nominal_default" numeric, "p_is_recurring" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_payment_type"("p_nama" "text", "p_nominal_default" numeric, "p_is_recurring" boolean DEFAULT false, "p_billing_cycle" "text" DEFAULT 'Bulanan'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    INSERT INTO public.payment_types (nama, nominal_default, is_recurring, billing_cycle)
    VALUES (p_nama, p_nominal_default, p_is_recurring, p_billing_cycle);

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."create_payment_type"("p_nama" "text", "p_nominal_default" numeric, "p_is_recurring" boolean, "p_billing_cycle" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_siswa_profile"("p_user_id" "uuid", "p_nis" character varying, "p_nisn" character varying, "p_kelas_id" integer, "p_jenis_kelamin" character varying, "p_tanggal_lahir" "date", "p_alamat" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Check permissions (Admin or TU)
    -- Explicitly check user_roles table to avoid context issues with helper functions in SECURITY DEFINER
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND (r.name = 'admin' OR r.name = 'tu')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only Admin or TU can create student profiles';
    END IF;

    INSERT INTO public.siswa (user_id, nis, nisn, kelas_id, jenis_kelamin, tanggal_lahir, alamat, status)
    VALUES (p_user_id, p_nis, p_nisn, p_kelas_id, p_jenis_kelamin, p_tanggal_lahir, p_alamat, 'aktif')
    ON CONFLICT (user_id) DO UPDATE
    SET 
        nis = EXCLUDED.nis,
        nisn = EXCLUDED.nisn,
        kelas_id = EXCLUDED.kelas_id,
        jenis_kelamin = EXCLUDED.jenis_kelamin,
        tanggal_lahir = EXCLUDED.tanggal_lahir,
        alamat = EXCLUDED.alamat;

    RETURN jsonb_build_object('success', true, 'user_id', p_user_id);
END;
$$;


ALTER FUNCTION "public"."create_siswa_profile"("p_user_id" "uuid", "p_nis" character varying, "p_nisn" character varying, "p_kelas_id" integer, "p_jenis_kelamin" character varying, "p_tanggal_lahir" "date", "p_alamat" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_expense"("p_id" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    DELETE FROM public.expenses WHERE id = p_id;
    
    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Expense not found');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."delete_expense"("p_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_payment_type"("p_id" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_usage_count INTEGER;
BEGIN
    -- Check permissions
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Check if used in invoices
    SELECT COUNT(*) INTO v_usage_count FROM public.invoices WHERE payment_type_id = p_id;
    
    IF v_usage_count > 0 THEN
        RETURN json_build_object('success', false, 'message', 'Cannot delete: Data is used in existing invoices.');
    END IF;

    DELETE FROM public.payment_types WHERE id = p_id;

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."delete_payment_type"("p_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_completely"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_siswa_id INT;
    v_wali_ids INT[];
    v_wali_id INT;
    v_wali_user_id UUID;
    v_other_students_count INT;
BEGIN
  -- Verify the user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- 1. Check if this is a Student and get Siswa ID
  SELECT id INTO v_siswa_id FROM public.siswa WHERE user_id = p_user_id;

  IF v_siswa_id IS NOT NULL THEN
     -- 2. Find linked Walis
     -- We use ARRAY to handle cases where multiple walis might exist (though rare)
     SELECT ARRAY_AGG(wali_id) INTO v_wali_ids FROM public.siswa_wali WHERE siswa_id = v_siswa_id;

     IF v_wali_ids IS NOT NULL THEN
        FOREACH v_wali_id IN ARRAY v_wali_ids
        LOOP
            -- 3. Check if this specific Wali is linked to any OTHER students
            SELECT COUNT(*) INTO v_other_students_count 
            FROM public.siswa_wali 
            WHERE wali_id = v_wali_id AND siswa_id != v_siswa_id;

            -- 4. If no other students, find the User ID of the Wali and delete it
            IF v_other_students_count = 0 THEN
                SELECT user_id INTO v_wali_user_id FROM public.wali_murid WHERE id = v_wali_id;
                
                IF v_wali_user_id IS NOT NULL THEN
                    -- Delete the Wali User Account
                    -- Raise notice for debugging
                    RAISE NOTICE 'Deleting orphan Wali User: %', v_wali_user_id;
                    DELETE FROM auth.users WHERE id = v_wali_user_id;
                END IF;
            END IF;
        END LOOP;
     END IF;
  END IF;

  -- 5. Delete the Student User (Target)
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."delete_user_completely"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_dashboard"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    result JSON;
    today_date DATE := CURRENT_DATE;
    total_attendance INTEGER;
    hadir_count INTEGER;
BEGIN
    -- Get today's attendance counts
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'hadir')
    INTO total_attendance, hadir_count
    FROM public.attendances
    WHERE tanggal = today_date;

    SELECT json_build_object(
        'totalSiswa', (SELECT COUNT(*) FROM public.siswa WHERE status = 'aktif'),
        'totalGuru', (SELECT COUNT(*) FROM public.guru WHERE status = 'aktif'),
        'totalKelas', (SELECT COUNT(*) FROM public.kelas),
        'attendanceRate', CASE 
            WHEN total_attendance > 0 
            THEN ROUND((hadir_count::DECIMAL / total_attendance) * 100, 1)::TEXT || '%'
            ELSE '0%'
        END,
        'todayStats', json_build_object(
            'hadir', hadir_count,
            'total', total_attendance
        )
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_admin_dashboard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_gurus"("p_page" integer DEFAULT 1, "p_limit" integer DEFAULT 20, "p_search" "text" DEFAULT ''::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_offset int;
    v_total int;
    v_data json;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    SELECT COUNT(*) INTO v_total
    FROM public.guru g
    JOIN public.users u ON g.user_id = u.id
    WHERE 
        p_search = '' OR 
        u.full_name ILIKE '%' || p_search || '%' OR
        g.nip ILIKE '%' || p_search || '%';

    SELECT json_agg(
        json_build_object(
            'id', g.id,
            'user_id', g.user_id,
            'nip', g.nip,
            'full_name', u.full_name,
            'bidang_studi', g.bidang_studi,
            'status', g.status
        )
    ) INTO v_data
    FROM public.guru g
    JOIN public.users u ON g.user_id = u.id
    WHERE 
        p_search = '' OR 
        u.full_name ILIKE '%' || p_search || '%' OR
        g.nip ILIKE '%' || p_search || '%'
    ORDER BY u.full_name ASC
    LIMIT p_limit OFFSET v_offset;

    RETURN json_build_object(
        'success', true,
        'data', COALESCE(v_data, '[]'::json),
        'total', v_total
    );
END;
$$;


ALTER FUNCTION "public"."get_all_gurus"("p_page" integer, "p_limit" integer, "p_search" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_students"("p_page" integer DEFAULT 1, "p_limit" integer DEFAULT 20, "p_search" "text" DEFAULT ''::"text", "p_class_id" integer DEFAULT NULL::integer, "p_status" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_offset int;
    v_total int;
    v_data json;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    -- Count Total
    SELECT COUNT(*) INTO v_total
    FROM public.siswa s
    JOIN public.users u ON s.user_id = u.id
    WHERE 
        (p_class_id IS NULL OR s.kelas_id = p_class_id) AND
        (p_status IS NULL OR s.status = p_status) AND
        (
            p_search = '' OR 
            u.full_name ILIKE '%' || p_search || '%' OR
            s.nis ILIKE '%' || p_search || '%'
        );

    -- Get Data using Subquery for correct pagination
    SELECT json_agg(
        json_build_object(
            'id', sub.id,
            'user_id', sub.user_id,
            'nis', sub.nis,
            'nisn', sub.nisn,
            'full_name', sub.full_name,
            'gender', sub.jenis_kelamin,
            'class_name', sub.class_name,
            'status', sub.status
        )
    ) INTO v_data
    FROM (
        SELECT 
            s.id,
            s.user_id,
            s.nis,
            s.nisn,
            u.full_name,
            s.jenis_kelamin,
            k.nama as class_name,
            s.status
        FROM public.siswa s
        JOIN public.users u ON s.user_id = u.id
        LEFT JOIN public.kelas k ON s.kelas_id = k.id
        WHERE 
            (p_class_id IS NULL OR s.kelas_id = p_class_id) AND
            (p_status IS NULL OR s.status = p_status) AND
            (
                p_search = '' OR 
                u.full_name ILIKE '%' || p_search || '%' OR
                s.nis ILIKE '%' || p_search || '%'
            )
        ORDER BY k.nama ASC, u.full_name ASC
        LIMIT p_limit OFFSET v_offset
    ) sub;

    RETURN json_build_object(
        'success', true,
        'data', COALESCE(v_data, '[]'::json),
        'total', v_total,
        'page', p_page,
        'limit', p_limit
    );
END;
$$;


ALTER FUNCTION "public"."get_all_students"("p_page" integer, "p_limit" integer, "p_search" "text", "p_class_id" integer, "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_arrears_report"("p_class_id" integer DEFAULT NULL::integer, "p_month" integer DEFAULT NULL::integer, "p_year" integer DEFAULT NULL::integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_data json;
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT json_agg(
        json_build_object(
            'student_id', s.id,
            'nis', s.nis,
            'full_name', u.full_name,
            'class_name', k.nama,
            'invoice_id', i.id,
            'invoice_number', 'INV-' || TO_CHAR(i.created_at, 'YYYYMM') || '-' || LPAD(i.id::text, 5, '0'),
            'payment_type', pt.nama,
            'amount', i.nominal,
            'paid_amount', (SELECT COALESCE(SUM(nominal), 0) FROM public.payments p WHERE p.invoice_id = i.id),
            'remaining', i.nominal - (SELECT COALESCE(SUM(nominal), 0) FROM public.payments p WHERE p.invoice_id = i.id),
            'status', i.status,
            'due_date', i.jatuh_tempo,
            'period', i.bulan || '/' || i.tahun
        ) ORDER BY k.nama ASC, u.full_name ASC
    ) INTO v_data
    FROM public.invoices i
    JOIN public.siswa s ON i.siswa_id = s.id
    JOIN public.users u ON s.user_id = u.id
    LEFT JOIN public.kelas k ON s.kelas_id = k.id
    JOIN public.payment_types pt ON i.payment_type_id = pt.id
    WHERE 
        (i.status = 'unpaid' OR i.status = 'partial') AND
        (p_class_id IS NULL OR s.kelas_id = p_class_id) AND
        (p_month IS NULL OR i.bulan = p_month) AND
        (p_year IS NULL OR i.tahun = p_year);

    RETURN json_build_object(
        'success', true,
        'data', COALESCE(v_data, '[]'::json)
    );
END;
$$;


ALTER FUNCTION "public"."get_arrears_report"("p_class_id" integer, "p_month" integer, "p_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_attendance_recap"("p_kelas_id" integer, "p_start_date" "date", "p_end_date" "date", "p_mata_pelajaran_id" integer DEFAULT NULL::integer) RETURNS TABLE("siswa_id" integer, "siswa_nama" character varying, "siswa_nis" character varying, "hadir" bigint, "izin" bigint, "sakit" bigint, "alpha" bigint, "total_hadir_expected" bigint, "persentase" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH attendance_data AS (
        SELECT 
            a.siswa_id,
            a.status
        FROM public.attendances a
        JOIN public.schedules s ON a.schedule_id = s.id
        WHERE s.kelas_id = p_kelas_id
          AND a.tanggal BETWEEN p_start_date AND p_end_date
          AND (p_mata_pelajaran_id IS NULL OR s.mata_pelajaran_id = p_mata_pelajaran_id)
    )
    SELECT 
        s.id AS siswa_id,
        u.full_name AS siswa_nama,
        s.nis AS siswa_nis,
        COALESCE(count(*) FILTER (WHERE ad.status = 'hadir'), 0)::BIGINT AS hadir,
        COALESCE(count(*) FILTER (WHERE ad.status = 'izin'), 0)::BIGINT AS izin,
        COALESCE(count(*) FILTER (WHERE ad.status = 'sakit'), 0)::BIGINT AS sakit,
        COALESCE(count(*) FILTER (WHERE ad.status = 'alpha'), 0)::BIGINT AS alpha,
        count(ad.status)::BIGINT AS total_hadir_expected,
        CASE 
            WHEN count(ad.status) > 0 THEN 
                ROUND((count(*) FILTER (WHERE ad.status = 'hadir')::NUMERIC / count(ad.status)::NUMERIC) * 100, 2)
            ELSE 0.00
        END AS persentase
    FROM public.siswa s
    JOIN public.users u ON s.user_id = u.id
    LEFT JOIN attendance_data ad ON s.id = ad.siswa_id
    WHERE s.kelas_id = p_kelas_id AND s.status = 'aktif'
    GROUP BY s.id, u.full_name, s.nis
    ORDER BY s.nis ASC;
END;
$$;


ALTER FUNCTION "public"."get_attendance_recap"("p_kelas_id" integer, "p_start_date" "date", "p_end_date" "date", "p_mata_pelajaran_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_billable_invoices"("p_siswa_id" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_data json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', i.id,
            'invoice_number', 'INV-' || TO_CHAR(i.created_at, 'YYYYMM') || '-' || LPAD(i.id::text, 5, '0'),
            'payment_type', pt.nama,
            'amount', i.nominal,
            'paid_amount', COALESCE(p_sum.total_paid, 0),
            'remaining_amount', i.nominal - COALESCE(p_sum.total_paid, 0),
            'status', i.status,
            'due_date', i.jatuh_tempo,
            'period', i.bulan || '/' || i.tahun
        ) ORDER BY i.jatuh_tempo ASC, i.created_at DESC
    ) INTO v_data
    FROM public.invoices i
    JOIN public.payment_types pt ON i.payment_type_id = pt.id
    LEFT JOIN (
        SELECT invoice_id, SUM(nominal) as total_paid
        FROM public.payments
        GROUP BY invoice_id
    ) p_sum ON i.id = p_sum.invoice_id
    WHERE 
        i.siswa_id = p_siswa_id 
        AND i.status IN ('unpaid', 'partial');

    RETURN json_build_object(
        'success', true,
        'data', COALESCE(v_data, '[]'::json)
    );
END;
$$;


ALTER FUNCTION "public"."get_billable_invoices"("p_siswa_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_billing_stats_by_class"() RETURNS TABLE("class_id" bigint, "class_name" "text", "total_students" bigint, "total_unpaid_students" bigint, "total_unpaid_invoices" bigint, "total_unpaid_amount" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.id::BIGINT as class_id,
        k.nama::TEXT as class_name,
        COUNT(DISTINCT s.id)::BIGINT as total_students,
        COUNT(DISTINCT s.id) FILTER (WHERE i.status IN ('unpaid', 'partial'))::BIGINT as total_unpaid_students,
        COUNT(i.id) FILTER (WHERE i.status IN ('unpaid', 'partial'))::BIGINT as total_unpaid_invoices,
        COALESCE(SUM(
            CASE 
                WHEN i.status = 'unpaid' THEN i.nominal
                WHEN i.status = 'partial' THEN (
                    i.nominal - COALESCE((
                        SELECT SUM(p.nominal) 
                        FROM public.payments p
                        WHERE p.invoice_id = i.id
                    ), 0)
                )
                ELSE 0
            END
        ), 0)::NUMERIC as total_unpaid_amount
    FROM 
        public.kelas k
    LEFT JOIN 
        public.siswa s ON k.id = s.kelas_id AND s.status = 'aktif'
    LEFT JOIN 
        public.invoices i ON s.id = i.siswa_id
    GROUP BY 
        k.id, k.nama
    ORDER BY 
        k.nama;
END;
$$;


ALTER FUNCTION "public"."get_billing_stats_by_class"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_classes_by_academic_year"("p_academic_year_id" integer) RETURNS TABLE("id" integer, "nama" character varying, "tingkat" integer, "kapasitas" integer, "student_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        k.id,
        k.nama,
        k.tingkat,
        k.kapasitas,
        (SELECT COUNT(*) FROM public.siswa s WHERE s.kelas_id = k.id AND s.status = 'aktif') as student_count
    FROM public.kelas k
    WHERE k.tahun_ajaran_id = p_academic_year_id
    ORDER BY k.tingkat ASC, k.nama ASC;
END;
$$;


ALTER FUNCTION "public"."get_classes_by_academic_year"("p_academic_year_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_daily_finance_recap"("p_date" "date") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_total_cash decimal := 0;
    v_total_transfer decimal := 0;
    v_total_transactions int := 0;
    v_transactions json;
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Calculate Totals
    SELECT 
        COALESCE(SUM(CASE WHEN metode_bayar = 'cash' THEN nominal ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN metode_bayar = 'transfer' THEN nominal ELSE 0 END), 0),
        COUNT(*)
    INTO v_total_cash, v_total_transfer, v_total_transactions
    FROM public.payments
    WHERE DATE(tanggal_bayar) = p_date;

    -- Get Transaction Details
    SELECT json_agg(
        json_build_object(
            'id', p.id,
            'time', p.tanggal_bayar,
            'student_name', u.full_name,
            'class_name', k.nama,
            'type', pt.nama,
            'amount', p.nominal,
            'method', p.metode_bayar,
            'received_by', ru.full_name
        ) ORDER BY p.tanggal_bayar DESC
    ) INTO v_transactions
    FROM public.payments p
    JOIN public.siswa s ON p.siswa_id = s.id
    JOIN public.users u ON s.user_id = u.id
    LEFT JOIN public.kelas k ON s.kelas_id = k.id
    JOIN public.invoices i ON p.invoice_id = i.id
    JOIN public.payment_types pt ON i.payment_type_id = pt.id
    LEFT JOIN public.users ru ON p.received_by = ru.id
    WHERE DATE(p.tanggal_bayar) = p_date;

    RETURN json_build_object(
        'success', true,
        'date', p_date,
        'summary', json_build_object(
            'total_cash', v_total_cash,
            'total_transfer', v_total_transfer,
            'total_transactions', v_total_transactions,
            'grand_total', v_total_cash + v_total_transfer
        ),
        'transactions', COALESCE(v_transactions, '[]'::json)
    );
END;
$$;


ALTER FUNCTION "public"."get_daily_finance_recap"("p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_expense_breakdown"("p_start_date" "date", "p_end_date" "date") RETURNS TABLE("category_name" "text", "total_amount" numeric, "percentage" numeric)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_total_all_expenses NUMERIC;
BEGIN
    -- Get total for percentage calculation
    SELECT COALESCE(SUM(amount), 0) INTO v_total_all_expenses
    FROM public.expenses
    WHERE transaction_date >= p_start_date AND transaction_date <= p_end_date;

    RETURN QUERY
    SELECT 
        COALESCE(ec.name::TEXT, 'Uncategorized') as category_name,
        SUM(e.amount) as total_amount,
        CASE 
            WHEN v_total_all_expenses > 0 THEN (SUM(e.amount) / v_total_all_expenses) * 100 
            ELSE 0 
        END as percentage
    FROM public.expenses e
    LEFT JOIN public.expense_categories ec ON e.category_id = ec.id
    WHERE e.transaction_date >= p_start_date AND e.transaction_date <= p_end_date
    GROUP BY ec.name
    ORDER BY total_amount DESC;
END;
$$;


ALTER FUNCTION "public"."get_expense_breakdown"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_expense_categories"() RETURNS TABLE("id" integer, "name" character varying)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name
    FROM public.expense_categories c
    ORDER BY c.name;
END;
$$;


ALTER FUNCTION "public"."get_expense_categories"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_expense_stats"() RETURNS TABLE("category_id" integer, "category_name" character varying, "budget_limit" numeric, "color" character varying, "total_used" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.budget_limit,
        c.color,
        COALESCE(SUM(e.amount), 0) as total_used
    FROM public.expense_categories c
    LEFT JOIN public.expenses e ON c.id = e.category_id
    GROUP BY c.id, c.name, c.budget_limit, c.color;
END;
$$;


ALTER FUNCTION "public"."get_expense_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_expenses"("p_search" "text" DEFAULT NULL::"text", "p_category_id" integer DEFAULT NULL::integer, "p_limit" integer DEFAULT 10, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" integer, "category_name" character varying, "category_color" character varying, "description" "text", "amount" numeric, "transaction_date" "date", "pic" character varying, "status" character varying, "proof_url" "text", "total_count" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        c.name as category_name,
        c.color as category_color,
        e.description,
        e.amount,
        e.transaction_date,
        e.pic,
        e.status,
        e.proof_url,
        COUNT(*) OVER() as total_count
    FROM public.expenses e
    LEFT JOIN public.expense_categories c ON e.category_id = c.id
    WHERE 
        (p_search IS NULL OR 
         e.description ILIKE '%' || p_search || '%' OR 
         e.pic ILIKE '%' || p_search || '%')
        AND
        (p_category_id IS NULL OR e.category_id = p_category_id)
    ORDER BY e.transaction_date DESC, e.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_expenses"("p_search" "text", "p_category_id" integer, "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_financial_report_summary"("p_start_date" "date", "p_end_date" "date") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_total_income NUMERIC;
    v_total_expense NUMERIC;
    v_daily_trend JSONB;
BEGIN
    -- Calculate Total Income
    -- Fix: Cast tanggal_bayar to DATE to include transactions on p_end_date regardless of time
    SELECT COALESCE(SUM(nominal), 0)
    INTO v_total_income
    FROM public.payments
    WHERE tanggal_bayar::DATE >= p_start_date AND tanggal_bayar::DATE <= p_end_date;

    -- Calculate Total Expense (transaction_date is already DATE, but keeping consistent)
    SELECT COALESCE(SUM(amount), 0)
    INTO v_total_expense
    FROM public.expenses
    WHERE transaction_date >= p_start_date AND transaction_date <= p_end_date;

    -- Calculate Daily Trend
    SELECT jsonb_agg(t)
    INTO v_daily_trend
    FROM (
        SELECT
            d.date::TEXT as date,
            COALESCE(SUM(p.nominal), 0) as income,
            COALESCE(SUM(e.amount), 0) as expense
        FROM generate_series(p_start_date, p_end_date, '1 day'::interval) d(date)
        LEFT JOIN public.payments p ON p.tanggal_bayar::DATE = d.date::DATE
        LEFT JOIN public.expenses e ON e.transaction_date = d.date::DATE
        GROUP BY d.date
        ORDER BY d.date
    ) t;

    RETURN jsonb_build_object(
        'total_income', v_total_income,
        'total_expense', v_total_expense,
        'net_cash_flow', v_total_income - v_total_expense,
        'daily_trend', COALESCE(v_daily_trend, '[]'::jsonb)
    );
END;
$$;


ALTER FUNCTION "public"."get_financial_report_summary"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_financial_transaction_log"("p_start_date" "date", "p_end_date" "date", "p_type" "text" DEFAULT NULL::"text", "p_category" "text" DEFAULT NULL::"text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" "text", "date" "date", "type" "text", "category" "text", "description" "text", "pic" "text", "amount" numeric, "status" "text")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH combined_transactions AS (
        -- Income (Payments)
        -- Fix: Cast tanggal_bayar to DATE
        SELECT 
            'PAY-' || p.id::TEXT as tx_id,
            p.tanggal_bayar::DATE as tx_date,
            'Pemasukan'::TEXT as tx_type,
            pt.nama::TEXT as tx_category,
            ('Pembayaran ' || pt.nama || ' (' || i.bulan || '/' || i.tahun || ')')::TEXT as tx_description,
            'System'::TEXT as tx_pic, 
            p.nominal as tx_amount,
            'Verified'::TEXT as tx_status
        FROM public.payments p
        JOIN public.invoices i ON p.invoice_id = i.id
        JOIN public.payment_types pt ON i.payment_type_id = pt.id
        WHERE p.tanggal_bayar::DATE >= p_start_date AND p.tanggal_bayar::DATE <= p_end_date
        
        UNION ALL
        
        -- Expenses
        SELECT 
            'EXP-' || e.id::TEXT as tx_id,
            e.transaction_date as tx_date,
            'Pengeluaran'::TEXT as tx_type,
            COALESCE(ec.name::TEXT, 'Uncategorized') as tx_category,
            e.description::TEXT as tx_description,
            e.pic::TEXT as tx_pic,
            e.amount as tx_amount,
            e.status::TEXT as tx_status
        FROM public.expenses e
        LEFT JOIN public.expense_categories ec ON e.category_id = ec.id
        WHERE e.transaction_date >= p_start_date AND e.transaction_date <= p_end_date
    )
    SELECT 
        c.tx_id,
        c.tx_date,
        c.tx_type,
        c.tx_category,
        c.tx_description,
        c.tx_pic,
        c.tx_amount,
        c.tx_status
    FROM combined_transactions c
    WHERE 
        (p_type IS NULL OR 
         (p_type = 'income' AND c.tx_type = 'Pemasukan') OR 
         (p_type = 'expense' AND c.tx_type = 'Pengeluaran'))
        AND
        (p_category IS NULL OR c.tx_category ILIKE '%' || p_category || '%')
    ORDER BY c.tx_date DESC, c.tx_id DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_financial_transaction_log"("p_start_date" "date", "p_end_date" "date", "p_type" "text", "p_category" "text", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_guru_classes"("p_guru_id" "uuid") RETURNS TABLE("id" integer, "nama" character varying, "tingkat" character varying)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        k.id,
        k.nama,
        k.tingkat::VARCHAR
    FROM public.schedules s
    JOIN public.kelas k ON s.kelas_id = k.id
    JOIN public.guru g ON s.guru_id = g.id
    WHERE g.user_id = p_guru_id
    ORDER BY k.nama;
END;
$$;


ALTER FUNCTION "public"."get_guru_classes"("p_guru_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_guru_daily_schedules"("p_guru_id" "uuid", "p_date" "date") RETURNS TABLE("id" integer, "kelas_id" integer, "kelas_nama" character varying, "mata_pelajaran_id" integer, "mata_pelajaran_nama" character varying, "jam_mulai" time without time zone, "jam_selesai" time without time zone, "ruangan" character varying, "total_siswa" bigint, "attendance_submitted" boolean, "stats" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_day_of_week INTEGER;
BEGIN
    -- Get day of week (1=Monday, 7=Sunday) using ISODOW
    v_day_of_week := EXTRACT(ISODOW FROM p_date);

    RETURN QUERY
    SELECT 
        s.id,
        s.kelas_id,
        k.nama AS kelas_nama,
        s.mata_pelajaran_id,
        mp.nama AS mata_pelajaran_nama,
        s.jam_mulai,
        s.jam_selesai,
        s.ruangan,
        (SELECT COUNT(*)::BIGINT FROM public.siswa students WHERE students.kelas_id = s.kelas_id AND students.status = 'aktif') as total_siswa,
        EXISTS(
            SELECT 1 FROM public.attendances a 
            WHERE a.schedule_id = s.id AND a.tanggal = p_date
        ) as attendance_submitted,
        (
            SELECT jsonb_build_object(
                'hadir', COUNT(*) FILTER (WHERE a.status = 'hadir'),
                'izin', COUNT(*) FILTER (WHERE a.status = 'izin'),
                'sakit', COUNT(*) FILTER (WHERE a.status = 'sakit'),
                'alpha', COUNT(*) FILTER (WHERE a.status = 'alpha')
            )
            FROM public.attendances a
            WHERE a.schedule_id = s.id AND a.tanggal = p_date
        ) as stats
    FROM 
        public.schedules s
    JOIN 
        public.kelas k ON s.kelas_id = k.id
    LEFT JOIN 
        public.mata_pelajaran mp ON s.mata_pelajaran_id = mp.id
    JOIN
        public.guru g ON s.guru_id = g.id
    WHERE 
        g.user_id = p_guru_id 
        AND s.hari = v_day_of_week
    ORDER BY 
        s.jam_mulai ASC;
END;
$$;


ALTER FUNCTION "public"."get_guru_daily_schedules"("p_guru_id" "uuid", "p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_guru_dashboard"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_guru_id INTEGER;
    v_guru_name TEXT;
    v_today_day INTEGER;
    v_active_ta_id INTEGER;
    v_schedules JSON;
    v_stats JSON;
    v_chart_data JSON;
    v_kelas_selesai INTEGER;
BEGIN
    -- Get Guru ID and Name
    SELECT g.id, u.full_name 
    INTO v_guru_id, v_guru_name
    FROM public.guru g
    JOIN public.users u ON g.user_id = u.id
    WHERE g.user_id = p_user_id;

    IF v_guru_id IS NULL THEN
        RETURN json_build_object('error', 'Guru not found');
    END IF;

    -- Get Active Academic Year
    SELECT id INTO v_active_ta_id
    FROM public.tahun_ajaran
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;

    -- Fallback if no active TA found
    IF v_active_ta_id IS NULL THEN
         SELECT id INTO v_active_ta_id
         FROM public.tahun_ajaran
         ORDER BY created_at DESC
         LIMIT 1;
    END IF;

    -- Get Today's Day
    v_today_day := EXTRACT(ISODOW FROM CURRENT_DATE);

    -- Get Schedules (Filtered by TA)
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', s.id,
            'subject', mp.nama,
            'jam_mulai', TO_CHAR(s.jam_mulai, 'HH24:MI'),
            'jam_selesai', TO_CHAR(s.jam_selesai, 'HH24:MI'),
            'time', TO_CHAR(s.jam_mulai, 'HH24:MI') || ' - ' || TO_CHAR(s.jam_selesai, 'HH24:MI'),
            'room', k.nama,
            'status', CASE 
                WHEN CURRENT_TIME < s.jam_mulai THEN 'upcoming'
                WHEN CURRENT_TIME BETWEEN s.jam_mulai AND s.jam_selesai THEN 'ongoing'
                ELSE 'finished'
            END,
            'is_attendance_filled', EXISTS (
                SELECT 1 FROM public.attendances a 
                WHERE a.schedule_id = s.id AND a.tanggal = CURRENT_DATE
            )
        ) ORDER BY s.jam_mulai
    ), '[]'::json)
    INTO v_schedules
    FROM public.schedules s
    JOIN public.mata_pelajaran mp ON s.mata_pelajaran_id = mp.id
    JOIN public.kelas k ON s.kelas_id = k.id
    WHERE s.guru_id = v_guru_id 
    AND s.hari = v_today_day
    AND s.tahun_ajaran_id = v_active_ta_id;

    -- Calculate Attendance Filled Count (Filtered by TA)
    SELECT COUNT(*) DISTINCT
    INTO v_kelas_selesai
    FROM public.schedules s
    WHERE s.guru_id = v_guru_id 
    AND s.hari = v_today_day
    AND s.tahun_ajaran_id = v_active_ta_id
    AND EXISTS (
        SELECT 1 FROM public.attendances a 
        WHERE a.schedule_id = s.id AND a.tanggal = CURRENT_DATE
    );

    -- Get Chart Data (Filtered by TA)
    SELECT COALESCE(json_agg(
        json_build_object(
            'name', sub.kelas_nama,
            'avg', sub.avg_score
        )
    ), '[]'::json)
    INTO v_chart_data
    FROM (
        SELECT 
            k.nama as kelas_nama,
            ROUND(
                (COUNT(*) FILTER (WHERE a.status = 'hadir')::DECIMAL / NULLIF(COUNT(*), 0)) * 100
            ) as avg_score
        FROM public.attendances a
        JOIN public.schedules s ON a.schedule_id = s.id
        JOIN public.kelas k ON s.kelas_id = k.id
        WHERE s.guru_id = v_guru_id
        AND s.tahun_ajaran_id = v_active_ta_id
        GROUP BY k.id, k.nama
        LIMIT 5
    ) sub;

    -- Calculate Stats (Filtered by TA and DaySet)
    SELECT json_build_object(
        'kelasHariIni', (
            SELECT COUNT(*) 
            FROM public.schedules 
            WHERE guru_id = v_guru_id 
            AND hari = v_today_day
            AND tahun_ajaran_id = v_active_ta_id
        ),
        'kelasSelesai', v_kelas_selesai,
        'totalJamPelajaran', (
             SELECT COUNT(DISTINCT (s.id, jp.id))
             FROM public.schedules s
             JOIN public.jam_pelajaran jp ON 
                 s.jam_mulai < jp.waktu_selesai AND 
                 s.jam_selesai > jp.waktu_mulai
                 AND (
                    -- Map schedule hari to jam_pelajaran day_set
                    (s.hari BETWEEN 1 AND 4 AND jp.day_set = 'senin_kamis') OR
                    (s.hari = 5 AND jp.day_set = 'jumat') OR
                    (s.hari > 5 AND jp.day_set = 'senin_kamis')
                 )
             WHERE s.guru_id = v_guru_id
             AND s.tahun_ajaran_id = v_active_ta_id
             AND jp.is_istirahat = false
        )
    ) INTO v_stats;

    RETURN json_build_object(
        'guru', json_build_object(
            'id', v_guru_id,
            'user', json_build_object(
                'full_name', v_guru_name
            )
        ),
        'schedules', v_schedules,
        'stats', v_stats,
        'chartData', v_chart_data
    );
END;
$$;


ALTER FUNCTION "public"."get_guru_dashboard"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_guru_dashboard"("p_user_id" "uuid", "p_date" "date" DEFAULT CURRENT_DATE) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_guru_id INTEGER;
    v_guru_name TEXT;
    v_today_day INTEGER;
    v_active_ta_id INTEGER;
    v_schedules JSON;
    v_stats JSON;
    v_chart_data JSON;
    v_kelas_selesai INTEGER;
BEGIN
    -- Get Guru ID and Name
    SELECT g.id, u.full_name 
    INTO v_guru_id, v_guru_name
    FROM public.guru g
    JOIN public.users u ON g.user_id = u.id
    WHERE g.user_id = p_user_id;

    IF v_guru_id IS NULL THEN
        RETURN json_build_object('error', 'Guru not found');
    END IF;

    -- Get Active Academic Year
    SELECT id INTO v_active_ta_id
    FROM public.tahun_ajaran
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;

    -- Fallback if no active TA found
    IF v_active_ta_id IS NULL THEN
         SELECT id INTO v_active_ta_id
         FROM public.tahun_ajaran
         ORDER BY created_at DESC
         LIMIT 1;
    END IF;

    -- Get Today's Day from p_date parameter
    v_today_day := EXTRACT(ISODOW FROM p_date);

    -- Get Schedules (Filtered by TA and p_date)
    SELECT COALESCE(json_agg(
        json_build_object(
            'id', s.id,
            'subject', mp.nama,
            'jam_mulai', TO_CHAR(s.jam_mulai, 'HH24:MI'),
            'jam_selesai', TO_CHAR(s.jam_selesai, 'HH24:MI'),
            'time', TO_CHAR(s.jam_mulai, 'HH24:MI') || ' - ' || TO_CHAR(s.jam_selesai, 'HH24:MI'),
            'room', k.nama,
            'status', CASE 
                WHEN CURRENT_TIME < s.jam_mulai THEN 'upcoming'
                WHEN CURRENT_TIME BETWEEN s.jam_mulai AND s.jam_selesai THEN 'ongoing'
                ELSE 'finished'
            END,
            'is_attendance_filled', EXISTS (
                SELECT 1 FROM public.attendances a 
                WHERE a.schedule_id = s.id AND a.tanggal = p_date
            )
        ) ORDER BY s.jam_mulai
    ), '[]'::json)
    INTO v_schedules
    FROM public.schedules s
    JOIN public.mata_pelajaran mp ON s.mata_pelajaran_id = mp.id
    JOIN public.kelas k ON s.kelas_id = k.id
    WHERE s.guru_id = v_guru_id 
    AND s.hari = v_today_day
    AND s.tahun_ajaran_id = v_active_ta_id;

    -- Calculate Attendance Filled Count (Filtered by TA and p_date)
    SELECT COUNT(*) DISTINCT
    INTO v_kelas_selesai
    FROM public.schedules s
    WHERE s.guru_id = v_guru_id 
    AND s.hari = v_today_day
    AND s.tahun_ajaran_id = v_active_ta_id
    AND EXISTS (
        SELECT 1 FROM public.attendances a 
        WHERE a.schedule_id = s.id AND a.tanggal = p_date
    );

    -- Get Chart Data (Filtered by TA)
    SELECT COALESCE(json_agg(
        json_build_object(
            'name', sub.kelas_nama,
            'avg', sub.avg_score
        )
    ), '[]'::json)
    INTO v_chart_data
    FROM (
        SELECT 
            k.nama as kelas_nama,
            ROUND(
                (COUNT(*) FILTER (WHERE a.status = 'hadir')::DECIMAL / NULLIF(COUNT(*), 0)) * 100
            ) as avg_score
        FROM public.attendances a
        JOIN public.schedules s ON a.schedule_id = s.id
        JOIN public.kelas k ON s.kelas_id = k.id
        WHERE s.guru_id = v_guru_id
        AND s.tahun_ajaran_id = v_active_ta_id
        GROUP BY k.id, k.nama
        LIMIT 5
    ) sub;

    -- Calculate Stats (Filtered by TA and DaySet)
    SELECT json_build_object(
        'kelasHariIni', (
            SELECT COUNT(*) 
            FROM public.schedules 
            WHERE guru_id = v_guru_id 
            AND hari = v_today_day
            AND tahun_ajaran_id = v_active_ta_id
        ),
        'kelasSelesai', v_kelas_selesai,
        'totalJamPelajaran', (
             SELECT COUNT(DISTINCT (s.id, jp.id))
             FROM public.schedules s
             JOIN public.jam_pelajaran jp ON 
                 s.jam_mulai < jp.waktu_selesai AND 
                 s.jam_selesai > jp.waktu_mulai
                 AND (
                    -- Map schedule hari to jam_pelajaran day_set
                    (s.hari BETWEEN 1 AND 4 AND jp.day_set = 'senin_kamis') OR
                    (s.hari = 5 AND jp.day_set = 'jumat') OR
                    (s.hari > 5 AND jp.day_set = 'senin_kamis')
                 )
             WHERE s.guru_id = v_guru_id
             AND s.tahun_ajaran_id = v_active_ta_id
             AND jp.is_istirahat = false
        )
    ) INTO v_stats;

    RETURN json_build_object(
        'guru', json_build_object(
            'id', v_guru_id,
            'user', json_build_object(
                'full_name', v_guru_name
            )
        ),
        'schedules', v_schedules,
        'stats', v_stats,
        'chartData', v_chart_data
    );
END;
$$;


ALTER FUNCTION "public"."get_guru_dashboard"("p_user_id" "uuid", "p_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_guru_profile"() RETURNS TABLE("user_id" "uuid", "full_name" "text", "email" "text", "phone" "text", "avatar_url" "text", "alamat" "text", "nip" character varying, "bidang_studi" character varying, "status" character varying, "pendidikan_terakhir" character varying, "sertifikasi" "text"[], "total_jam_pelajaran" integer, "total_kelas_ajar" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_guru_id INTEGER;
    v_active_ta_id INTEGER;
BEGIN
    -- Get Guru ID
    SELECT g.id INTO v_guru_id
    FROM public.guru g
    WHERE g.user_id = auth.uid();

    -- Get Active Academic Year
    SELECT id INTO v_active_ta_id
    FROM public.tahun_ajaran
    WHERE is_active = true
    ORDER BY created_at DESC
    LIMIT 1;

    -- Fallback if no active TA found
    IF v_active_ta_id IS NULL THEN
        SELECT id INTO v_active_ta_id
        FROM public.tahun_ajaran
        ORDER BY created_at DESC
        LIMIT 1;
    END IF;

    RETURN QUERY
    SELECT 
        u.id AS user_id,
        u.full_name::TEXT,
        u.email::TEXT,
        u.phone::TEXT,
        u.avatar_url::TEXT,
        u.alamat,
        g.nip,
        g.bidang_studi,
        g.status,
        g.pendidikan_terakhir,
        g.sertifikasi,
        -- Calculate total JP per week (same logic as get_guru_dashboard)
        COALESCE((
            SELECT COUNT(DISTINCT (s.id, jp.id))::INTEGER
            FROM public.schedules s
            JOIN public.jam_pelajaran jp ON 
                s.jam_mulai < jp.waktu_selesai AND 
                s.jam_selesai > jp.waktu_mulai
                AND (
                    -- Map schedule hari to jam_pelajaran day_set
                    (s.hari BETWEEN 1 AND 4 AND jp.day_set = 'senin_kamis') OR
                    (s.hari = 5 AND jp.day_set = 'jumat') OR
                    (s.hari > 5 AND jp.day_set = 'senin_kamis')
                )
            WHERE s.guru_id = v_guru_id
            AND s.tahun_ajaran_id = v_active_ta_id
            AND jp.is_istirahat = false
        ), 0)::INTEGER AS total_jam_pelajaran,
        -- Calculate total classes taught
        COALESCE((
            SELECT COUNT(DISTINCT s.kelas_id)::INTEGER
            FROM public.schedules s
            WHERE s.guru_id = v_guru_id
            AND s.tahun_ajaran_id = v_active_ta_id
        ), 0)::INTEGER AS total_kelas_ajar
    FROM public.users u
    JOIN public.guru g ON u.id = g.user_id
    WHERE u.id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."get_guru_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_invoices"("p_page" integer DEFAULT 1, "p_limit" integer DEFAULT 20, "p_status" "text" DEFAULT NULL::"text", "p_siswa_id" integer DEFAULT NULL::integer, "p_class_id" integer DEFAULT NULL::integer, "p_month" integer DEFAULT NULL::integer, "p_year" integer DEFAULT NULL::integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_offset int;
    v_total int;
    v_data json;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    -- Count Total
    SELECT COUNT(*) INTO v_total
    FROM public.invoices i
    JOIN public.siswa s ON i.siswa_id = s.id
    WHERE 
        (p_status IS NULL OR i.status = p_status) AND
        (p_siswa_id IS NULL OR i.siswa_id = p_siswa_id) AND
        (p_class_id IS NULL OR s.kelas_id = p_class_id) AND
        (p_month IS NULL OR i.bulan = p_month) AND
        (p_year IS NULL OR i.tahun = p_year);

    -- Get Data with Correct Pagination
    WITH paged_data AS (
        SELECT 
            i.id, i.created_at, i.nominal, i.status, i.jatuh_tempo, i.bulan, i.tahun,
            u.full_name, s.nis, k.nama as class_name, pt.nama as payment_type
        FROM public.invoices i
        JOIN public.siswa s ON i.siswa_id = s.id
        JOIN public.users u ON s.user_id = u.id
        LEFT JOIN public.kelas k ON s.kelas_id = k.id
        JOIN public.payment_types pt ON i.payment_type_id = pt.id
        WHERE 
            (p_status IS NULL OR i.status = p_status) AND
            (p_siswa_id IS NULL OR i.siswa_id = p_siswa_id) AND
            (p_class_id IS NULL OR s.kelas_id = p_class_id) AND
            (p_month IS NULL OR i.bulan = p_month) AND
            (p_year IS NULL OR i.tahun = p_year)
        ORDER BY i.created_at DESC
        LIMIT p_limit OFFSET v_offset
    )
    SELECT json_agg(
        json_build_object(
            'id', pd.id,
            'invoice_number', 'INV-' || TO_CHAR(pd.created_at, 'YYYYMM') || '-' || LPAD(pd.id::text, 5, '0'),
            'siswa_name', pd.full_name,
            'nis', pd.nis,
            'class_name', pd.class_name,
            'payment_type', pd.payment_type,
            'amount', pd.nominal,
            'remaining_amount', (
                CASE 
                    WHEN pd.status = 'paid' THEN 0
                    WHEN pd.status = 'unpaid' THEN pd.nominal
                    ELSE pd.nominal - COALESCE((SELECT SUM(nominal) FROM public.payments WHERE invoice_id = pd.id), 0)
                END
            ),
            'status', pd.status,
            'due_date', pd.jatuh_tempo,
            'period', pd.bulan || '/' || pd.tahun
        ) ORDER BY pd.created_at DESC
    ) INTO v_data
    FROM paged_data pd;

    RETURN json_build_object(
        'success', true,
        'data', COALESCE(v_data, '[]'::json),
        'total', v_total,
        'page', p_page,
        'limit', p_limit
    );
END;
$$;


ALTER FUNCTION "public"."get_invoices"("p_page" integer, "p_limit" integer, "p_status" "text", "p_siswa_id" integer, "p_class_id" integer, "p_month" integer, "p_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ketuakelas_classmates"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_kelas_id INTEGER;
    v_ketua_kelas_id UUID;
    v_result JSONB;
BEGIN
    -- Get kelas_id for this user
    SELECT s.kelas_id
    INTO v_kelas_id
    FROM public.siswa s
    WHERE s.user_id = p_user_id AND s.status = 'aktif';

    IF v_kelas_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Data siswa tidak ditemukan'
        );
    END IF;

    -- Get ketua_kelas_id for this class
    SELECT ketua_kelas_id INTO v_ketua_kelas_id
    FROM public.kelas WHERE id = v_kelas_id;

    -- Build the response
    SELECT jsonb_build_object(
        'success', true,
        'kelas_id', v_kelas_id,
        'classmates', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'user_id', s.user_id,
                    'nis', s.nis,
                    'nisn', s.nisn,
                    'name', u.full_name,
                    'email', u.email,
                    'jenis_kelamin', s.jenis_kelamin,
                    'is_ketua_kelas', (s.user_id = v_ketua_kelas_id)
                ) ORDER BY u.full_name
            )
            FROM public.siswa s
            JOIN public.users u ON s.user_id = u.id
            WHERE s.kelas_id = v_kelas_id AND s.status = 'aktif'
            ), '[]'::jsonb
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_ketuakelas_classmates"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ketuakelas_dashboard"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_siswa_id INTEGER;
    v_kelas_id INTEGER;
    v_kelas_nama TEXT;
    v_wali_kelas_name TEXT;
    v_total_students INTEGER;
    v_today INTEGER;
    v_today_date DATE;
    v_result JSONB;
BEGIN
    -- Get siswa and kelas info for this ketua kelas
    SELECT s.id, s.kelas_id
    INTO v_siswa_id, v_kelas_id
    FROM public.siswa s
    WHERE s.user_id = p_user_id AND s.status = 'aktif';

    IF v_siswa_id IS NULL OR v_kelas_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Data siswa tidak ditemukan'
        );
    END IF;

    -- Get class details
    SELECT k.nama, u.full_name
    INTO v_kelas_nama, v_wali_kelas_name
    FROM public.kelas k
    LEFT JOIN public.users u ON k.wali_kelas_id = u.id
    WHERE k.id = v_kelas_id;

    -- Get total students in class
    SELECT COUNT(*)
    INTO v_total_students
    FROM public.siswa
    WHERE kelas_id = v_kelas_id AND status = 'aktif';

    -- Today's date and day number
    v_today := EXTRACT(ISODOW FROM CURRENT_DATE)::INTEGER;
    v_today_date := CURRENT_DATE;

    -- Build the response
    SELECT jsonb_build_object(
        'success', true,
        'kelas', jsonb_build_object(
            'id', v_kelas_id,
            'nama', v_kelas_nama,
            'wali_kelas', v_wali_kelas_name
        ),
        'stats', jsonb_build_object(
            'total_teman', v_total_students - 1, -- exclude self
            'hadir_hari_ini', (
                SELECT COUNT(DISTINCT a.siswa_id)
                FROM public.attendances a
                JOIN public.siswa s ON a.siswa_id = s.id
                WHERE s.kelas_id = v_kelas_id
                  AND a.tanggal = v_today_date
                  AND a.status = 'hadir'
            ),
            'belum_absen', (
                SELECT v_total_students - COUNT(DISTINCT a.siswa_id)
                FROM public.attendances a
                JOIN public.siswa s ON a.siswa_id = s.id
                WHERE s.kelas_id = v_kelas_id
                  AND a.tanggal = v_today_date
            )
        ),
        'today_tasks', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', sch.id,
                    'mata_pelajaran', mp.nama,
                    'guru', gu.full_name,
                    'jam_mulai', to_char(sch.jam_mulai, 'HH24:MI'),
                    'jam_selesai', to_char(sch.jam_selesai, 'HH24:MI'),
                    'status', CASE 
                        WHEN CURRENT_TIME BETWEEN sch.jam_mulai AND sch.jam_selesai THEN 'ongoing'
                        WHEN CURRENT_TIME > sch.jam_selesai THEN 'completed'
                        ELSE 'upcoming'
                    END,
                    'sudah_absen', EXISTS (
                        SELECT 1 FROM public.attendances a
                        JOIN public.siswa s ON a.siswa_id = s.id
                        WHERE s.kelas_id = v_kelas_id
                          AND a.schedule_id = sch.id
                          AND a.tanggal = v_today_date
                        LIMIT 1
                    )
                ) ORDER BY sch.jam_mulai
            )
            FROM public.schedules sch
            JOIN public.mata_pelajaran mp ON sch.mata_pelajaran_id = mp.id
            JOIN public.guru g ON sch.guru_id = g.id
            JOIN public.users gu ON g.user_id = gu.id
            WHERE sch.kelas_id = v_kelas_id
              AND sch.hari = v_today
            ), '[]'::jsonb
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_ketuakelas_dashboard"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ketuakelas_profile"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'success', true,
        'profile', (
            SELECT jsonb_build_object(
                'id', s.id,
                'user_id', s.user_id,
                'nis', s.nis,
                'nisn', s.nisn,
                'full_name', u.full_name,
                'email', u.email,
                'jenis_kelamin', s.jenis_kelamin,
                'tanggal_lahir', s.tanggal_lahir,
                'alamat', s.alamat,
                'no_hp', u.phone, -- Fixed: phone is in users table, not siswa
                'is_ketua_kelas', (k.ketua_kelas_id = p_user_id),
                'kelas', CASE WHEN k.id IS NOT NULL THEN
                    jsonb_build_object(
                        'id', k.id,
                        'nama', k.nama
                    )
                ELSE NULL END,
                'wali_kelas', CASE WHEN wk.id IS NOT NULL THEN
                    jsonb_build_object(
                        'id', wk.id,
                        'name', wk.full_name,
                        'email', wk.email
                    )
                ELSE NULL END
            )
            FROM public.siswa s
            JOIN public.users u ON s.user_id = u.id
            LEFT JOIN public.kelas k ON s.kelas_id = k.id
            LEFT JOIN public.users wk ON k.wali_kelas_id = wk.id
            WHERE s.user_id = p_user_id AND s.status = 'aktif'
        )
    ) INTO v_result;

    IF v_result->'profile' IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Data siswa tidak ditemukan'
        );
    END IF;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_ketuakelas_profile"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_ketuakelas_schedule"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_kelas_id INTEGER;
    v_kelas_nama TEXT;
    v_result JSONB;
BEGIN
    -- Get kelas_id for this user
    SELECT s.kelas_id
    INTO v_kelas_id
    FROM public.siswa s
    WHERE s.user_id = p_user_id AND s.status = 'aktif';

    IF v_kelas_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Data siswa tidak ditemukan'
        );
    END IF;

    -- Get class name
    SELECT nama INTO v_kelas_nama FROM public.kelas WHERE id = v_kelas_id;

    -- Build the response with schedule grouped by day
    SELECT jsonb_build_object(
        'success', true,
        'kelas', jsonb_build_object('id', v_kelas_id, 'nama', v_kelas_nama),
        'today', EXTRACT(ISODOW FROM CURRENT_DATE)::INTEGER,
        'schedules', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', sch.id,
                    'hari', sch.hari,
                    'mata_pelajaran', mp.nama,
                    'guru', gu.full_name,
                    'ruangan', COALESCE(sch.ruangan, 'TBA'),
                    'jam_mulai', to_char(sch.jam_mulai, 'HH24:MI'),
                    'jam_selesai', to_char(sch.jam_selesai, 'HH24:MI')
                ) ORDER BY sch.hari, sch.jam_mulai
            )
            FROM public.schedules sch
            JOIN public.mata_pelajaran mp ON sch.mata_pelajaran_id = mp.id
            JOIN public.guru g ON sch.guru_id = g.id
            JOIN public.users gu ON g.user_id = gu.id
            WHERE sch.kelas_id = v_kelas_id
            ), '[]'::jsonb
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_ketuakelas_schedule"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_payment_history"("p_siswa_id" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_data json;
BEGIN
    -- Permission: Admin, TU, or the Student themselves, or their Parent
    -- For now, simplify: Authenticated users can try, filter inside query if needed?
    -- Better: Strict checks.
    -- TODO: Add Parent/Student check logic. For now, Open to Admin/TU/Authenticated (filtering)
    
    SELECT json_agg(
        json_build_object(
            'id', p.id,
            'invoice_id', p.invoice_id,
            'amount', p.nominal,
            'date', p.tanggal_bayar,
            'method', p.metode_bayar,
            'received_by', u.full_name,
            'payment_name', pt.nama,
            'bulan', i.bulan,
            'tahun', i.tahun
        ) ORDER BY p.tanggal_bayar DESC
    ) INTO v_data
    FROM public.payments p
    JOIN public.invoices i ON p.invoice_id = i.id
    JOIN public.payment_types pt ON i.payment_type_id = pt.id
    LEFT JOIN public.users u ON p.received_by = u.id
    WHERE p.siswa_id = p_siswa_id;

    RETURN json_build_object(
        'success', true,
        'data', COALESCE(v_data, '[]'::json)
    );
END;
$$;


ALTER FUNCTION "public"."get_payment_history"("p_siswa_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_payment_types"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_data json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', pt.id,
            'nama', pt.nama,
            'nominal_default', pt.nominal_default,
            'is_recurring', pt.is_recurring,
            'billing_cycle', pt.billing_cycle,
            'description', pt.description,
            'is_active', pt.is_active,
            'created_at', pt.created_at
        ) ORDER BY pt.created_at DESC
    ) INTO v_data
    FROM public.payment_types pt;

    RETURN json_build_object(
        'success', true,
        'data', COALESCE(v_data, '[]'::json)
    );
END;
$$;


ALTER FUNCTION "public"."get_payment_types"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_payments"("p_page" integer DEFAULT 1, "p_limit" integer DEFAULT 20, "p_search" "text" DEFAULT ''::"text", "p_method" "text" DEFAULT NULL::"text", "p_start_date" "date" DEFAULT NULL::"date", "p_end_date" "date" DEFAULT NULL::"date", "p_payment_type_id" integer DEFAULT NULL::integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_offset int;
    v_total int;
    v_data json;
BEGIN
    v_offset := (p_page - 1) * p_limit;

    -- Count Total
    SELECT COUNT(*) INTO v_total
    FROM public.payments p
    JOIN public.siswa s ON p.siswa_id = s.id
    JOIN public.users u ON s.user_id = u.id
    LEFT JOIN public.invoices i ON p.invoice_id = i.id
    WHERE 
        (p_method IS NULL OR p.metode_bayar = p_method) AND
        (p_start_date IS NULL OR DATE(p.tanggal_bayar) >= p_start_date) AND
        (p_end_date IS NULL OR DATE(p.tanggal_bayar) <= p_end_date) AND
        (p_payment_type_id IS NULL OR i.payment_type_id = p_payment_type_id) AND
        (
            p_search = '' OR 
            u.full_name ILIKE '%' || p_search || '%' OR
            p.id::text ILIKE '%' || p_search || '%'
        );

    -- Get Data with Correct Pagination (CTE)
    WITH paged_data AS (
        SELECT 
            p.id, p.tanggal_bayar, p.nominal, p.metode_bayar, 
            u.full_name as student_name, s.nis, k.nama as class_name,
            pt.nama as payment_type, i.status as invoice_status
        FROM public.payments p
        JOIN public.siswa s ON p.siswa_id = s.id
        JOIN public.users u ON s.user_id = u.id
        LEFT JOIN public.kelas k ON s.kelas_id = k.id
        JOIN public.invoices i ON p.invoice_id = i.id
        JOIN public.payment_types pt ON i.payment_type_id = pt.id
        WHERE 
            (p_method IS NULL OR p.metode_bayar = p_method) AND
            (p_start_date IS NULL OR DATE(p.tanggal_bayar) >= p_start_date) AND
            (p_end_date IS NULL OR DATE(p.tanggal_bayar) <= p_end_date) AND
            (p_payment_type_id IS NULL OR i.payment_type_id = p_payment_type_id) AND
            (
                p_search = '' OR 
                u.full_name ILIKE '%' || p_search || '%' OR
                p.id::text ILIKE '%' || p_search || '%'
            )
        ORDER BY p.tanggal_bayar DESC
        LIMIT p_limit OFFSET v_offset
    )
    SELECT json_agg(
        json_build_object(
            'id', pd.id,
            'payment_date', pd.tanggal_bayar,
            'amount', pd.nominal,
            'method', pd.metode_bayar,
            'student_name', pd.student_name,
            'nis', pd.nis,
            'class_name', pd.class_name,
            'payment_type', pd.payment_type,
            'invoice_status', pd.invoice_status
        ) ORDER BY pd.tanggal_bayar DESC
    ) INTO v_data
    FROM paged_data pd;

    RETURN json_build_object(
        'success', true,
        'data', COALESCE(v_data, '[]'::json),
        'total', v_total,
        'page', p_page,
        'limit', p_limit
    );
END;
$$;


ALTER FUNCTION "public"."get_payments"("p_page" integer, "p_limit" integer, "p_search" "text", "p_method" "text", "p_start_date" "date", "p_end_date" "date", "p_payment_type_id" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."school_info" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text",
    "address" "text",
    "phone" "text",
    "email" "text",
    "website" "text",
    "logo_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."school_info" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_school_info"() RETURNS SETOF "public"."school_info"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY SELECT * FROM public.school_info LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_school_info"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_siswa_attendance_history"("p_user_id" "uuid", "p_month" integer DEFAULT NULL::integer, "p_year" integer DEFAULT NULL::integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_siswa_id INTEGER;
    v_target_month INTEGER;
    v_target_year INTEGER;
    v_start_date DATE;
    v_end_date DATE;
    v_result JSONB;
BEGIN
    -- Get siswa id
    SELECT id INTO v_siswa_id
    FROM public.siswa
    WHERE user_id = p_user_id;

    IF v_siswa_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Siswa profile not found'
        );
    END IF;

    -- Set target month/year (default to current)
    v_target_month := COALESCE(p_month, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER);
    v_target_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);
    
    -- Calculate date range
    v_start_date := make_date(v_target_year, v_target_month, 1);
    v_end_date := (v_start_date + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

    -- Build response
    SELECT jsonb_build_object(
        'success', true,
        'month', v_target_month,
        'year', v_target_year,
        'stats', jsonb_build_object(
            'hadir', (SELECT COUNT(*) FROM public.attendances WHERE siswa_id = v_siswa_id AND tanggal BETWEEN v_start_date AND v_end_date AND status = 'hadir'),
            'izin', (SELECT COUNT(*) FROM public.attendances WHERE siswa_id = v_siswa_id AND tanggal BETWEEN v_start_date AND v_end_date AND status = 'izin'),
            'sakit', (SELECT COUNT(*) FROM public.attendances WHERE siswa_id = v_siswa_id AND tanggal BETWEEN v_start_date AND v_end_date AND status = 'sakit'),
            'alpha', (SELECT COUNT(*) FROM public.attendances WHERE siswa_id = v_siswa_id AND tanggal BETWEEN v_start_date AND v_end_date AND status = 'alpha')
        ),
        'history', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', a.id,
                    'tanggal', a.tanggal,
                    'status', a.status,
                    'waktu_hadir', a.waktu_hadir,
                    'catatan', a.catatan,
                    'mata_pelajaran', mp.nama
                ) ORDER BY a.tanggal DESC, a.created_at DESC
            )
            FROM public.attendances a
            LEFT JOIN public.schedules sch ON a.schedule_id = sch.id
            LEFT JOIN public.mata_pelajaran mp ON sch.mata_pelajaran_id = mp.id
            WHERE a.siswa_id = v_siswa_id
              AND a.tanggal BETWEEN v_start_date AND v_end_date
            ), '[]'::jsonb
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_siswa_attendance_history"("p_user_id" "uuid", "p_month" integer, "p_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_siswa_dashboard"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_siswa_id INTEGER;
    v_kelas_id INTEGER;
    v_today INTEGER;
    v_month_start DATE;
    v_result JSONB;
BEGIN
    -- Get siswa info
    SELECT s.id, s.kelas_id
    INTO v_siswa_id, v_kelas_id
    FROM public.siswa s
    WHERE s.user_id = p_user_id;

    -- If no siswa record found
    IF v_siswa_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Siswa profile not found',
            'siswa', null,
            'schedules', '[]'::jsonb,
            'attendance', jsonb_build_object('hadir', 0, 'izin', 0, 'sakit', 0, 'alpha', 0)
        );
    END IF;

    -- Get day of week (1 = Monday, 7 = Sunday) - PostgreSQL uses 0-6 where 0=Sunday
    v_today := EXTRACT(ISODOW FROM CURRENT_DATE)::INTEGER;
    v_month_start := date_trunc('month', CURRENT_DATE)::DATE;

    -- Build the response
    SELECT jsonb_build_object(
        'success', true,
        'siswa', (
            SELECT jsonb_build_object(
                'id', s.id,
                'nis', s.nis,
                'nisn', s.nisn,
                'status', s.status,
                'user', jsonb_build_object(
                    'id', u.id,
                    'full_name', u.full_name,
                    'email', u.email
                ),
                'kelas', CASE WHEN k.id IS NOT NULL THEN
                    jsonb_build_object(
                        'id', k.id,
                        'nama', k.nama,
                        'wali_kelas', (SELECT full_name FROM public.users WHERE id = k.wali_kelas_id)
                    )
                ELSE NULL END
            )
            FROM public.siswa s
            JOIN public.users u ON s.user_id = u.id
            LEFT JOIN public.kelas k ON s.kelas_id = k.id
            WHERE s.id = v_siswa_id
        ),
        'schedules', CASE WHEN v_kelas_id IS NOT NULL THEN
            COALESCE(
                (SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', sch.id,
                        'subject', mp.nama,
                        'teacher', gu.full_name,
                        'time', to_char(sch.jam_mulai, 'HH24:MI') || ' - ' || to_char(sch.jam_selesai, 'HH24:MI'),
                        'status', CASE 
                            WHEN CURRENT_TIME BETWEEN sch.jam_mulai AND sch.jam_selesai THEN 'ongoing'
                            WHEN CURRENT_TIME > sch.jam_selesai THEN 'completed'
                            ELSE 'upcoming'
                        END
                    ) ORDER BY sch.jam_mulai
                )
                FROM public.schedules sch
                JOIN public.mata_pelajaran mp ON sch.mata_pelajaran_id = mp.id
                JOIN public.guru g ON sch.guru_id = g.id
                JOIN public.users gu ON g.user_id = gu.id
                WHERE sch.kelas_id = v_kelas_id
                  AND sch.hari = v_today
                ), '[]'::jsonb
            )
        ELSE '[]'::jsonb END,
        'attendance', jsonb_build_object(
            'hadir', (SELECT COUNT(*) FROM public.attendances WHERE siswa_id = v_siswa_id AND tanggal >= v_month_start AND status = 'hadir'),
            'izin', (SELECT COUNT(*) FROM public.attendances WHERE siswa_id = v_siswa_id AND tanggal >= v_month_start AND status = 'izin'),
            'sakit', (SELECT COUNT(*) FROM public.attendances WHERE siswa_id = v_siswa_id AND tanggal >= v_month_start AND status = 'sakit'),
            'alpha', (SELECT COUNT(*) FROM public.attendances WHERE siswa_id = v_siswa_id AND tanggal >= v_month_start AND status = 'alpha')
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_siswa_dashboard"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_siswa_profile"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'success', true,
        'user', jsonb_build_object(
            'id', u.id,
            'email', u.email,
            'full_name', u.full_name,
            'phone', u.phone,
            'avatar_url', u.avatar_url
        ),
        'siswa', jsonb_build_object(
            'id', s.id,
            'nis', s.nis,
            'nisn', s.nisn,
            'jenis_kelamin', s.jenis_kelamin,
            'tanggal_lahir', s.tanggal_lahir,
            'alamat', s.alamat,
            'status', s.status
        ),
        'kelas', CASE WHEN k.id IS NOT NULL THEN
            jsonb_build_object(
                'id', k.id,
                'nama', k.nama,
                'tingkat', k.tingkat,
                'tahun_ajaran', ta.nama
            )
        ELSE NULL END,
        'wali_kelas', CASE WHEN wk.id IS NOT NULL THEN
            jsonb_build_object(
                'nama', wk.full_name,
                'email', wk.email,
                'phone', wk.phone
            )
        ELSE NULL END,
        'wali_murid', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'nama', wu.full_name,
                    'email', wu.email,
                    'phone', wu.phone,
                    'hubungan', wm.hubungan,
                    'is_primary', sw.is_primary
                )
            )
            FROM public.siswa_wali sw
            JOIN public.wali_murid wm ON sw.wali_id = wm.id
            JOIN public.users wu ON wm.user_id = wu.id
            WHERE sw.siswa_id = s.id
            ), '[]'::jsonb
        )
    )
    INTO v_result
    FROM public.users u
    JOIN public.siswa s ON s.user_id = u.id
    LEFT JOIN public.kelas k ON s.kelas_id = k.id
    LEFT JOIN public.tahun_ajaran ta ON k.tahun_ajaran_id = ta.id
    LEFT JOIN public.users wk ON k.wali_kelas_id = wk.id
    WHERE u.id = p_user_id;

    IF v_result IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Siswa profile not found'
        );
    END IF;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_siswa_profile"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_siswa_schedule"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_siswa_id INTEGER;
    v_kelas_id INTEGER;
    v_kelas_nama TEXT;
    v_tahun_ajaran_id INTEGER;
    v_result JSONB;
BEGIN
    -- Get siswa and kelas info
    SELECT s.id, s.kelas_id, k.nama
    INTO v_siswa_id, v_kelas_id, v_kelas_nama
    FROM public.siswa s
    LEFT JOIN public.kelas k ON s.kelas_id = k.id
    WHERE s.user_id = p_user_id;

    IF v_siswa_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Siswa profile not found'
        );
    END IF;

    IF v_kelas_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'kelas', null,
            'schedules', '[]'::jsonb
        );
    END IF;

    -- Get active tahun ajaran
    SELECT id INTO v_tahun_ajaran_id
    FROM public.tahun_ajaran
    WHERE is_active = true
    LIMIT 1;

    -- Build schedule response grouped by day
    SELECT jsonb_build_object(
        'success', true,
        'kelas', v_kelas_nama,
        'schedules', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', sch.id,
                    'hari', sch.hari,
                    'jam_mulai', to_char(sch.jam_mulai, 'HH24:MI'),
                    'jam_selesai', to_char(sch.jam_selesai, 'HH24:MI'),
                    'mata_pelajaran', mp.nama,
                    'guru', u.full_name,
                    'ruangan', sch.ruangan
                ) ORDER BY sch.hari, sch.jam_mulai
            )
            FROM public.schedules sch
            JOIN public.mata_pelajaran mp ON sch.mata_pelajaran_id = mp.id
            JOIN public.guru g ON sch.guru_id = g.id
            JOIN public.users u ON g.user_id = u.id
            WHERE sch.kelas_id = v_kelas_id
              AND (sch.tahun_ajaran_id = v_tahun_ajaran_id OR sch.tahun_ajaran_id IS NULL)
            ), '[]'::jsonb
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."get_siswa_schedule"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_student_attendance_card"("p_siswa_id" "text", "p_semester" integer, "p_year" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_student_data json;
    v_attendance json;
    v_monthly_breakdown json;
    v_start_month int;
    v_end_month int;
    v_siswa_internal_id INTEGER;
BEGIN
    -- Try to get siswa by integer ID first
    BEGIN
        v_siswa_internal_id := p_siswa_id::integer;
    EXCEPTION WHEN OTHERS THEN
        -- If not an integer, try to find by UUID (user_id)
        SELECT s.id INTO v_siswa_internal_id
        FROM public.siswa s
        WHERE s.user_id = p_siswa_id::uuid;
    END;

    -- Verify siswa exists
    IF v_siswa_internal_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Siswa tidak ditemukan');
    END IF;

    -- Check if siswa with that ID exists
    IF NOT EXISTS (SELECT 1 FROM public.siswa WHERE id = v_siswa_internal_id) THEN
        RETURN json_build_object('success', false, 'message', 'Siswa tidak ditemukan');
    END IF;

    IF p_semester = 1 THEN
        v_start_month := 7;
        v_end_month := 12;
    ELSE
        v_start_month := 1;
        v_end_month := 6;
    END IF;

    -- Get Student Info
    SELECT json_build_object(
        'id', s.id,
        'nis', s.nis,
        'name', u.full_name,
        'kelas', (SELECT k.nama FROM public.kelas k WHERE k.id = s.kelas_id),
        'gender', s.jenis_kelamin
    ) INTO v_student_data
    FROM public.siswa s
    JOIN public.users u ON s.user_id = u.id
    WHERE s.id = v_siswa_internal_id;

    IF v_student_data IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Data siswa tidak ditemukan');
    END IF;

    -- Get Total Attendance
    SELECT json_build_object(
        'hadir', COUNT(*) FILTER (WHERE status = 'hadir'),
        'sakit', COUNT(*) FILTER (WHERE status = 'sakit'),
        'izin', COUNT(*) FILTER (WHERE status = 'izin'),
        'alpha', COUNT(*) FILTER (WHERE status = 'alpha')
    ) INTO v_attendance
    FROM public.attendances
    WHERE siswa_id = v_siswa_internal_id
      AND EXTRACT(MONTH FROM tanggal) BETWEEN v_start_month AND v_end_month
      AND EXTRACT(YEAR FROM tanggal) = p_year;

    -- Get Monthly Breakdown
    SELECT json_agg(
        json_build_object(
            'month', m.month,
            'month_name', TO_CHAR(TO_DATE(m.month::text, 'MM'), 'Month'),
            'hadir', (SELECT COUNT(*) FROM public.attendances WHERE siswa_id = v_siswa_internal_id AND status = 'hadir' AND EXTRACT(MONTH FROM tanggal) = m.month AND EXTRACT(YEAR FROM tanggal) = p_year),
            'sakit', (SELECT COUNT(*) FROM public.attendances WHERE siswa_id = v_siswa_internal_id AND status = 'sakit' AND EXTRACT(MONTH FROM tanggal) = m.month AND EXTRACT(YEAR FROM tanggal) = p_year),
            'izin', (SELECT COUNT(*) FROM public.attendances WHERE siswa_id = v_siswa_internal_id AND status = 'izin' AND EXTRACT(MONTH FROM tanggal) = m.month AND EXTRACT(YEAR FROM tanggal) = p_year),
            'alpha', (SELECT COUNT(*) FROM public.attendances WHERE siswa_id = v_siswa_internal_id AND status = 'alpha' AND EXTRACT(MONTH FROM tanggal) = m.month AND EXTRACT(YEAR FROM tanggal) = p_year)
        ) ORDER BY m.month
    ) INTO v_monthly_breakdown
    FROM (SELECT generate_series(v_start_month, v_end_month) AS month) m;

    RETURN json_build_object(
        'success', true,
        'student', v_student_data,
        'attendance', COALESCE(v_attendance, json_build_object('hadir', 0, 'sakit', 0, 'izin', 0, 'alpha', 0)),
        'monthly', COALESCE(v_monthly_breakdown, '[]'::json),
        'period', json_build_object(
            'semester', p_semester,
            'semester_name', CASE WHEN p_semester = 1 THEN 'Ganjil' ELSE 'Genap' END,
            'year', p_year
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."get_student_attendance_card"("p_siswa_id" "text", "p_semester" integer, "p_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_student_attendance_log"("p_student_id" integer, "p_limit" integer DEFAULT 20) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_log json;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', a.id,
            'tanggal', a.tanggal,
            'status', a.status,
            'keterangan', a.catatan, -- using 'catatan' as confirmed in fix_ketuakelas_attendance
            'mapel', mp.nama,
            'jam_mulai', to_char(s.jam_mulai, 'HH24:MI'),
            'jam_selesai', to_char(s.jam_selesai, 'HH24:MI')
        ) ORDER BY a.tanggal DESC, s.jam_mulai ASC
    ) INTO v_log
    FROM public.attendances a
    LEFT JOIN public.schedules s ON a.schedule_id = s.id
    LEFT JOIN public.mata_pelajaran mp ON s.mata_pelajaran_id = mp.id
    WHERE a.siswa_id = p_student_id
    LIMIT p_limit;

    RETURN json_build_object(
        'success', true,
        'data', COALESCE(v_log, '[]'::json)
    );
END;
$$;


ALTER FUNCTION "public"."get_student_attendance_log"("p_student_id" integer, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_student_bill"("p_siswa_id" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_total_bill decimal := 0;
    v_total_paid decimal := 0;
    v_outstanding_invoices json;
BEGIN
    -- Auth check: Admin, TU, or Student/Parent themselves
    
    -- Calculate Totals
    SELECT 
        COALESCE(SUM(nominal), 0)
    INTO v_total_bill
    FROM public.invoices
    WHERE siswa_id = p_siswa_id;

    SELECT 
        COALESCE(SUM(nominal), 0)
    INTO v_total_paid
    FROM public.payments
    WHERE siswa_id = p_siswa_id;

    -- Get Outstanding Invoices
    SELECT json_agg(
        json_build_object(
            'id', i.id,
            'invoice_number', 'INV-' || TO_CHAR(i.created_at, 'YYYYMM') || '-' || LPAD(i.id::text, 5, '0'),
            'type', pt.nama,
            'nominal', i.nominal,
            'paid', (SELECT COALESCE(SUM(nominal), 0) FROM public.payments p WHERE p.invoice_id = i.id),
            'status', i.status,
            'due_date', i.jatuh_tempo,
            'period', i.bulan || '/' || i.tahun
        ) ORDER BY i.jatuh_tempo ASC
    ) INTO v_outstanding_invoices
    FROM public.invoices i
    JOIN public.payment_types pt ON i.payment_type_id = pt.id
    WHERE i.siswa_id = p_siswa_id AND (i.status = 'unpaid' OR i.status = 'partial');

    RETURN json_build_object(
        'success', true,
        'summary', json_build_object(
            'total_billed', v_total_bill,
            'total_paid', v_total_paid,
            'total_outstanding', v_total_bill - v_total_paid
        ),
        'invoices', COALESCE(v_outstanding_invoices, '[]'::json)
    );
END;
$$;


ALTER FUNCTION "public"."get_student_bill"("p_siswa_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_student_billing_summary"("p_class_id" bigint) RETURNS TABLE("student_id" bigint, "student_name" "text", "nis" "text", "total_unpaid_invoices" bigint, "total_unpaid_amount" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id::BIGINT as student_id,
        u.full_name::TEXT as student_name,
        s.nis::TEXT,
        -- Count both 'unpaid' and 'partial'
        COUNT(i.id) FILTER (
            WHERE i.status IN ('unpaid', 'partial')
        )::BIGINT as total_unpaid_invoices,
        -- Sum remaining amounts
        COALESCE(SUM(
            CASE 
                WHEN i.status = 'unpaid' THEN i.nominal
                WHEN i.status = 'partial' THEN (
                    i.nominal - COALESCE((
                        SELECT SUM(p.nominal) 
                        FROM public.payments p
                        WHERE p.invoice_id = i.id
                    ), 0)
                )
                ELSE 0
            END
        ), 0)::NUMERIC as total_unpaid_amount
    FROM 
        public.siswa s
    JOIN 
        public.users u ON s.user_id = u.id
    LEFT JOIN 
        public.invoices i ON s.id = i.siswa_id
    WHERE 
        s.kelas_id = p_class_id
    GROUP BY 
        s.id, u.full_name, s.nis
    ORDER BY 
        u.full_name;
END;
$$;


ALTER FUNCTION "public"."get_student_billing_summary"("p_class_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_student_profile_detail"("p_student_id" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_data json;
BEGIN
    SELECT json_build_object(
        'id', s.id,
        'user_id', s.user_id,
        'full_name', u.full_name,
        'avatar_url', u.avatar_url,
        'email', u.email,
        'phone', u.phone,
        
        -- Academic
        'nis', s.nis,
        'nisn', s.nisn,
        'status', s.status,
        -- Removed: semester, angkatan
        'kelas_id', k.id,
        'kelas_nama', k.nama,
        'wali_kelas_nama', (SELECT wu.full_name FROM public.users wu WHERE wu.id = k.wali_kelas_id),
        
        -- Personal
        'jenis_kelamin', s.jenis_kelamin,
        -- Removed: tempat_lahir
        'tanggal_lahir', s.tanggal_lahir,
        -- Removed: agama
        'alamat', s.alamat,
        
        -- Family (Fetched from relations, not columns)
        'nama_ayah', (
            SELECT u_ayah.full_name 
            FROM public.siswa_wali sw 
            JOIN public.wali_murid wm ON sw.wali_id = wm.id 
            JOIN public.users u_ayah ON wm.user_id = u_ayah.id 
            WHERE sw.siswa_id = s.id AND wm.hubungan = 'Ayah' 
            LIMIT 1
        ),
        'pekerjaan_ayah', '-', -- Not available in DB
        'nama_ibu', (
            SELECT u_ibu.full_name 
            FROM public.siswa_wali sw 
            JOIN public.wali_murid wm ON sw.wali_id = wm.id 
            JOIN public.users u_ibu ON wm.user_id = u_ibu.id 
            WHERE sw.siswa_id = s.id AND wm.hubungan = 'Ibu' 
            LIMIT 1
        ),
        'pekerjaan_ibu', '-', -- Not available in DB
        'nama_wali', (
            SELECT u_wali.full_name 
            FROM public.siswa_wali sw 
            JOIN public.wali_murid wm ON sw.wali_id = wm.id 
            JOIN public.users u_wali ON wm.user_id = u_wali.id 
            WHERE sw.siswa_id = s.id AND wm.hubungan NOT IN ('Ayah', 'Ibu') 
            LIMIT 1
        ),
        'telepon_ortu', (
             SELECT u_parent.phone 
             FROM public.siswa_wali sw 
             JOIN public.wali_murid wm ON sw.wali_id = wm.id 
             JOIN public.users u_parent ON wm.user_id = u_parent.id 
             WHERE sw.siswa_id = s.id 
             LIMIT 1
        )
    ) INTO v_data
    FROM public.siswa s
    JOIN public.users u ON s.user_id = u.id
    LEFT JOIN public.kelas k ON s.kelas_id = k.id
    WHERE s.id = p_student_id;

    IF v_data IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Student not found');
    END IF;

    RETURN json_build_object('success', true, 'data', v_data);
END;
$$;


ALTER FUNCTION "public"."get_student_profile_detail"("p_student_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tu_arrears_report"("p_class_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("student_id" "uuid", "student_name" "text", "student_nis" "text", "class_name" "text", "total_unpaid_invoices" bigint, "total_arrears_amount" numeric, "last_invoice_date" "date")
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    WITH invoice_payments AS (
        -- Calculate total paid per invoice
        SELECT 
            i.id as invoice_id,
            COALESCE(SUM(p.nominal), 0) as paid_amount
        FROM public.invoices i
        LEFT JOIN public.payments p ON p.invoice_id = i.id
        GROUP BY i.id
    )
    SELECT 
        s.user_id as student_id,
        u.full_name::TEXT as student_name, -- Cast to TEXT
        s.nis::TEXT as student_nis, -- Cast to TEXT
        k.nama::TEXT as class_name, -- Cast to TEXT
        COUNT(i.id) as total_unpaid_invoices,
        COALESCE(SUM(i.nominal - ip.paid_amount), 0) as total_arrears_amount,
        MAX(i.created_at)::DATE as last_invoice_date
    FROM public.invoices i
    JOIN invoice_payments ip ON i.id = ip.invoice_id
    JOIN public.siswa s ON i.siswa_id = s.id
    JOIN public.users u ON s.user_id = u.id
    JOIN public.kelas k ON s.kelas_id = k.id
    WHERE 
        i.status IN ('unpaid', 'partial')
        AND (p_class_id IS NULL OR k.id = p_class_id)
        AND s.status = 'aktif'
        AND (i.nominal - ip.paid_amount) > 0
    GROUP BY s.user_id, u.full_name, s.nis, k.nama
    ORDER BY total_arrears_amount DESC;
END;
$$;


ALTER FUNCTION "public"."get_tu_arrears_report"("p_class_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tu_dashboard_stats"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_total_students int;
    v_total_teachers int;
    v_total_classes int;
    v_pending_invoices int;
    v_monthly_income decimal(12,2);
BEGIN
    -- Check permissions
    IF NOT public.has_role('tu') AND NOT public.has_role('admin') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- 1. Count Active Students
    SELECT COUNT(*) INTO v_total_students
    FROM public.siswa
    WHERE status = 'aktif';

    -- 2. Count Active Teachers
    SELECT COUNT(*) INTO v_total_teachers
    FROM public.guru
    WHERE status = 'aktif';

    -- 3. Count Active Classes
    -- Assuming classes are active if they have students or are in current academic year
    -- For simplicity, just count all for now, or filter by active academic year if logic existed
    SELECT COUNT(*) INTO v_total_classes
    FROM public.kelas;

    -- 4. Count Pending Invoices (Unpaid)
    SELECT COUNT(*) INTO v_pending_invoices
    FROM public.invoices
    WHERE status = 'unpaid';

    -- 5. Calculate Monthly Income (Current Month)
    SELECT COALESCE(SUM(nominal), 0) INTO v_monthly_income
    FROM public.payments
    WHERE 
        DATE_TRUNC('month', tanggal_bayar) = DATE_TRUNC('month', CURRENT_DATE);

    RETURN json_build_object(
        'success', true,
        'stats', json_build_object(
            'total_students', v_total_students,
            'total_teachers', v_total_teachers,
            'total_classes', v_total_classes,
            'pending_invoices', v_pending_invoices,
            'monthly_income', v_monthly_income
        )
    );
END;
$$;


ALTER FUNCTION "public"."get_tu_dashboard_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tu_financial_dashboard"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_total_pemasukan DECIMAL(15,2);
    v_total_tunggakan DECIMAL(15,2);
    v_total_pengeluaran DECIMAL(15,2);
    v_kas_saat_ini DECIMAL(15,2);
    v_monthly_trend JSONB;
    v_payment_methods JSONB;
    v_recent_transactions JSONB;
BEGIN
    -- Check permissions
    IF NOT public.has_role('tu') AND NOT public.has_role('admin') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- 1. Total Pemasukan (All time payments)
    SELECT COALESCE(SUM(nominal), 0) INTO v_total_pemasukan
    FROM public.payments;

    -- 2. Total Tunggakan (Unpaid / Partial Invoices)
    -- FIXED: Logic aligned with get_billing_stats_by_class
    SELECT COALESCE(SUM(
        CASE 
            WHEN status = 'unpaid' THEN nominal
            WHEN status = 'partial' THEN (
                nominal - COALESCE((
                    SELECT SUM(p.nominal) 
                    FROM public.payments p
                    WHERE p.invoice_id = public.invoices.id
                ), 0)
            )
            ELSE 0
        END
    ), 0) INTO v_total_tunggakan
    FROM public.invoices
    WHERE status IN ('unpaid', 'partial');

    -- 3. Total Pengeluaran (All time expenses)
    SELECT COALESCE(SUM(amount), 0) INTO v_total_pengeluaran
    FROM public.expenses;

    -- 4. Kas Saat Ini
    v_kas_saat_ini := v_total_pemasukan - v_total_pengeluaran;

    -- 5. Monthly Trend (Last 6 months)
    SELECT json_agg(
        json_build_object(
            'name', to_char(m.month, 'Mon'),
            'income', COALESCE(p.income, 0),
            'expense', COALESCE(e.expense, 0)
        ) ORDER BY m.month
    ) INTO v_monthly_trend
    FROM (
        SELECT generate_series(
            date_trunc('month', CURRENT_DATE) - INTERVAL '5 months',
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
        )::date AS month
    ) m
    LEFT JOIN (
        SELECT date_trunc('month', tanggal_bayar)::date AS month, SUM(nominal) as income
        FROM public.payments
        WHERE tanggal_bayar >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY 1
    ) p ON m.month = p.month
    LEFT JOIN (
        SELECT date_trunc('month', transaction_date)::date AS month, SUM(amount) as expense
        FROM public.expenses
        WHERE transaction_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
        GROUP BY 1
    ) e ON m.month = e.month;

    -- 6. Payment Methods Distribution
    SELECT json_agg(
        json_build_object(
            'name', COALESCE(metode_bayar, 'Manual'),
            'value', count
        )
    ) INTO v_payment_methods
    FROM (
        SELECT metode_bayar, COUNT(*) as count
        FROM public.payments
        GROUP BY metode_bayar
        ORDER BY count DESC
    ) sub;

    -- 7. Recent Transactions (Last 5)
    SELECT json_agg(
        json_build_object(
            'id', p.id,
            'student', u.full_name,
            'class', k.nama,
            'type',  COALESCE(pt.nama, 'Pembayaran'),
            'amount', p.nominal,
            'date', to_char(p.tanggal_bayar, 'DD Mon YYYY'),
            'status', 'success'
        ) ORDER BY p.tanggal_bayar DESC
    ) INTO v_recent_transactions
    FROM (
        SELECT * FROM public.payments
        ORDER BY tanggal_bayar DESC
        LIMIT 5
    ) p
    JOIN public.siswa s ON p.siswa_id = s.id
    JOIN public.users u ON s.user_id = u.id
    LEFT JOIN public.kelas k ON s.kelas_id = k.id
    LEFT JOIN public.invoices i ON p.invoice_id = i.id
    LEFT JOIN public.payment_types pt ON i.payment_type_id = pt.id;

    RETURN json_build_object(
        'success', true,
        'stats', json_build_object(
            'totalPemasukan', v_total_pemasukan,
            'totalTunggakan', v_total_tunggakan,
            'totalPengeluaran', v_total_pengeluaran,
            'kasSaatIni', v_kas_saat_ini
        ),
        'monthlyTrend', COALESCE(v_monthly_trend, '[]'::jsonb),
        'paymentMethods', COALESCE(v_payment_methods, '[]'::jsonb),
        'recentTransactions', COALESCE(v_recent_transactions, '[]'::jsonb)
    );
END;
$$;


ALTER FUNCTION "public"."get_tu_financial_dashboard"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_notifications"("p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', n.id,
            'title', n.title,
            'message', n.message,
            'type', n.type,
            'category', n.category,
            'reference_id', n.reference_id,
            'is_read', n.is_read,
            'created_at', n.created_at,
            'time_ago', EXTRACT(EPOCH FROM (NOW() - n.created_at)) -- Seconds ago, frontend can format
        ) ORDER BY n.created_at DESC
    ) INTO v_result
    FROM public.notifications n
    WHERE n.user_id = p_user_id
    LIMIT 50; -- Limit to last 50 notifications

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_user_notifications"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_wali_children"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_wali_id int;
    v_children json;
BEGIN
    -- Get Wali ID
    SELECT id INTO v_wali_id FROM public.wali_murid WHERE user_id = p_user_id;

    IF v_wali_id IS NULL THEN
        RETURN '[]'::json;
    END IF;

    -- Get Children Data
    SELECT json_agg(
        json_build_object(
            'id', s.id,
            'nis', s.nis,
            'user_id', s.user_id,
            'full_name', u.full_name,
            'avatar_url', u.avatar_url,
            'gender', s.jenis_kelamin,
            'kelas_id', k.id,
            'kelas_nama', k.nama,
            'wali_kelas_nama', (SELECT wu.full_name FROM public.users wu WHERE wu.id = k.wali_kelas_id),
            'attendance_today', (
                SELECT status 
                FROM public.attendances a 
                WHERE a.siswa_id = s.id 
                AND a.tanggal = CURRENT_DATE 
                LIMIT 1
            )
        )
    ) INTO v_children
    FROM public.siswa_wali sw
    JOIN public.siswa s ON sw.siswa_id = s.id
    JOIN public.users u ON s.user_id = u.id
    LEFT JOIN public.kelas k ON s.kelas_id = k.id
    WHERE sw.wali_id = v_wali_id;

    RETURN COALESCE(v_children, '[]'::json);
END;
$$;


ALTER FUNCTION "public"."get_wali_children"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_wali_dashboard"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_wali_id int;
    v_stats json;
    v_children_ids int[];
    v_total_bills bigint := 0;
    v_unpaid_bills bigint := 0;
    v_recent_attendance json;
    v_schedule json;
    v_today_dow int;
BEGIN
    SELECT id INTO v_wali_id FROM public.wali_murid WHERE user_id = p_user_id;

    IF v_wali_id IS NULL THEN
         RETURN json_build_object('success', false, 'message', 'User bukan wali murid');
    END IF;

    -- Get all children IDs
    SELECT array_agg(siswa_id) INTO v_children_ids
    FROM public.siswa_wali
    WHERE wali_id = v_wali_id;

    IF v_children_ids IS NULL THEN
        RETURN json_build_object(
            'success', true,
            'total_students', 0,
            'attendance_summary', json_build_object('hadir', 0, 'izin', 0, 'sakit', 0, 'alpha', 0),
            'billing_summary', json_build_object('total_invoices', 0, 'unpaid_usage', 0),
            'recent_attendance', '[]'::json,
            'todays_schedule', '[]'::json
        );
    END IF;

    -- 1. Attendance Summary (Current Month)
    SELECT json_build_object(
        'hadir', COUNT(DISTINCT tanggal) FILTER (WHERE status = 'hadir'),
        'izin', COUNT(DISTINCT tanggal) FILTER (WHERE status = 'izin'),
        'sakit', COUNT(DISTINCT tanggal) FILTER (WHERE status = 'sakit'),
        'alpha', COUNT(DISTINCT tanggal) FILTER (WHERE status = 'alpha')
    ) INTO v_stats
    FROM public.attendances
    WHERE siswa_id = ANY(v_children_ids)
    AND EXTRACT(MONTH FROM tanggal) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM tanggal) = EXTRACT(YEAR FROM CURRENT_DATE);

    -- 2. Billing Summary
    SELECT 
        COUNT(*), 
        COALESCE(SUM(
            i.nominal - COALESCE((
                SELECT SUM(p.nominal)
                FROM public.payments p
                WHERE p.invoice_id = i.id
            ), 0)
        ), 0)
    INTO v_total_bills, v_unpaid_bills
    FROM public.invoices i
    WHERE i.siswa_id = ANY(v_children_ids)
    AND i.status IN ('unpaid', 'partial');

    -- 3. Recent Attendance (Last 5 records across all children)
    SELECT json_agg(
        json_build_object(
            'id', a.id,
            'tanggal', a.tanggal,
            'status', a.status,
            'child_name', u.full_name,
            'mata_pelajaran', mp.nama,
            'waktu', to_char(sch.jam_mulai, 'HH24:MI')
        ) ORDER BY a.tanggal DESC, sch.jam_mulai DESC
    ) INTO v_recent_attendance
    FROM (
        SELECT * FROM public.attendances
        WHERE siswa_id = ANY(v_children_ids)
        ORDER BY tanggal DESC
        LIMIT 5
    ) a
    JOIN public.siswa s ON a.siswa_id = s.id
    JOIN public.users u ON s.user_id = u.id
    JOIN public.schedules sch ON a.schedule_id = sch.id
    JOIN public.mata_pelajaran mp ON sch.mata_pelajaran_id = mp.id;

    -- 4. Today's Schedule
    v_today_dow := EXTRACT(ISODOW FROM CURRENT_DATE)::int;
    
    SELECT json_agg(
        json_build_object(
            'id', sch.id,
            'mata_pelajaran', mp.nama,
            'jam_mulai', to_char(sch.jam_mulai, 'HH24:MI'),
            'jam_selesai', to_char(sch.jam_selesai, 'HH24:MI'),
            'child_name', u.full_name,
            'teacher_name', COALESCE(gu.full_name, 'Belum ditentukan'),
            'status', CASE 
                WHEN CURRENT_TIME BETWEEN sch.jam_mulai AND sch.jam_selesai THEN 'ongoing'
                WHEN CURRENT_TIME > sch.jam_selesai THEN 'completed'
                ELSE 'upcoming'
            END
        ) ORDER BY sch.jam_mulai ASC
    ) INTO v_schedule
    FROM public.schedules sch
    JOIN public.mata_pelajaran mp ON sch.mata_pelajaran_id = mp.id
    JOIN public.siswa s ON sch.kelas_id = s.kelas_id
    JOIN public.users u ON s.user_id = u.id
    LEFT JOIN public.guru g ON sch.guru_id = g.id
    LEFT JOIN public.users gu ON g.user_id = gu.id
    WHERE s.id = ANY(v_children_ids)
    AND sch.hari = v_today_dow;

    RETURN json_build_object(
        'success', true,
        'total_students', array_length(v_children_ids, 1),
        'attendance_summary', v_stats,
        'billing_summary', json_build_object(
            'total_pending_invoices', v_total_bills,
            'total_unpaid_amount', v_unpaid_bills
        ),
        'recent_attendance', COALESCE(v_recent_attendance, '[]'::json),
        'todays_schedule', COALESCE(v_schedule, '[]'::json)
    );
END;
$$;


ALTER FUNCTION "public"."get_wali_dashboard"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_wali_profile"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_data json;
BEGIN
    SELECT json_build_object(
        'user_id', u.id,
        'full_name', u.full_name,
        'email', u.email,
        'phone', u.phone,
        'avatar_url', u.avatar_url,
        'wali_id', wm.id,
        'hubungan', wm.hubungan,
        'children_count', (SELECT COUNT(*) FROM public.siswa_wali WHERE wali_id = wm.id)
    ) INTO v_data
    FROM public.users u
    JOIN public.wali_murid wm ON u.id = wm.user_id
    WHERE u.id = p_user_id;

    IF v_data IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Profile not found');
    END IF;

    RETURN json_build_object('success', true, 'data', v_data);
END;
$$;


ALTER FUNCTION "public"."get_wali_profile"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_walikelas_attendance_monitoring"("p_user_id" "uuid", "p_month" integer DEFAULT NULL::integer, "p_year" integer DEFAULT NULL::integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_kelas_id INTEGER;
    v_kelas_data json;
    v_today_stats json;
    v_monthly_trend json;
    v_risk_students json;
    v_composition json;
    v_weekly_comparison json;
    v_today date := CURRENT_DATE;
    v_month int := COALESCE(p_month, EXTRACT(MONTH FROM CURRENT_DATE)::int);
    v_year int := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::int);
    v_total_students int := 0;
BEGIN
    -- 1. Get Kelas ID
    SELECT id INTO v_kelas_id
    FROM public.kelas
    WHERE wali_kelas_id = p_user_id
    LIMIT 1;

    IF v_kelas_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Guru tidak memiliki kelas binaan'
        );
    END IF;

    -- Get total active students in class
    SELECT COUNT(*) INTO v_total_students
    FROM public.siswa
    WHERE kelas_id = v_kelas_id AND status = 'aktif';

    -- 2. Get Class Info
    SELECT json_build_object(
        'id', k.id,
        'nama', k.nama
    ) INTO v_kelas_data
    FROM public.kelas k
    WHERE k.id = v_kelas_id;

    -- 3. Get Today's Stats
    -- FIX: Use COUNT(DISTINCT) to count unique students per status
    SELECT json_build_object(
        'hadir', COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'hadir'),
        'sakit', COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'sakit'),
        'izin', COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'izin'),
        'alpha', COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'alpha'),
        'total', v_total_students,
        'recorded', COUNT(DISTINCT s.id)
    ) INTO v_today_stats
    FROM public.attendances a
    JOIN public.siswa s ON a.siswa_id = s.id
    WHERE s.kelas_id = v_kelas_id 
      AND s.status = 'aktif'
      AND a.tanggal = v_today;

    -- 4. Get Monthly Trend (daily attendance percentage)
    -- FIX: Use COUNT(DISTINCT) for accurate percentage
    SELECT json_agg(
        json_build_object(
            'date', d.date,
            'hadir_percentage', COALESCE((
                SELECT ROUND(
                    (COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'hadir')::numeric / 
                     NULLIF(COUNT(DISTINCT s.id)::numeric, 0)) * 100, 1
                )
                FROM public.attendances a
                JOIN public.siswa s ON a.siswa_id = s.id
                WHERE s.kelas_id = v_kelas_id 
                  AND s.status = 'aktif'
                  AND a.tanggal = d.date
            ), 0)
        ) ORDER BY d.date
    ) INTO v_monthly_trend
    FROM (
        SELECT generate_series(
            make_date(v_year, v_month, 1),
            LEAST(
                (make_date(v_year, v_month, 1) + INTERVAL '1 month' - INTERVAL '1 day')::date,
                v_today
            ),
            '1 day'
        )::date AS date
    ) d;

    -- 5. Get Risk Students (alpha >= 2 in current month)
    SELECT json_agg(
        json_build_object(
            'id', rs.id,
            'nis', rs.nis,
            'name', rs.name,
            'avatar_url', rs.avatar_url,
            'total_alpha', rs.alpha_count,
            'last_absent_date', rs.last_alpha,
            'parent_phone', rs.phone,
            'risk_level', CASE 
                WHEN rs.alpha_count >= 5 THEN 'high'
                WHEN rs.alpha_count >= 3 THEN 'medium'
                ELSE 'low'
            END
        ) ORDER BY rs.alpha_count DESC
    ) INTO v_risk_students
    FROM (
        SELECT 
            s.id,
            s.nis,
            u.full_name AS name,
            u.avatar_url,
            u.phone AS phone,
            COUNT(DISTINCT a.tanggal) AS alpha_count,
            MAX(a.tanggal) AS last_alpha
        FROM public.siswa s
        JOIN public.users u ON s.user_id = u.id
        JOIN public.attendances a ON a.siswa_id = s.id
        WHERE s.kelas_id = v_kelas_id
          AND s.status = 'aktif'
          AND a.status = 'alpha'
          AND EXTRACT(MONTH FROM a.tanggal) = v_month
          AND EXTRACT(YEAR FROM a.tanggal) = v_year
        GROUP BY s.id, s.nis, u.full_name, u.avatar_url, u.phone
        HAVING COUNT(DISTINCT a.tanggal) >= 2
    ) rs;

    -- 6. Get Monthly Composition
    -- FIX: Use COUNT(DISTINCT) for accurate counts
    SELECT json_build_object(
        'hadir', COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'hadir'),
        'sakit', COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'sakit'),
        'izin', COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'izin'),
        'alpha', COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'alpha')
    ) INTO v_composition
    FROM public.attendances a
    JOIN public.siswa s ON a.siswa_id = s.id
    WHERE s.kelas_id = v_kelas_id
      AND s.status = 'aktif'
      AND EXTRACT(MONTH FROM a.tanggal) = v_month
      AND EXTRACT(YEAR FROM a.tanggal) = v_year;

    -- 7. Get Weekly Comparison
    -- FIX: Use COUNT(DISTINCT) for accurate percentage
    SELECT json_build_object(
        'this_week', COALESCE((
            SELECT ROUND(
                (COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'hadir')::numeric / 
                 NULLIF(COUNT(DISTINCT s.id)::numeric, 0)) * 100, 1
            )
            FROM public.attendances a
            JOIN public.siswa s ON a.siswa_id = s.id
            WHERE s.kelas_id = v_kelas_id
              AND s.status = 'aktif'
              AND a.tanggal BETWEEN v_today - INTERVAL '6 days' AND v_today
        ), 0),
        'last_week', COALESCE((
            SELECT ROUND(
                (COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'hadir')::numeric / 
                 NULLIF(COUNT(DISTINCT s.id)::numeric, 0)) * 100, 1
            )
            FROM public.attendances a
            JOIN public.siswa s ON a.siswa_id = s.id
            WHERE s.kelas_id = v_kelas_id
              AND s.status = 'aktif'
              AND a.tanggal BETWEEN v_today - INTERVAL '13 days' AND v_today - INTERVAL '7 days'
        ), 0)
    ) INTO v_weekly_comparison;

    -- Return
    RETURN json_build_object(
        'success', true,
        'kelas', v_kelas_data,
        'today_stats', v_today_stats,
        'monthly_trend', COALESCE(v_monthly_trend, '[]'::json),
        'risk_students', COALESCE(v_risk_students, '[]'::json),
        'composition', v_composition,
        'weekly_comparison', v_weekly_comparison,
        'period', json_build_object('month', v_month, 'year', v_year)
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."get_walikelas_attendance_monitoring"("p_user_id" "uuid", "p_month" integer, "p_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_walikelas_class_students"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_kelas_id INTEGER;
    v_kelas_data json;
    v_students_data json;
    v_total_students int := 0;
    v_male_count int := 0;
    v_female_count int := 0;
BEGIN
    -- 1. Get Kelas ID
    SELECT id INTO v_kelas_id
    FROM public.kelas
    WHERE wali_kelas_id = p_user_id
    LIMIT 1;

    IF v_kelas_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Guru tidak memiliki kelas binaan',
            'kelas', null,
            'students', '[]'::json,
            'total_students', 0,
            'male_count', 0,
            'female_count', 0
        );
    END IF;

    -- 2. Get Class Info
    SELECT json_build_object(
        'id', k.id,
        'nama', k.nama,
        'tingkat', k.tingkat,
        'jurusan', (SELECT j.nama FROM public.jurusan j WHERE j.id = k.jurusan_id)
    ) INTO v_kelas_data
    FROM public.kelas k
    WHERE k.id = v_kelas_id;

    -- 3. Get Counts
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE s.jenis_kelamin = 'L'),
        COUNT(*) FILTER (WHERE s.jenis_kelamin = 'P')
    INTO v_total_students, v_male_count, v_female_count
    FROM public.siswa s
    WHERE s.kelas_id = v_kelas_id AND s.status = 'aktif';

    -- 4. Get Detailed Student List
    SELECT json_agg(
        json_build_object(
            'id', s.id,
            'nis', s.nis,
            'user_id', s.user_id,
            'name', u.full_name,
            'email', u.email,
            'phone', u.phone,
            'gender', s.jenis_kelamin,
            'birth_date', s.tanggal_lahir,
            'address', s.alamat,
            'avatar_url', u.avatar_url,
            'status', s.status,
            'attendance_summary', json_build_object(
                'hadir', (SELECT COUNT(*) FROM public.attendances a WHERE a.siswa_id = s.id AND a.status = 'hadir'),
                'sakit', (SELECT COUNT(*) FROM public.attendances a WHERE a.siswa_id = s.id AND a.status = 'sakit'),
                'izin', (SELECT COUNT(*) FROM public.attendances a WHERE a.siswa_id = s.id AND a.status = 'izin'),
                'alpha', (SELECT COUNT(*) FROM public.attendances a WHERE a.siswa_id = s.id AND a.status = 'alpha')
            ),
            'parents', COALESCE((
                SELECT json_agg(json_build_object(
                    'name', wu.full_name,
                    'phone', wu.phone,
                    'hubungan', wm.hubungan,
                    'is_primary', sw.is_primary
                ))
                FROM public.siswa_wali sw
                JOIN public.wali_murid wm ON sw.wali_id = wm.id
                JOIN public.users wu ON wm.user_id = wu.id
                WHERE sw.siswa_id = s.id
            ), '[]'::json)
        ) ORDER BY u.full_name ASC
    ) INTO v_students_data
    FROM public.siswa s
    JOIN public.users u ON s.user_id = u.id
    WHERE s.kelas_id = v_kelas_id AND s.status = 'aktif';

    -- Return
    RETURN json_build_object(
        'success', true,
        'kelas', v_kelas_data,
        'students', COALESCE(v_students_data, '[]'::json),
        'total_students', v_total_students,
        'male_count', v_male_count,
        'female_count', v_female_count
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'message', SQLERRM,
        'kelas', null,
        'students', '[]'::json,
        'total_students', 0,
        'male_count', 0,
        'female_count', 0
    );
END;
$$;


ALTER FUNCTION "public"."get_walikelas_class_students"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_walikelas_dashboard"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_kelas_id INTEGER;
    v_kelas_data json;
    v_stats json;
    v_absent_students json;
    v_recent_attendance json;
    v_today date := CURRENT_DATE;
    v_day_of_week int := EXTRACT(ISODOW FROM CURRENT_DATE)::int; -- 1=Monday, 7=Sunday
    v_total_students int := 0;
    v_hadir int := 0;
    v_sakit int := 0;
    v_izin int := 0;
    v_alpha int := 0;
BEGIN
    -- 1. Get Kelas ID where this user is wali kelas
    SELECT id INTO v_kelas_id
    FROM public.kelas
    WHERE wali_kelas_id = p_user_id
    LIMIT 1;

    IF v_kelas_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Guru tidak memiliki kelas binaan'
        );
    END IF;

    -- 2. Get Total Active Students
    SELECT COUNT(*) INTO v_total_students
    FROM public.siswa
    WHERE kelas_id = v_kelas_id AND status = 'aktif';

    -- 3. Get Class Info
    SELECT json_build_object(
        'id', k.id,
        'nama', k.nama,
        'tingkat', k.tingkat,
        'jurusan', (SELECT j.nama FROM public.jurusan j WHERE j.id = k.jurusan_id),
        'total_students', v_total_students
    ) INTO v_kelas_data
    FROM public.kelas k
    WHERE k.id = v_kelas_id;

    -- 4. Get Today's Attendance Stats (FIXED: COUNT DISTINCT students)
    SELECT
        COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'hadir'),
        COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'sakit'),
        COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'izin'),
        COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'alpha')
    INTO v_hadir, v_sakit, v_izin, v_alpha
    FROM public.siswa s
    LEFT JOIN public.attendances a ON s.id = a.siswa_id AND a.tanggal = v_today
    WHERE s.kelas_id = v_kelas_id AND s.status = 'aktif';

    -- Handle nulls
    v_hadir := COALESCE(v_hadir, 0);
    v_sakit := COALESCE(v_sakit, 0);
    v_izin := COALESCE(v_izin, 0);
    v_alpha := COALESCE(v_alpha, 0);

    -- 5. Build Stats
    v_stats := json_build_object(
        'hadir', v_hadir,
        'sakit', v_sakit,
        'izin', v_izin,
        'alpha', v_alpha,
        'total_students', v_total_students,
        'belum_absen', GREATEST(0, v_total_students - (v_hadir + v_sakit + v_izin + v_alpha))
    );

    -- 6. Get Absent Students with Subjects Missed (NEW - replaces full student list)
    -- Only students with status != 'hadir' today
    SELECT json_agg(
        json_build_object(
            'id', student_data.siswa_id,
            'nis', student_data.nis,
            'name', student_data.name,
            'avatar_url', student_data.avatar_url,
            'status', student_data.status,
            'subjects_missed', student_data.subjects_missed
        ) ORDER BY student_data.name ASC
    ) INTO v_absent_students
    FROM (
        SELECT DISTINCT ON (s.id)
            s.id AS siswa_id,
            s.nis,
            u.full_name AS name,
            u.avatar_url,
            -- Determine overall status for today (prioritize: alpha > izin > sakit > belum_absen)
            COALESCE(
                (SELECT a.status FROM public.attendances a 
                 WHERE a.siswa_id = s.id AND a.tanggal = v_today 
                 AND a.status IN ('alpha', 'izin', 'sakit')
                 ORDER BY 
                    CASE a.status 
                        WHEN 'alpha' THEN 1 
                        WHEN 'izin' THEN 2 
                        WHEN 'sakit' THEN 3 
                    END
                 LIMIT 1),
                'belum_absen'
            ) AS status,
            -- Get list of subjects missed (where student is not 'hadir')
            (
                SELECT json_agg(
                    json_build_object(
                        'subject', mp.nama,
                        'time', TO_CHAR(sch.jam_mulai, 'HH24:MI') || '-' || TO_CHAR(sch.jam_selesai, 'HH24:MI'),
                        'status', a.status
                    ) ORDER BY sch.jam_mulai
                )
                FROM public.attendances a
                JOIN public.schedules sch ON a.schedule_id = sch.id
                JOIN public.mata_pelajaran mp ON sch.mata_pelajaran_id = mp.id
                WHERE a.siswa_id = s.id 
                  AND a.tanggal = v_today 
                  AND a.status != 'hadir'
            ) AS subjects_missed
        FROM public.siswa s
        JOIN public.users u ON s.user_id = u.id
        WHERE s.kelas_id = v_kelas_id 
          AND s.status = 'aktif'
          -- Only include students who have at least one non-hadir attendance or no attendance yet
          AND (
              EXISTS (
                  SELECT 1 FROM public.attendances a 
                  WHERE a.siswa_id = s.id AND a.tanggal = v_today AND a.status != 'hadir'
              )
              OR NOT EXISTS (
                  SELECT 1 FROM public.attendances a 
                  WHERE a.siswa_id = s.id AND a.tanggal = v_today
              )
          )
    ) student_data
    WHERE student_data.status != 'hadir';

    -- 7. Get Recent Attendance Trends (Last 7 Days) - FIXED with COUNT DISTINCT
    SELECT json_agg(
        json_build_object(
            'date', t.day,
            'hadir', (
                SELECT COUNT(DISTINCT s.id) 
                FROM public.attendances a 
                JOIN public.siswa s ON a.siswa_id = s.id 
                WHERE s.kelas_id = v_kelas_id AND s.status = 'aktif'
                  AND a.tanggal = t.day AND a.status = 'hadir'
            ),
            'percentage', (
                SELECT CASE WHEN COUNT(DISTINCT s.id) > 0 THEN
                    ROUND((COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'hadir')::numeric / 
                           COUNT(DISTINCT s.id)::numeric) * 100, 1)
                ELSE 0 END
                FROM public.siswa s
                LEFT JOIN public.attendances a ON a.siswa_id = s.id AND a.tanggal = t.day
                WHERE s.kelas_id = v_kelas_id AND s.status = 'aktif'
            )
        ) ORDER BY t.day ASC
    ) INTO v_recent_attendance
    FROM (
        SELECT generate_series(v_today - INTERVAL '6 days', v_today, '1 day')::date AS day
    ) t;

    -- Return the composed object
    RETURN json_build_object(
        'success', true,
        'kelas', v_kelas_data,
        'stats', v_stats,
        'absent_students', COALESCE(v_absent_students, '[]'::json),
        'recent_attendance', COALESCE(v_recent_attendance, '[]'::json)
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."get_walikelas_dashboard"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_walikelas_monthly_report"("p_user_id" "uuid", "p_month" integer, "p_year" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_kelas_id INTEGER;
    v_kelas_data json;
    v_students_data json;
    v_summary json;
    v_working_days int;
BEGIN
    -- Get Kelas
    SELECT id INTO v_kelas_id
    FROM public.kelas
    WHERE wali_kelas_id = p_user_id
    LIMIT 1;

    IF v_kelas_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Tidak memiliki kelas binaan');
    END IF;

    -- Get Class Info
    SELECT json_build_object(
        'id', k.id,
        'nama', k.nama,
        'tingkat', k.tingkat,
        'wali_kelas', (SELECT full_name FROM public.users WHERE id = k.wali_kelas_id)
    ) INTO v_kelas_data
    FROM public.kelas k
    WHERE k.id = v_kelas_id;

    -- Count working days (unique dates)
    SELECT COUNT(DISTINCT tanggal) INTO v_working_days
    FROM public.attendances a
    JOIN public.siswa s ON a.siswa_id = s.id
    WHERE s.kelas_id = v_kelas_id
      AND EXTRACT(MONTH FROM a.tanggal) = p_month
      AND EXTRACT(YEAR FROM a.tanggal) = p_year;

    -- Get Students with attendance
    -- Percentage is calculated based on total attendance records per student
    -- (hadir / total_records * 100)
    SELECT json_agg(
        json_build_object(
            'id', s.id,
            'nis', s.nis,
            'name', u.full_name,
            'hadir', (
                SELECT COUNT(*) FROM public.attendances a 
                WHERE a.siswa_id = s.id AND a.status = 'hadir'
                AND EXTRACT(MONTH FROM a.tanggal) = p_month
                AND EXTRACT(YEAR FROM a.tanggal) = p_year
            ),
            'sakit', (
                SELECT COUNT(*) FROM public.attendances a 
                WHERE a.siswa_id = s.id AND a.status = 'sakit'
                AND EXTRACT(MONTH FROM a.tanggal) = p_month
                AND EXTRACT(YEAR FROM a.tanggal) = p_year
            ),
            'izin', (
                SELECT COUNT(*) FROM public.attendances a 
                WHERE a.siswa_id = s.id AND a.status = 'izin'
                AND EXTRACT(MONTH FROM a.tanggal) = p_month
                AND EXTRACT(YEAR FROM a.tanggal) = p_year
            ),
            'alpha', (
                SELECT COUNT(*) FROM public.attendances a 
                WHERE a.siswa_id = s.id AND a.status = 'alpha'
                AND EXTRACT(MONTH FROM a.tanggal) = p_month
                AND EXTRACT(YEAR FROM a.tanggal) = p_year
            ),
            'percentage', ROUND(
                (SELECT COUNT(*) FROM public.attendances a 
                 WHERE a.siswa_id = s.id AND a.status = 'hadir'
                 AND EXTRACT(MONTH FROM a.tanggal) = p_month
                 AND EXTRACT(YEAR FROM a.tanggal) = p_year)::numeric /
                NULLIF((SELECT COUNT(*) FROM public.attendances a 
                 WHERE a.siswa_id = s.id
                 AND EXTRACT(MONTH FROM a.tanggal) = p_month
                 AND EXTRACT(YEAR FROM a.tanggal) = p_year)::numeric, 0) * 100, 1
            )
        ) ORDER BY u.full_name
    ) INTO v_students_data
    FROM public.siswa s
    JOIN public.users u ON s.user_id = u.id
    WHERE s.kelas_id = v_kelas_id AND s.status = 'aktif';

    -- Calculate summary (average attendance percentage)
    SELECT json_build_object(
        'total_students', (SELECT COUNT(*) FROM public.siswa WHERE kelas_id = v_kelas_id AND status = 'aktif'),
        'avg_attendance', (
            SELECT ROUND(AVG(
                (SELECT COUNT(*) FROM public.attendances a2 
                 WHERE a2.siswa_id = s.id AND a2.status = 'hadir'
                 AND EXTRACT(MONTH FROM a2.tanggal) = p_month
                 AND EXTRACT(YEAR FROM a2.tanggal) = p_year)::numeric /
                NULLIF((SELECT COUNT(*) FROM public.attendances a2 
                 WHERE a2.siswa_id = s.id
                 AND EXTRACT(MONTH FROM a2.tanggal) = p_month
                 AND EXTRACT(YEAR FROM a2.tanggal) = p_year)::numeric, 0) * 100
            ), 1)
            FROM public.siswa s WHERE s.kelas_id = v_kelas_id AND s.status = 'aktif'
        )
    ) INTO v_summary;

    RETURN json_build_object(
        'success', true,
        'kelas', v_kelas_data,
        'students', COALESCE(v_students_data, '[]'::json),
        'summary', v_summary,
        'period', json_build_object(
            'month', p_month,
            'year', p_year,
            'working_days', v_working_days
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."get_walikelas_monthly_report"("p_user_id" "uuid", "p_month" integer, "p_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_walikelas_profile"("p_user_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_data json;
    v_guru_data json;
    v_kelas_id INTEGER;
    v_kelas_data json;
    v_stats json;
    v_has_class boolean := false;
BEGIN
    -- 1. Get User Data
    SELECT json_build_object(
        'id', u.id,
        'email', u.email,
        'full_name', u.full_name,
        'avatar_url', u.avatar_url,
        'phone', u.phone
    ) INTO v_user_data
    FROM public.users u
    WHERE u.id = p_user_id;

    IF v_user_data IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'message', 'User tidak ditemukan'
        );
    END IF;

    -- 2. Get Guru Data
    SELECT json_build_object(
        'id', g.id,
        'nip', g.nip,
        'bidang_studi', g.bidang_studi,
        'status', g.status
    ) INTO v_guru_data
    FROM public.guru g
    WHERE g.user_id = p_user_id;

    -- 3. Get Kelas
    SELECT id INTO v_kelas_id
    FROM public.kelas
    WHERE wali_kelas_id = p_user_id
    LIMIT 1;

    IF v_kelas_id IS NOT NULL THEN
        v_has_class := true;

        -- Get class info with counts
        SELECT json_build_object(
            'id', k.id,
            'nama', k.nama,
            'tingkat', k.tingkat,
            'jurusan', (SELECT j.nama FROM public.jurusan j WHERE j.id = k.jurusan_id),
            'total_students', (SELECT COUNT(*) FROM public.siswa WHERE kelas_id = k.id AND status = 'aktif'),
            'male_count', (SELECT COUNT(*) FROM public.siswa WHERE kelas_id = k.id AND status = 'aktif' AND jenis_kelamin = 'L'),
            'female_count', (SELECT COUNT(*) FROM public.siswa WHERE kelas_id = k.id AND status = 'aktif' AND jenis_kelamin = 'P')
        ) INTO v_kelas_data
        FROM public.kelas k
        WHERE k.id = v_kelas_id;

        -- Get performance stats
        SELECT json_build_object(
            'avg_attendance_rate', COALESCE((
                SELECT ROUND(
                    (COUNT(*) FILTER (WHERE a.status = 'hadir')::numeric / NULLIF(COUNT(*)::numeric, 0)) * 100, 1
                )
                FROM public.attendances a
                JOIN public.siswa s ON a.siswa_id = s.id
                WHERE s.kelas_id = v_kelas_id
                  AND a.tanggal >= CURRENT_DATE - INTERVAL '90 days'
            ), 0),
            'total_alpha_students', (
                SELECT COUNT(DISTINCT s.id)
                FROM public.siswa s
                JOIN public.attendances a ON a.siswa_id = s.id
                WHERE s.kelas_id = v_kelas_id
                  AND a.status = 'alpha'
                  AND EXTRACT(MONTH FROM a.tanggal) = EXTRACT(MONTH FROM CURRENT_DATE)
                  AND EXTRACT(YEAR FROM a.tanggal) = EXTRACT(YEAR FROM CURRENT_DATE)
                GROUP BY s.id
                HAVING COUNT(*) >= 3
            ),
            'academic_year', (
                SELECT ta.nama FROM public.tahun_ajaran ta WHERE ta.is_active = true LIMIT 1
            )
        ) INTO v_stats;
    END IF;

    -- Return
    RETURN json_build_object(
        'success', true,
        'user', v_user_data,
        'guru', v_guru_data,
        'kelas', v_kelas_data,
        'stats', v_stats,
        'has_class', v_has_class
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."get_walikelas_profile"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_walikelas_semester_report"("p_user_id" "uuid", "p_semester" integer, "p_year" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_kelas_id INTEGER;
    v_kelas_data json;
    v_students_data json;
    v_start_month int;
    v_end_month int;
    v_total_days int;
BEGIN
    -- Semester 1 = Jul-Dec, Semester 2 = Jan-Jun
    IF p_semester = 1 THEN
        v_start_month := 7;
        v_end_month := 12;
    ELSE
        v_start_month := 1;
        v_end_month := 6;
    END IF;

    -- Get Kelas
    SELECT id INTO v_kelas_id
    FROM public.kelas
    WHERE wali_kelas_id = p_user_id
    LIMIT 1;

    IF v_kelas_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Tidak memiliki kelas binaan');
    END IF;

    -- Get Class Info
    SELECT json_build_object(
        'id', k.id,
        'nama', k.nama,
        'wali_kelas', (SELECT full_name FROM public.users WHERE id = k.wali_kelas_id)
    ) INTO v_kelas_data
    FROM public.kelas k
    WHERE k.id = v_kelas_id;

    -- Count total days
    SELECT COUNT(DISTINCT tanggal) INTO v_total_days
    FROM public.attendances a
    JOIN public.siswa s ON a.siswa_id = s.id
    WHERE s.kelas_id = v_kelas_id
      AND EXTRACT(MONTH FROM a.tanggal) BETWEEN v_start_month AND v_end_month
      AND EXTRACT(YEAR FROM a.tanggal) = p_year;

    -- Get Students with semester attendance
    -- Percentage based on total attendance records per student
    SELECT json_agg(
        json_build_object(
            'id', s.id,
            'nis', s.nis,
            'name', u.full_name,
            'hadir', (
                SELECT COUNT(*) FROM public.attendances a 
                WHERE a.siswa_id = s.id AND a.status = 'hadir'
                AND EXTRACT(MONTH FROM a.tanggal) BETWEEN v_start_month AND v_end_month
                AND EXTRACT(YEAR FROM a.tanggal) = p_year
            ),
            'sakit', (
                SELECT COUNT(*) FROM public.attendances a 
                WHERE a.siswa_id = s.id AND a.status = 'sakit'
                AND EXTRACT(MONTH FROM a.tanggal) BETWEEN v_start_month AND v_end_month
                AND EXTRACT(YEAR FROM a.tanggal) = p_year
            ),
            'izin', (
                SELECT COUNT(*) FROM public.attendances a 
                WHERE a.siswa_id = s.id AND a.status = 'izin'
                AND EXTRACT(MONTH FROM a.tanggal) BETWEEN v_start_month AND v_end_month
                AND EXTRACT(YEAR FROM a.tanggal) = p_year
            ),
            'alpha', (
                SELECT COUNT(*) FROM public.attendances a 
                WHERE a.siswa_id = s.id AND a.status = 'alpha'
                AND EXTRACT(MONTH FROM a.tanggal) BETWEEN v_start_month AND v_end_month
                AND EXTRACT(YEAR FROM a.tanggal) = p_year
            ),
            'percentage', ROUND(
                (SELECT COUNT(*) FROM public.attendances a 
                 WHERE a.siswa_id = s.id AND a.status = 'hadir'
                 AND EXTRACT(MONTH FROM a.tanggal) BETWEEN v_start_month AND v_end_month
                 AND EXTRACT(YEAR FROM a.tanggal) = p_year)::numeric /
                NULLIF((SELECT COUNT(*) FROM public.attendances a 
                 WHERE a.siswa_id = s.id
                 AND EXTRACT(MONTH FROM a.tanggal) BETWEEN v_start_month AND v_end_month
                 AND EXTRACT(YEAR FROM a.tanggal) = p_year)::numeric, 0) * 100, 1
            )
        ) ORDER BY u.full_name
    ) INTO v_students_data
    FROM public.siswa s
    JOIN public.users u ON s.user_id = u.id
    WHERE s.kelas_id = v_kelas_id AND s.status = 'aktif';

    RETURN json_build_object(
        'success', true,
        'kelas', v_kelas_data,
        'students', COALESCE(v_students_data, '[]'::json),
        'summary', json_build_object(
            'avg_attendance', (
                SELECT ROUND(AVG(
                    (SELECT COUNT(*) FROM public.attendances a2 
                     WHERE a2.siswa_id = s.id AND a2.status = 'hadir'
                     AND EXTRACT(MONTH FROM a2.tanggal) BETWEEN v_start_month AND v_end_month
                     AND EXTRACT(YEAR FROM a2.tanggal) = p_year)::numeric /
                    NULLIF((SELECT COUNT(*) FROM public.attendances a2 
                     WHERE a2.siswa_id = s.id
                     AND EXTRACT(MONTH FROM a2.tanggal) BETWEEN v_start_month AND v_end_month
                     AND EXTRACT(YEAR FROM a2.tanggal) = p_year)::numeric, 0) * 100
                ), 1)
                FROM public.siswa s WHERE s.kelas_id = v_kelas_id AND s.status = 'aktif'
            )
        ),
        'period', json_build_object(
            'semester', p_semester,
            'semester_name', CASE WHEN p_semester = 1 THEN 'Ganjil' ELSE 'Genap' END,
            'year', p_year,
            'total_days', v_total_days
        )
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."get_walikelas_semester_report"("p_user_id" "uuid", "p_semester" integer, "p_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_attendance_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_student_name TEXT;
    v_parent_ids UUID[];
    v_parent_id UUID;
    v_title TEXT;
    v_message TEXT;
    v_type TEXT := 'info';
    
    -- New details
    v_mapel TEXT;
    v_jam TEXT;
    v_inputter TEXT;
BEGIN
    -- Only trigger for non-Hadir status
    IF NEW.status IN ('hadir') THEN
        RETURN NEW;
    END IF;

    -- Get student name
    SELECT u.full_name INTO v_student_name
    FROM public.siswa s
    JOIN public.users u ON s.user_id = u.id
    WHERE s.id = NEW.siswa_id;

    -- Get detailed info (Subject, Time, Inputter)
    SELECT 
        mp.nama,
        to_char(sch.jam_mulai, 'HH24:MI') || ' - ' || to_char(sch.jam_selesai, 'HH24:MI'),
        COALESCE(u.full_name, 'Sistem')
    INTO 
        v_mapel,
        v_jam,
        v_inputter
    FROM public.schedules sch
    JOIN public.mata_pelajaran mp ON sch.mata_pelajaran_id = mp.id
    LEFT JOIN public.users u ON u.id = NEW.input_by
    WHERE sch.id = NEW.schedule_id;

    -- Fallbacks if schedule_id is missing or invalid
    v_mapel := COALESCE(v_mapel, 'pelajaran');
    v_jam := COALESCE(v_jam, '-');
    v_inputter := COALESCE(v_inputter, 'Sistem');

    -- Get Parent IDs
    SELECT array_agg(wm.user_id) INTO v_parent_ids
    FROM public.siswa_wali sw
    JOIN public.wali_murid wm ON sw.wali_id = wm.id
    WHERE sw.siswa_id = NEW.siswa_id;

    IF v_parent_ids IS NULL THEN
        RETURN NEW;
    END IF;

    -- Construct Message based on status with detailed info
    IF NEW.status = 'alpha' THEN
        v_title := 'Ketidakhadiran: Alpha';
        v_message := 'Perhatian: ' || v_student_name || ' tercatat Alpha pada ' || v_mapel || ' (' || v_jam || '). Diinput oleh: ' || v_inputter || '.';
        v_type := 'danger';
    ELSIF NEW.status = 'sakit' THEN
        v_title := 'Ketidakhadiran: Sakit';
        v_message := v_student_name || ' tercatat Sakit pada ' || v_mapel || ' (' || v_jam || '). Diinput oleh: ' || v_inputter || '.';
        v_type := 'warning';
    ELSIF NEW.status = 'izin' THEN
        v_title := 'Ketidakhadiran: Izin';
        v_message := v_student_name || ' tercatat Izin pada ' || v_mapel || ' (' || v_jam || '). Diinput oleh: ' || v_inputter || '.';
        v_type := 'info';
    ELSE
         RETURN NEW;
    END IF;

    -- Send to all connected parents
    FOREACH v_parent_id IN ARRAY v_parent_ids
    LOOP
        INSERT INTO public.notifications (user_id, title, message, type, category, reference_id)
        VALUES (v_parent_id, v_title, v_message, v_type, 'attendance', NEW.id::text);
    END LOOP;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_attendance_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_invoice_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_student_name TEXT;
    v_parent_ids UUID[];
    v_parent_id UUID;
BEGIN
    -- Get student name
    SELECT u.full_name INTO v_student_name
    FROM public.siswa s
    JOIN public.users u ON s.user_id = u.id
    WHERE s.id = NEW.siswa_id;

    -- Get Parent IDs
    SELECT array_agg(wm.user_id) INTO v_parent_ids
    FROM public.siswa_wali sw
    JOIN public.wali_murid wm ON sw.wali_id = wm.id
    WHERE sw.siswa_id = NEW.siswa_id;

    IF v_parent_ids IS NULL THEN
        RETURN NEW;
    END IF;

    FOREACH v_parent_id IN ARRAY v_parent_ids
    LOOP
        INSERT INTO public.notifications (user_id, title, message, type, category, reference_id)
        VALUES (
            v_parent_id, 
            'Tagihan Baru', 
            'Tagihan baru sebesar Rp ' || TO_CHAR(NEW.nominal, 'FM999,999,999') || ' untuk ' || v_student_name || ' telah diterbitkan.',
            'warning', 
            'billing', 
            NEW.id::text
        );
    END LOOP;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_invoice_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    default_role text := 'siswa'; -- Default role if none provided
    assigned_role text;
    role_id_val int;
BEGIN
    -- Check if metadata exists, if not use empty object
    IF NEW.raw_user_meta_data IS NULL THEN
        NEW.raw_user_meta_data := '{}'::jsonb;
    END IF;

    -- Extract role from metadata or use default
    -- We look for 'primaryRole' or the first item in 'roles' array
    assigned_role := COALESCE(
        NEW.raw_user_meta_data->>'primaryRole',
        NEW.raw_user_meta_data->'roles'->>0,
        default_role
    );

    -- 1. Create Public Profile
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url;

    -- 2. Assign Role in public.user_roles
    -- Get Role ID
    SELECT id INTO role_id_val FROM public.roles WHERE name = assigned_role;
    
    -- If role exists, assign it
    IF role_id_val IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (NEW.id, role_id_val)
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;

    -- 3. Ensure Metadata is synced (in case we used default)
    -- We perform a purely metadata update on the NEW object so it gets saved to auth.users
    -- Note: modifying NEW in an AFTER trigger doesn't persist changes to the row itself for the trigger firing,
    -- but handle_new_user is typically AFTER INSERT. 
    -- To update the auth.users row again, we would need an update statement, but that triggers recursion.
    -- Best practice: Trust the "sync_user_role_to_metadata" to handle the sync back if we inserted into user_roles.
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_role"("role_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = role_name
    );
END;
$$;


ALTER FUNCTION "public"."has_role"("role_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Verify auth
    IF auth.uid() != p_user_id THEN
        RETURN FALSE;
    END IF;

    UPDATE public.notifications
    SET is_read = TRUE
    WHERE user_id = p_user_id AND is_read = FALSE;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_read"("p_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = TRUE
    WHERE id = p_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."mark_notification_read"("p_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."promote_students"("p_student_ids" integer[], "p_target_class_id" integer, "p_new_status" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    -- Check permissions using has_role
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    -- Update students
    UPDATE public.siswa
    SET 
        kelas_id = p_target_class_id,
        status = p_new_status,
        updated_at = NOW()
    WHERE id = ANY(p_student_ids);

END;
$$;


ALTER FUNCTION "public"."promote_students"("p_student_ids" integer[], "p_target_class_id" integer, "p_new_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_payment"("p_invoice_id" integer, "p_amount" numeric, "p_method" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_invoice_nominal decimal;
    v_already_paid decimal;
    v_new_status text;
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Check Invoice
    SELECT nominal INTO v_invoice_nominal
    FROM public.invoices
    WHERE id = p_invoice_id;

    IF v_invoice_nominal IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Invoice not found');
    END IF;

    -- Record Payment
    INSERT INTO public.payments (invoice_id, siswa_id, nominal, metode_bayar, received_by)
    SELECT p_invoice_id, siswa_id, p_amount, p_method, auth.uid()
    FROM public.invoices
    WHERE id = p_invoice_id;

    -- Calculate Totals
    SELECT COALESCE(SUM(nominal), 0) INTO v_already_paid
    FROM public.payments
    WHERE invoice_id = p_invoice_id;

    -- Update Invoice Status
    IF v_already_paid >= v_invoice_nominal THEN
        v_new_status := 'paid';
    ELSIF v_already_paid > 0 THEN
        v_new_status := 'partial';
    ELSE
        v_new_status := 'unpaid';
    END IF;

    UPDATE public.invoices
    SET status = v_new_status, updated_at = NOW()
    WHERE id = p_invoice_id;

    RETURN json_build_object(
        'success', true,
        'new_status', v_new_status,
        'total_paid', v_already_paid
    );
END;
$$;


ALTER FUNCTION "public"."record_payment"("p_invoice_id" integer, "p_amount" numeric, "p_method" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_ketua_kelas"("p_kelas_id" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_wali_kelas_id UUID;
    v_current_ketua_id UUID;
    v_ketua_role_id INTEGER;
BEGIN
    -- Get the ketua_kelas role id
    SELECT id INTO v_ketua_role_id FROM public.roles WHERE name = 'ketua_kelas';
    
    IF v_ketua_role_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Role ketua_kelas tidak ditemukan');
    END IF;

    -- Get the wali_kelas_id and current_ketua_id for this kelas
    SELECT wali_kelas_id, ketua_kelas_id 
    INTO v_wali_kelas_id, v_current_ketua_id
    FROM public.kelas 
    WHERE id = p_kelas_id;
    
    IF v_wali_kelas_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kelas tidak ditemukan');
    END IF;
    
    -- Validate that the current user is the wali kelas
    IF v_wali_kelas_id != auth.uid() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Anda bukan wali kelas untuk kelas ini');
    END IF;
    
    -- If no current ketua kelas, nothing to do
    IF v_current_ketua_id IS NULL THEN
        RETURN jsonb_build_object('success', true, 'message', 'Tidak ada ketua kelas untuk dihapus');
    END IF;
    
    -- Remove ketua_kelas role from current ketua
    DELETE FROM public.user_roles 
    WHERE user_id = v_current_ketua_id AND role_id = v_ketua_role_id;
    
    -- Update kelas.ketua_kelas_id to NULL
    UPDATE public.kelas 
    SET ketua_kelas_id = NULL, updated_at = NOW()
    WHERE id = p_kelas_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Berhasil menghapus ketua kelas');
END;
$$;


ALTER FUNCTION "public"."remove_ketua_kelas"("p_kelas_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_wali_candidates"("p_query" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN json_agg(
        json_build_object(
            'id', u.id,
            'email', u.email,
            'full_name', u.full_name,
            'phone', u.phone,
            'avatar_url', u.avatar_url,
            'is_wali', EXISTS(SELECT 1 FROM public.wali_murid wm WHERE wm.user_id = u.id)
        )
    )
    FROM public.users u
    WHERE (
        u.email ILIKE '%' || p_query || '%' OR
        u.full_name ILIKE '%' || p_query || '%'
    )
    AND u.is_active = true
    LIMIT 20;
END;
$$;


ALTER FUNCTION "public"."search_wali_candidates"("p_query" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_default_academic_year"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_active_ta_id INTEGER;
BEGIN
    IF NEW.tahun_ajaran_id IS NULL THEN
        -- Get active academic year
        SELECT id INTO v_active_ta_id
        FROM public.tahun_ajaran
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- Fallback to latest if no active
        IF v_active_ta_id IS NULL THEN
            SELECT id INTO v_active_ta_id
            FROM public.tahun_ajaran
            ORDER BY created_at DESC
            LIMIT 1;
        END IF;

        NEW.tahun_ajaran_id := v_active_ta_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_default_academic_year"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."submit_ketuakelas_attendance"("p_user_id" "uuid", "p_schedule_id" integer, "p_attendances" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_kelas_id INTEGER;
    v_schedule_kelas_id INTEGER;
    v_today DATE;
    v_attendance JSONB;
    v_saved_count INTEGER := 0;
BEGIN
    -- Verify the user is ketua kelas of their class
    SELECT s.kelas_id INTO v_kelas_id
    FROM public.siswa s
    JOIN public.kelas k ON s.kelas_id = k.id
    WHERE s.user_id = p_user_id 
      AND s.status = 'aktif'
      AND k.ketua_kelas_id = p_user_id;

    IF v_kelas_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Anda bukan ketua kelas');
    END IF;

    -- Verify the schedule belongs to this class
    SELECT kelas_id INTO v_schedule_kelas_id
    FROM public.schedules WHERE id = p_schedule_id;

    IF v_schedule_kelas_id IS NULL OR v_schedule_kelas_id != v_kelas_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Jadwal tidak valid untuk kelas ini');
    END IF;

    v_today := CURRENT_DATE;

    -- Insert/Update attendances
    -- Use 'catatan' column (correct column name in attendances table)
    FOR v_attendance IN SELECT * FROM jsonb_array_elements(p_attendances)
    LOOP
        INSERT INTO public.attendances (siswa_id, schedule_id, tanggal, status, catatan, input_by)
        VALUES (
            (v_attendance->>'siswa_id')::INTEGER,
            p_schedule_id,
            v_today,
            (v_attendance->>'status')::TEXT,
            COALESCE(v_attendance->>'keterangan', ''),
            p_user_id
        )
        ON CONFLICT (siswa_id, schedule_id, tanggal) 
        DO UPDATE SET 
            status = EXCLUDED.status,
            catatan = EXCLUDED.catatan,
            input_by = p_user_id;

        v_saved_count := v_saved_count + 1;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Berhasil menyimpan absensi',
        'saved_count', v_saved_count
    );
END;
$$;


ALTER FUNCTION "public"."submit_ketuakelas_attendance"("p_user_id" "uuid", "p_schedule_id" integer, "p_attendances" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_recent_notifications"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    r RECORD;
    v_parent_ids UUID[];
    v_parent_id UUID;
    v_mapel TEXT;
    v_jam TEXT;
    v_inputter TEXT;
    v_title TEXT;
    v_message TEXT;
    v_type TEXT;
BEGIN
    -- 1. Sync Unpaid Invoices (Existing logic preserved)
    FOR r IN 
        SELECT i.id, i.siswa_id, i.nominal, u.full_name as student_name
        FROM public.invoices i
        JOIN public.siswa s ON i.siswa_id = s.id
        JOIN public.users u ON s.user_id = u.id
        WHERE i.status = 'unpaid'
    LOOP
        SELECT array_agg(wm.user_id) INTO v_parent_ids
        FROM public.siswa_wali sw
        JOIN public.wali_murid wm ON sw.wali_id = wm.id
        WHERE sw.siswa_id = r.siswa_id;

        IF v_parent_ids IS NOT NULL THEN
            FOREACH v_parent_id IN ARRAY v_parent_ids
            LOOP
                IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE reference_id = r.id::text AND user_id = v_parent_id AND category = 'billing') THEN
                    INSERT INTO public.notifications (user_id, title, message, type, category, reference_id)
                    VALUES (
                        v_parent_id, 
                        'Tagihan Belum Lunas', 
                        'Mengingatkan tagihan sebesar Rp ' || TO_CHAR(r.nominal, 'FM999,999,999') || ' untuk ' || r.student_name || ' belum lunas.',
                        'danger', 
                        'billing', 
                        r.id::text
                    );
                END IF;
            END LOOP;
        END IF;
    END LOOP;

    -- 2. Sync Recent Absences (Enhanced Logic)
    FOR r IN 
        SELECT 
            a.id, a.siswa_id, a.status, a.tanggal, a.schedule_id, a.input_by,
            u.full_name as student_name
        FROM public.attendances a
        JOIN public.siswa s ON a.siswa_id = s.id
        JOIN public.users u ON s.user_id = u.id
        WHERE a.tanggal >= (CURRENT_DATE - INTERVAL '7 days') 
        AND a.status IN ('alpha', 'sakit', 'izin')
    LOOP
        -- Get detailed info
        SELECT 
            mp.nama,
            to_char(sch.jam_mulai, 'HH24:MI') || ' - ' || to_char(sch.jam_selesai, 'HH24:MI'),
            COALESCE(u_in.full_name, 'Sistem')
        INTO 
            v_mapel,
            v_jam,
            v_inputter
        FROM public.schedules sch
        JOIN public.mata_pelajaran mp ON sch.mata_pelajaran_id = mp.id
        LEFT JOIN public.users u_in ON u_in.id = r.input_by
        WHERE sch.id = r.schedule_id;

        -- Fallbacks
        v_mapel := COALESCE(v_mapel, 'Pelajaran');
        v_jam := COALESCE(v_jam, '-');
        v_inputter := COALESCE(v_inputter, 'Sistem');

        -- Get Parents
        SELECT array_agg(wm.user_id) INTO v_parent_ids
        FROM public.siswa_wali sw
        JOIN public.wali_murid wm ON sw.wali_id = wm.id
        WHERE sw.siswa_id = r.siswa_id;

        -- Construct Message
        IF r.status = 'alpha' THEN
            v_title := 'Ketidakhadiran: Alpha';
            v_message := 'Perhatian: ' || r.student_name || ' tercatat Alpha pada ' || v_mapel || ' (' || v_jam || '). Diinput oleh: ' || v_inputter || '.';
            v_type := 'danger';
        ELSIF r.status = 'sakit' THEN
            v_title := 'Ketidakhadiran: Sakit';
            v_message := r.student_name || ' tercatat Sakit pada ' || v_mapel || ' (' || v_jam || '). Diinput oleh: ' || v_inputter || '.';
            v_type := 'warning';
        ELSIF r.status = 'izin' THEN
            v_title := 'Ketidakhadiran: Izin';
            v_message := r.student_name || ' tercatat Izin pada ' || v_mapel || ' (' || v_jam || '). Diinput oleh: ' || v_inputter || '.';
            v_type := 'info';
        END IF;

        IF v_parent_ids IS NOT NULL THEN
             FOREACH v_parent_id IN ARRAY v_parent_ids
            LOOP
                -- Insert if not exists (checking reference_id alone might skip if message chaged, so we delete first in step 2 below)
                IF NOT EXISTS (SELECT 1 FROM public.notifications WHERE reference_id = r.id::text AND user_id = v_parent_id) THEN
                    INSERT INTO public.notifications (user_id, title, message, type, category, reference_id)
                    VALUES (v_parent_id, v_title, v_message, v_type, 'attendance', r.id::text);
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."sync_recent_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_user_roles_to_metadata"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    _user_id uuid;
    _roles text[];
    _primary_role text;
BEGIN
    -- Determine user_id based on operation
    IF (TG_OP = 'DELETE') THEN
        _user_id := OLD.user_id;
    ELSE
        _user_id := NEW.user_id;
    END IF;

    -- Fetch all roles for this user
    SELECT array_agg(r.name) INTO _roles
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id;

    -- Determine primary role (first one or null)
    _primary_role := _roles[1];

    -- Update auth.users metadata
    -- We use jsonb_set to selectively update fields without overwriting everything
    UPDATE auth.users
    SET raw_user_meta_data = 
        jsonb_set(
            jsonb_set(
                COALESCE(raw_user_meta_data, '{}'::jsonb),
                '{roles}',
                to_jsonb(COALESCE(_roles, ARRAY[]::text[]))
            ),
            '{primaryRole}',
            to_jsonb(COALESCE(_primary_role, 'no_role'))
        )
    WHERE id = _user_id;

    RETURN NULL; -- For AFTER trigger
END;
$$;


ALTER FUNCTION "public"."sync_user_roles_to_metadata"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_class"("p_id" integer, "p_nama" "text", "p_tingkat" integer, "p_wali_kelas_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    UPDATE public.kelas
    SET nama = p_nama, tingkat = p_tingkat, wali_kelas_id = p_wali_kelas_id, updated_at = NOW()
    WHERE id = p_id;

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."update_class"("p_id" integer, "p_nama" "text", "p_tingkat" integer, "p_wali_kelas_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_expense"("p_id" integer, "p_category_id" integer, "p_description" "text", "p_amount" numeric, "p_transaction_date" "date", "p_pic" character varying, "p_status" character varying, "p_proof_url" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE public.expenses
    SET 
        category_id = p_category_id,
        description = p_description,
        amount = p_amount,
        transaction_date = p_transaction_date,
        pic = p_pic,
        status = p_status,
        proof_url = p_proof_url
    WHERE id = p_id;

    IF FOUND THEN
        RETURN jsonb_build_object('success', true);
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Expense not found');
    END IF;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;


ALTER FUNCTION "public"."update_expense"("p_id" integer, "p_category_id" integer, "p_description" "text", "p_amount" numeric, "p_transaction_date" "date", "p_pic" character varying, "p_status" character varying, "p_proof_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_guru_profile"("p_phone" character varying, "p_alamat" "text", "p_pendidikan_terakhir" character varying, "p_sertifikasi" "text"[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();

    -- Update users table
    UPDATE public.users
    SET 
        phone = COALESCE(p_phone, phone),
        alamat = COALESCE(p_alamat, alamat),
        updated_at = NOW()
    WHERE id = v_user_id;

    -- Update guru table
    UPDATE public.guru
    SET 
        pendidikan_terakhir = COALESCE(p_pendidikan_terakhir, pendidikan_terakhir),
        sertifikasi = COALESCE(p_sertifikasi, sertifikasi),
        updated_at = NOW()
    WHERE user_id = v_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Profile updated successfully'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$;


ALTER FUNCTION "public"."update_guru_profile"("p_phone" character varying, "p_alamat" "text", "p_pendidikan_terakhir" character varying, "p_sertifikasi" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_payment_type"("p_id" integer, "p_nama" "text", "p_nominal_default" numeric, "p_is_recurring" boolean) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    UPDATE public.payment_types
    SET 
        nama = p_nama,
        nominal_default = p_nominal_default,
        is_recurring = p_is_recurring
    WHERE id = p_id;

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."update_payment_type"("p_id" integer, "p_nama" "text", "p_nominal_default" numeric, "p_is_recurring" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_payment_type"("p_id" integer, "p_nama" character varying, "p_nominal_default" numeric, "p_is_recurring" boolean, "p_description" character varying DEFAULT NULL::character varying, "p_is_active" boolean DEFAULT true) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Check permissions (Admin and TU)
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    UPDATE public.payment_types
    SET 
        nama = p_nama,
        nominal_default = p_nominal_default,
        is_recurring = p_is_recurring,
        description = p_description,
        is_active = p_is_active,
        updated_at = NOW()
    WHERE id = p_id;

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."update_payment_type"("p_id" integer, "p_nama" character varying, "p_nominal_default" numeric, "p_is_recurring" boolean, "p_description" character varying, "p_is_active" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_payment_type"("p_id" integer, "p_nama" character varying, "p_nominal_default" numeric, "p_is_recurring" boolean, "p_description" character varying DEFAULT NULL::character varying, "p_is_active" boolean DEFAULT true, "p_billing_cycle" character varying DEFAULT 'Bulanan'::character varying) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Check permissions (Admin and TU)
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    UPDATE public.payment_types
    SET 
        nama = p_nama,
        nominal_default = p_nominal_default,
        is_recurring = p_is_recurring,
        billing_cycle = p_billing_cycle,
        description = p_description,
        is_active = p_is_active,
        updated_at = NOW()
    WHERE id = p_id;

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."update_payment_type"("p_id" integer, "p_nama" character varying, "p_nominal_default" numeric, "p_is_recurring" boolean, "p_description" character varying, "p_is_active" boolean, "p_billing_cycle" character varying) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_school_info"("p_name" "text", "p_address" "text", "p_phone" "text", "p_email" "text", "p_website" "text", "p_logo_url" "text") RETURNS "public"."school_info"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result public.school_info;
BEGIN
    -- Check permissions (though RLS handles it, good for explicit RPC security)
    IF NOT public.has_role('admin') THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    IF (SELECT COUNT(*) FROM public.school_info) > 0 THEN
        UPDATE public.school_info
        SET
            name = p_name,
            address = p_address,
            phone = p_phone,
            email = p_email,
            website = p_website,
            logo_url = p_logo_url,
            updated_at = NOW()
        WHERE id = (SELECT id FROM public.school_info LIMIT 1)
        RETURNING * INTO result;
    ELSE
        INSERT INTO public.school_info (name, address, phone, email, website, logo_url)
        VALUES (p_name, p_address, p_phone, p_email, p_website, p_logo_url)
        RETURNING * INTO result;
    END IF;

    RETURN result;
END;
$$;


ALTER FUNCTION "public"."update_school_info"("p_name" "text", "p_address" "text", "p_phone" "text", "p_email" "text", "p_website" "text", "p_logo_url" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_student_status"("p_student_id" integer, "p_status" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    UPDATE public.siswa
    SET status = p_status, updated_at = NOW()
    WHERE id = p_student_id;

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."update_student_status"("p_student_id" integer, "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."void_invoice"("p_id" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_status text;
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    SELECT status INTO v_status FROM public.invoices WHERE id = p_id;

    IF v_status = 'paid' OR v_status = 'partial' THEN
        RETURN json_build_object('success', false, 'message', 'Cannot void paid/partial invoice. Void payments first.');
    END IF;

    -- Soft delete or set to 'void'? 
    -- If 'void' status doesn't exist in check constraint, we might need to alter table or just delete if no payments exist.
    -- Constraint check: status IN ('unpaid', 'paid', 'partial') usually.
    -- Let's assume we can DELETE it if it's unpaid. Safest for now.
    
    DELETE FROM public.invoices WHERE id = p_id; 

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."void_invoice"("p_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."void_payment"("p_payment_id" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_invoice_id int;
    v_nominal decimal;
BEGIN
    IF NOT public.has_role('admin') AND NOT public.has_role('tu') THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Get Invoice ID and Amount from Payment
    SELECT invoice_id, nominal INTO v_invoice_id, v_nominal
    FROM public.payments
    WHERE id = p_payment_id;

    IF v_invoice_id IS NULL THEN
        RETURN json_build_object('success', false, 'message', 'Payment not found');
    END IF;

    -- Delete Payment
    DELETE FROM public.payments WHERE id = p_payment_id;

    -- Re-calculate Invoice Status
    -- We can trigger an update on invoice status based on remaining payments
    DECLARE
        v_remaining_paid decimal;
        v_invoice_total decimal;
        v_new_status text;
    BEGIN
        SELECT nominal INTO v_invoice_total FROM public.invoices WHERE id = v_invoice_id;
        
        SELECT COALESCE(SUM(nominal), 0) INTO v_remaining_paid
        FROM public.payments
        WHERE invoice_id = v_invoice_id;

        IF v_remaining_paid >= v_invoice_total THEN
            v_new_status := 'paid';
        ELSIF v_remaining_paid > 0 THEN
            v_new_status := 'partial';
        ELSE
            v_new_status := 'unpaid';
        END IF;

        UPDATE public.invoices
        SET status = v_new_status, updated_at = NOW()
        WHERE id = v_invoice_id;
    END;

    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."void_payment"("p_payment_id" integer) OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "auth"."audit_log_entries" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "payload" json,
    "created_at" timestamp with time zone,
    "ip_address" character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE "auth"."audit_log_entries" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."audit_log_entries" IS 'Auth: Audit trail for user actions.';



CREATE TABLE IF NOT EXISTS "auth"."flow_state" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid",
    "auth_code" "text",
    "code_challenge_method" "auth"."code_challenge_method",
    "code_challenge" "text",
    "provider_type" "text" NOT NULL,
    "provider_access_token" "text",
    "provider_refresh_token" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "authentication_method" "text" NOT NULL,
    "auth_code_issued_at" timestamp with time zone,
    "invite_token" "text",
    "referrer" "text",
    "oauth_client_state_id" "uuid",
    "linking_target_id" "uuid",
    "email_optional" boolean DEFAULT false NOT NULL
);


ALTER TABLE "auth"."flow_state" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."flow_state" IS 'Stores metadata for all OAuth/SSO login flows';



CREATE TABLE IF NOT EXISTS "auth"."identities" (
    "provider_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "identity_data" "jsonb" NOT NULL,
    "provider" "text" NOT NULL,
    "last_sign_in_at" timestamp with time zone,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "email" "text" GENERATED ALWAYS AS ("lower"(("identity_data" ->> 'email'::"text"))) STORED,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL
);


ALTER TABLE "auth"."identities" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."identities" IS 'Auth: Stores identities associated to a user.';



COMMENT ON COLUMN "auth"."identities"."email" IS 'Auth: Email is a generated column that references the optional email property in the identity_data';



CREATE TABLE IF NOT EXISTS "auth"."instances" (
    "id" "uuid" NOT NULL,
    "uuid" "uuid",
    "raw_base_config" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone
);


ALTER TABLE "auth"."instances" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."instances" IS 'Auth: Manages users across multiple sites.';



CREATE TABLE IF NOT EXISTS "auth"."mfa_amr_claims" (
    "session_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "authentication_method" "text" NOT NULL,
    "id" "uuid" NOT NULL
);


ALTER TABLE "auth"."mfa_amr_claims" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_amr_claims" IS 'auth: stores authenticator method reference claims for multi factor authentication';



CREATE TABLE IF NOT EXISTS "auth"."mfa_challenges" (
    "id" "uuid" NOT NULL,
    "factor_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "verified_at" timestamp with time zone,
    "ip_address" "inet" NOT NULL,
    "otp_code" "text",
    "web_authn_session_data" "jsonb"
);


ALTER TABLE "auth"."mfa_challenges" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_challenges" IS 'auth: stores metadata about challenge requests made';



CREATE TABLE IF NOT EXISTS "auth"."mfa_factors" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friendly_name" "text",
    "factor_type" "auth"."factor_type" NOT NULL,
    "status" "auth"."factor_status" NOT NULL,
    "created_at" timestamp with time zone NOT NULL,
    "updated_at" timestamp with time zone NOT NULL,
    "secret" "text",
    "phone" "text",
    "last_challenged_at" timestamp with time zone,
    "web_authn_credential" "jsonb",
    "web_authn_aaguid" "uuid",
    "last_webauthn_challenge_data" "jsonb"
);


ALTER TABLE "auth"."mfa_factors" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."mfa_factors" IS 'auth: stores metadata about factors';



COMMENT ON COLUMN "auth"."mfa_factors"."last_webauthn_challenge_data" IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';



CREATE TABLE IF NOT EXISTS "auth"."oauth_authorizations" (
    "id" "uuid" NOT NULL,
    "authorization_id" "text" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "redirect_uri" "text" NOT NULL,
    "scope" "text" NOT NULL,
    "state" "text",
    "resource" "text",
    "code_challenge" "text",
    "code_challenge_method" "auth"."code_challenge_method",
    "response_type" "auth"."oauth_response_type" DEFAULT 'code'::"auth"."oauth_response_type" NOT NULL,
    "status" "auth"."oauth_authorization_status" DEFAULT 'pending'::"auth"."oauth_authorization_status" NOT NULL,
    "authorization_code" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone DEFAULT ("now"() + '00:03:00'::interval) NOT NULL,
    "approved_at" timestamp with time zone,
    "nonce" "text",
    CONSTRAINT "oauth_authorizations_authorization_code_length" CHECK (("char_length"("authorization_code") <= 255)),
    CONSTRAINT "oauth_authorizations_code_challenge_length" CHECK (("char_length"("code_challenge") <= 128)),
    CONSTRAINT "oauth_authorizations_expires_at_future" CHECK (("expires_at" > "created_at")),
    CONSTRAINT "oauth_authorizations_nonce_length" CHECK (("char_length"("nonce") <= 255)),
    CONSTRAINT "oauth_authorizations_redirect_uri_length" CHECK (("char_length"("redirect_uri") <= 2048)),
    CONSTRAINT "oauth_authorizations_resource_length" CHECK (("char_length"("resource") <= 2048)),
    CONSTRAINT "oauth_authorizations_scope_length" CHECK (("char_length"("scope") <= 4096)),
    CONSTRAINT "oauth_authorizations_state_length" CHECK (("char_length"("state") <= 4096))
);


ALTER TABLE "auth"."oauth_authorizations" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."oauth_client_states" (
    "id" "uuid" NOT NULL,
    "provider_type" "text" NOT NULL,
    "code_verifier" "text",
    "created_at" timestamp with time zone NOT NULL
);


ALTER TABLE "auth"."oauth_client_states" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."oauth_client_states" IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';



CREATE TABLE IF NOT EXISTS "auth"."oauth_clients" (
    "id" "uuid" NOT NULL,
    "client_secret_hash" "text",
    "registration_type" "auth"."oauth_registration_type" NOT NULL,
    "redirect_uris" "text" NOT NULL,
    "grant_types" "text" NOT NULL,
    "client_name" "text",
    "client_uri" "text",
    "logo_uri" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "client_type" "auth"."oauth_client_type" DEFAULT 'confidential'::"auth"."oauth_client_type" NOT NULL,
    "token_endpoint_auth_method" "text" NOT NULL,
    CONSTRAINT "oauth_clients_client_name_length" CHECK (("char_length"("client_name") <= 1024)),
    CONSTRAINT "oauth_clients_client_uri_length" CHECK (("char_length"("client_uri") <= 2048)),
    CONSTRAINT "oauth_clients_logo_uri_length" CHECK (("char_length"("logo_uri") <= 2048)),
    CONSTRAINT "oauth_clients_token_endpoint_auth_method_check" CHECK (("token_endpoint_auth_method" = ANY (ARRAY['client_secret_basic'::"text", 'client_secret_post'::"text", 'none'::"text"])))
);


ALTER TABLE "auth"."oauth_clients" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."oauth_consents" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "scopes" "text" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "revoked_at" timestamp with time zone,
    CONSTRAINT "oauth_consents_revoked_after_granted" CHECK ((("revoked_at" IS NULL) OR ("revoked_at" >= "granted_at"))),
    CONSTRAINT "oauth_consents_scopes_length" CHECK (("char_length"("scopes") <= 2048)),
    CONSTRAINT "oauth_consents_scopes_not_empty" CHECK (("char_length"(TRIM(BOTH FROM "scopes")) > 0))
);


ALTER TABLE "auth"."oauth_consents" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."one_time_tokens" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_type" "auth"."one_time_token_type" NOT NULL,
    "token_hash" "text" NOT NULL,
    "relates_to" "text" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp without time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "one_time_tokens_token_hash_check" CHECK (("char_length"("token_hash") > 0))
);


ALTER TABLE "auth"."one_time_tokens" OWNER TO "supabase_auth_admin";


CREATE TABLE IF NOT EXISTS "auth"."refresh_tokens" (
    "instance_id" "uuid",
    "id" bigint NOT NULL,
    "token" character varying(255),
    "user_id" character varying(255),
    "revoked" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "parent" character varying(255),
    "session_id" "uuid"
);


ALTER TABLE "auth"."refresh_tokens" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."refresh_tokens" IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';



CREATE SEQUENCE IF NOT EXISTS "auth"."refresh_tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "auth"."refresh_tokens_id_seq" OWNER TO "supabase_auth_admin";


ALTER SEQUENCE "auth"."refresh_tokens_id_seq" OWNED BY "auth"."refresh_tokens"."id";



CREATE TABLE IF NOT EXISTS "auth"."saml_providers" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "entity_id" "text" NOT NULL,
    "metadata_xml" "text" NOT NULL,
    "metadata_url" "text",
    "attribute_mapping" "jsonb",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "name_id_format" "text",
    CONSTRAINT "entity_id not empty" CHECK (("char_length"("entity_id") > 0)),
    CONSTRAINT "metadata_url not empty" CHECK ((("metadata_url" = NULL::"text") OR ("char_length"("metadata_url") > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK (("char_length"("metadata_xml") > 0))
);


ALTER TABLE "auth"."saml_providers" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."saml_providers" IS 'Auth: Manages SAML Identity Provider connections.';



CREATE TABLE IF NOT EXISTS "auth"."saml_relay_states" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "request_id" "text" NOT NULL,
    "for_email" "text",
    "redirect_to" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "flow_state_id" "uuid",
    CONSTRAINT "request_id not empty" CHECK (("char_length"("request_id") > 0))
);


ALTER TABLE "auth"."saml_relay_states" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."saml_relay_states" IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';



CREATE TABLE IF NOT EXISTS "auth"."schema_migrations" (
    "version" character varying(255) NOT NULL
);


ALTER TABLE "auth"."schema_migrations" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."schema_migrations" IS 'Auth: Manages updates to the auth system.';



CREATE TABLE IF NOT EXISTS "auth"."sessions" (
    "id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "factor_id" "uuid",
    "aal" "auth"."aal_level",
    "not_after" timestamp with time zone,
    "refreshed_at" timestamp without time zone,
    "user_agent" "text",
    "ip" "inet",
    "tag" "text",
    "oauth_client_id" "uuid",
    "refresh_token_hmac_key" "text",
    "refresh_token_counter" bigint,
    "scopes" "text",
    CONSTRAINT "sessions_scopes_length" CHECK (("char_length"("scopes") <= 4096))
);


ALTER TABLE "auth"."sessions" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sessions" IS 'Auth: Stores session data associated to a user.';



COMMENT ON COLUMN "auth"."sessions"."not_after" IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';



COMMENT ON COLUMN "auth"."sessions"."refresh_token_hmac_key" IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';



COMMENT ON COLUMN "auth"."sessions"."refresh_token_counter" IS 'Holds the ID (counter) of the last issued refresh token.';



CREATE TABLE IF NOT EXISTS "auth"."sso_domains" (
    "id" "uuid" NOT NULL,
    "sso_provider_id" "uuid" NOT NULL,
    "domain" "text" NOT NULL,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK (("char_length"("domain") > 0))
);


ALTER TABLE "auth"."sso_domains" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sso_domains" IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';



CREATE TABLE IF NOT EXISTS "auth"."sso_providers" (
    "id" "uuid" NOT NULL,
    "resource_id" "text",
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "disabled" boolean,
    CONSTRAINT "resource_id not empty" CHECK ((("resource_id" = NULL::"text") OR ("char_length"("resource_id") > 0)))
);


ALTER TABLE "auth"."sso_providers" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."sso_providers" IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';



COMMENT ON COLUMN "auth"."sso_providers"."resource_id" IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';



CREATE TABLE IF NOT EXISTS "auth"."users" (
    "instance_id" "uuid",
    "id" "uuid" NOT NULL,
    "aud" character varying(255),
    "role" character varying(255),
    "email" character varying(255),
    "encrypted_password" character varying(255),
    "email_confirmed_at" timestamp with time zone,
    "invited_at" timestamp with time zone,
    "confirmation_token" character varying(255),
    "confirmation_sent_at" timestamp with time zone,
    "recovery_token" character varying(255),
    "recovery_sent_at" timestamp with time zone,
    "email_change_token_new" character varying(255),
    "email_change" character varying(255),
    "email_change_sent_at" timestamp with time zone,
    "last_sign_in_at" timestamp with time zone,
    "raw_app_meta_data" "jsonb",
    "raw_user_meta_data" "jsonb",
    "is_super_admin" boolean,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "phone" "text" DEFAULT NULL::character varying,
    "phone_confirmed_at" timestamp with time zone,
    "phone_change" "text" DEFAULT ''::character varying,
    "phone_change_token" character varying(255) DEFAULT ''::character varying,
    "phone_change_sent_at" timestamp with time zone,
    "confirmed_at" timestamp with time zone GENERATED ALWAYS AS (LEAST("email_confirmed_at", "phone_confirmed_at")) STORED,
    "email_change_token_current" character varying(255) DEFAULT ''::character varying,
    "email_change_confirm_status" smallint DEFAULT 0,
    "banned_until" timestamp with time zone,
    "reauthentication_token" character varying(255) DEFAULT ''::character varying,
    "reauthentication_sent_at" timestamp with time zone,
    "is_sso_user" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "is_anonymous" boolean DEFAULT false NOT NULL,
    CONSTRAINT "users_email_change_confirm_status_check" CHECK ((("email_change_confirm_status" >= 0) AND ("email_change_confirm_status" <= 2)))
);


ALTER TABLE "auth"."users" OWNER TO "supabase_auth_admin";


COMMENT ON TABLE "auth"."users" IS 'Auth: Stores user login data within a secure schema.';



COMMENT ON COLUMN "auth"."users"."is_sso_user" IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';



CREATE TABLE IF NOT EXISTS "public"."attendances" (
    "id" integer NOT NULL,
    "siswa_id" integer,
    "schedule_id" integer,
    "tanggal" "date" NOT NULL,
    "status" character varying(10),
    "waktu_hadir" timestamp with time zone,
    "catatan" "text",
    "input_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "attendances_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['hadir'::character varying, 'izin'::character varying, 'sakit'::character varying, 'alpha'::character varying])::"text"[])))
);


ALTER TABLE "public"."attendances" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."attendances_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."attendances_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."attendances_id_seq" OWNED BY "public"."attendances"."id";



CREATE TABLE IF NOT EXISTS "public"."expense_categories" (
    "id" integer NOT NULL,
    "name" character varying(255) NOT NULL,
    "budget_limit" numeric(15,2) DEFAULT 0,
    "color" character varying(50) DEFAULT 'bg-gray-500'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."expense_categories" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."expense_categories_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."expense_categories_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."expense_categories_id_seq" OWNED BY "public"."expense_categories"."id";



CREATE TABLE IF NOT EXISTS "public"."expenses" (
    "id" integer NOT NULL,
    "kategori" character varying(100),
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "category_id" integer,
    "description" "text" NOT NULL,
    "amount" numeric(15,2) DEFAULT 0 NOT NULL,
    "transaction_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "pic" character varying(255),
    "proof_url" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."expenses" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."expenses_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."expenses_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."expenses_id_seq" OWNED BY "public"."expenses"."id";



CREATE TABLE IF NOT EXISTS "public"."guru" (
    "id" integer NOT NULL,
    "user_id" "uuid",
    "nip" character varying(30),
    "bidang_studi" character varying(100),
    "status" character varying(20) DEFAULT 'aktif'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "pendidikan_terakhir" character varying(255),
    "sertifikasi" "text"[]
);


ALTER TABLE "public"."guru" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."guru_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."guru_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."guru_id_seq" OWNED BY "public"."guru"."id";



CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" integer NOT NULL,
    "siswa_id" integer,
    "payment_type_id" integer,
    "bulan" integer,
    "tahun" integer,
    "nominal" numeric(12,2) NOT NULL,
    "status" character varying(20) DEFAULT 'unpaid'::character varying,
    "jatuh_tempo" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deskripsi" "text"
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."invoices_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."invoices_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."invoices_id_seq" OWNED BY "public"."invoices"."id";



CREATE TABLE IF NOT EXISTS "public"."jam_pelajaran" (
    "id" integer NOT NULL,
    "urutan" integer NOT NULL,
    "waktu_mulai" time without time zone NOT NULL,
    "waktu_selesai" time without time zone NOT NULL,
    "keterangan" character varying(100),
    "is_istirahat" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "day_set" character varying(20) DEFAULT 'senin_kamis'::character varying,
    CONSTRAINT "jam_pelajaran_day_set_check" CHECK ((("day_set")::"text" = ANY ((ARRAY['senin_kamis'::character varying, 'jumat'::character varying])::"text"[])))
);


ALTER TABLE "public"."jam_pelajaran" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."jam_pelajaran_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."jam_pelajaran_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."jam_pelajaran_id_seq" OWNED BY "public"."jam_pelajaran"."id";



CREATE TABLE IF NOT EXISTS "public"."jurusan" (
    "id" integer NOT NULL,
    "nama" character varying(100) NOT NULL,
    "kode" character varying(20) NOT NULL,
    "deskripsi" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."jurusan" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."jurusan_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."jurusan_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."jurusan_id_seq" OWNED BY "public"."jurusan"."id";



CREATE TABLE IF NOT EXISTS "public"."kelas" (
    "id" integer NOT NULL,
    "nama" character varying(50) NOT NULL,
    "tingkat" integer,
    "tahun_ajaran_id" integer,
    "wali_kelas_id" "uuid",
    "kapasitas" integer DEFAULT 40,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "jurusan_id" integer,
    "ketua_kelas_id" "uuid",
    CONSTRAINT "kelas_tingkat_check" CHECK ((("tingkat" >= 1) AND ("tingkat" <= 12)))
);


ALTER TABLE "public"."kelas" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."kelas_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."kelas_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."kelas_id_seq" OWNED BY "public"."kelas"."id";



CREATE TABLE IF NOT EXISTS "public"."mata_pelajaran" (
    "id" integer NOT NULL,
    "kode" character varying(20) NOT NULL,
    "nama" character varying(100) NOT NULL,
    "deskripsi" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."mata_pelajaran" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."mata_pelajaran_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."mata_pelajaran_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."mata_pelajaran_id_seq" OWNED BY "public"."mata_pelajaran"."id";



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "text" DEFAULT 'info'::"text",
    "category" "text" DEFAULT 'system'::"text",
    "reference_id" "text",
    "is_read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "notifications_category_check" CHECK (("category" = ANY (ARRAY['attendance'::"text", 'billing'::"text", 'system'::"text", 'academic'::"text"]))),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['info'::"text", 'warning'::"text", 'success'::"text", 'error'::"text", 'danger'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payment_types" (
    "id" integer NOT NULL,
    "nama" character varying(100) NOT NULL,
    "nominal_default" numeric(12,2),
    "is_recurring" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "description" "text",
    "is_active" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "billing_cycle" character varying(50) DEFAULT 'Bulanan'::character varying
);


ALTER TABLE "public"."payment_types" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."payment_types_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."payment_types_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."payment_types_id_seq" OWNED BY "public"."payment_types"."id";



CREATE TABLE IF NOT EXISTS "public"."payments" (
    "id" integer NOT NULL,
    "invoice_id" integer,
    "siswa_id" integer,
    "nominal" numeric(12,2) NOT NULL,
    "metode_bayar" character varying(50),
    "tanggal_bayar" timestamp with time zone DEFAULT "now"(),
    "received_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."payments" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."payments_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."payments_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."payments_id_seq" OWNED BY "public"."payments"."id";



CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" integer NOT NULL,
    "name" character varying(50) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."roles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."roles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."roles_id_seq" OWNED BY "public"."roles"."id";



CREATE TABLE IF NOT EXISTS "public"."schedules" (
    "id" integer NOT NULL,
    "kelas_id" integer,
    "mata_pelajaran_id" integer,
    "guru_id" integer,
    "hari" integer,
    "jam_mulai" time without time zone NOT NULL,
    "jam_selesai" time without time zone NOT NULL,
    "ruangan" character varying(50),
    "tahun_ajaran_id" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "schedules_hari_check" CHECK ((("hari" >= 1) AND ("hari" <= 7)))
);


ALTER TABLE "public"."schedules" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."schedules_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."schedules_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."schedules_id_seq" OWNED BY "public"."schedules"."id";



CREATE TABLE IF NOT EXISTS "public"."siswa" (
    "id" integer NOT NULL,
    "user_id" "uuid",
    "nis" character varying(20),
    "nisn" character varying(20),
    "kelas_id" integer,
    "tanggal_lahir" "date",
    "jenis_kelamin" character(1),
    "alamat" "text",
    "status" character varying(20) DEFAULT 'aktif'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "siswa_jenis_kelamin_check" CHECK (("jenis_kelamin" = ANY (ARRAY['L'::"bpchar", 'P'::"bpchar"])))
);


ALTER TABLE "public"."siswa" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."siswa_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."siswa_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."siswa_id_seq" OWNED BY "public"."siswa"."id";



CREATE TABLE IF NOT EXISTS "public"."siswa_wali" (
    "id" integer NOT NULL,
    "siswa_id" integer,
    "wali_id" integer,
    "is_primary" boolean DEFAULT false
);


ALTER TABLE "public"."siswa_wali" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."siswa_wali_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."siswa_wali_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."siswa_wali_id_seq" OWNED BY "public"."siswa_wali"."id";



CREATE TABLE IF NOT EXISTS "public"."tahun_ajaran" (
    "id" integer NOT NULL,
    "nama" character varying(20) NOT NULL,
    "semester" integer,
    "tanggal_mulai" "date" NOT NULL,
    "tanggal_selesai" "date" NOT NULL,
    "is_active" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "tahun_ajaran_semester_check" CHECK (("semester" = ANY (ARRAY[1, 2])))
);


ALTER TABLE "public"."tahun_ajaran" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."tahun_ajaran_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."tahun_ajaran_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."tahun_ajaran_id_seq" OWNED BY "public"."tahun_ajaran"."id";



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" integer NOT NULL,
    "user_id" "uuid",
    "role_id" integer,
    "assigned_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."user_roles_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."user_roles_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."user_roles_id_seq" OWNED BY "public"."user_roles"."id";



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL,
    "full_name" character varying(255),
    "avatar_url" "text",
    "phone" character varying(20),
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "alamat" "text"
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_admin_dashboard_summary" AS
 SELECT ( SELECT "count"(*) AS "count"
           FROM "public"."siswa"
          WHERE (("siswa"."status")::"text" = 'aktif'::"text")) AS "total_siswa",
    ( SELECT "count"(*) AS "count"
           FROM "public"."guru"
          WHERE (("guru"."status")::"text" = 'aktif'::"text")) AS "total_guru",
    ( SELECT "count"(*) AS "count"
           FROM "public"."kelas") AS "total_kelas",
    ((COALESCE(( SELECT "round"(((("count"(*) FILTER (WHERE (("attendances"."status")::"text" = 'hadir'::"text")))::numeric / (NULLIF("count"(*), 0))::numeric) * (100)::numeric), 1) AS "round"
           FROM "public"."attendances"
          WHERE ("attendances"."tanggal" = CURRENT_DATE)), (0)::numeric))::"text" || '%'::"text") AS "attendance_rate_today";


ALTER VIEW "public"."v_admin_dashboard_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_class_attendance_summary" AS
 SELECT "k"."id" AS "kelas_id",
    "k"."nama" AS "kelas_nama",
    "count"(DISTINCT "s"."id") AS "total_siswa",
    "count"(*) FILTER (WHERE (("a"."status")::"text" = 'hadir'::"text")) AS "total_hadir",
    "count"(*) FILTER (WHERE (("a"."status")::"text" = 'izin'::"text")) AS "total_izin",
    "count"(*) FILTER (WHERE (("a"."status")::"text" = 'sakit'::"text")) AS "total_sakit",
    "count"(*) FILTER (WHERE (("a"."status")::"text" = 'alpha'::"text")) AS "total_alpha"
   FROM (("public"."kelas" "k"
     LEFT JOIN "public"."siswa" "s" ON ((("s"."kelas_id" = "k"."id") AND (("s"."status")::"text" = 'aktif'::"text"))))
     LEFT JOIN "public"."attendances" "a" ON (("a"."siswa_id" = "s"."id")))
  GROUP BY "k"."id", "k"."nama"
  ORDER BY "k"."nama";


ALTER VIEW "public"."v_class_attendance_summary" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_weekly_attendance" AS
 SELECT "tanggal",
    EXTRACT(dow FROM "tanggal") AS "day_of_week",
    "count"(*) FILTER (WHERE (("status")::"text" = 'hadir'::"text")) AS "hadir",
    "count"(*) FILTER (WHERE (("status")::"text" = 'izin'::"text")) AS "izin",
    "count"(*) FILTER (WHERE (("status")::"text" = 'sakit'::"text")) AS "sakit",
    "count"(*) FILTER (WHERE (("status")::"text" = 'alpha'::"text")) AS "alpha",
    "count"(*) AS "total"
   FROM "public"."attendances"
  WHERE ("tanggal" >= (CURRENT_DATE - '7 days'::interval))
  GROUP BY "tanggal"
  ORDER BY "tanggal";


ALTER VIEW "public"."v_weekly_attendance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."wali_murid" (
    "id" integer NOT NULL,
    "user_id" "uuid",
    "pekerjaan" character varying(100),
    "hubungan" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."wali_murid" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."wali_murid_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."wali_murid_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."wali_murid_id_seq" OWNED BY "public"."wali_murid"."id";



ALTER TABLE ONLY "auth"."refresh_tokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"auth"."refresh_tokens_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."attendances" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."attendances_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."expense_categories" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."expense_categories_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."expenses" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."expenses_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."guru" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."guru_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."invoices" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."invoices_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."jam_pelajaran" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."jam_pelajaran_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."jurusan" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."jurusan_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."kelas" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."kelas_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."mata_pelajaran" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."mata_pelajaran_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."payment_types" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."payment_types_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."payments" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."payments_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."roles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."roles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."schedules" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."schedules_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."siswa" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."siswa_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."siswa_wali" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."siswa_wali_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tahun_ajaran" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tahun_ajaran_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."user_roles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_roles_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."wali_murid" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."wali_murid_id_seq"'::"regclass");



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "amr_id_pk" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."audit_log_entries"
    ADD CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."flow_state"
    ADD CONSTRAINT "flow_state_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_provider_id_provider_unique" UNIQUE ("provider_id", "provider");



ALTER TABLE ONLY "auth"."instances"
    ADD CONSTRAINT "instances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_authentication_method_pkey" UNIQUE ("session_id", "authentication_method");



ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_last_challenged_at_key" UNIQUE ("last_challenged_at");



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_authorization_code_key" UNIQUE ("authorization_code");



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_authorization_id_key" UNIQUE ("authorization_id");



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_client_states"
    ADD CONSTRAINT "oauth_client_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_clients"
    ADD CONSTRAINT "oauth_clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_user_client_unique" UNIQUE ("user_id", "client_id");



ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_token_unique" UNIQUE ("token");



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_entity_id_key" UNIQUE ("entity_id");



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."schema_migrations"
    ADD CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("version");



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."sso_providers"
    ADD CONSTRAINT "sso_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");



ALTER TABLE ONLY "auth"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_siswa_id_schedule_id_tanggal_key" UNIQUE ("siswa_id", "schedule_id", "tanggal");



ALTER TABLE ONLY "public"."expense_categories"
    ADD CONSTRAINT "expense_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."expense_categories"
    ADD CONSTRAINT "expense_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guru"
    ADD CONSTRAINT "guru_nip_key" UNIQUE ("nip");



ALTER TABLE ONLY "public"."guru"
    ADD CONSTRAINT "guru_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."guru"
    ADD CONSTRAINT "guru_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jam_pelajaran"
    ADD CONSTRAINT "jam_pelajaran_day_set_urutan_key" UNIQUE ("day_set", "urutan");



ALTER TABLE ONLY "public"."jam_pelajaran"
    ADD CONSTRAINT "jam_pelajaran_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jurusan"
    ADD CONSTRAINT "jurusan_kode_key" UNIQUE ("kode");



ALTER TABLE ONLY "public"."jurusan"
    ADD CONSTRAINT "jurusan_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kelas"
    ADD CONSTRAINT "kelas_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mata_pelajaran"
    ADD CONSTRAINT "mata_pelajaran_kode_key" UNIQUE ("kode");



ALTER TABLE ONLY "public"."mata_pelajaran"
    ADD CONSTRAINT "mata_pelajaran_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_types"
    ADD CONSTRAINT "payment_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."school_info"
    ADD CONSTRAINT "school_info_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."siswa"
    ADD CONSTRAINT "siswa_nis_key" UNIQUE ("nis");



ALTER TABLE ONLY "public"."siswa"
    ADD CONSTRAINT "siswa_nisn_key" UNIQUE ("nisn");



ALTER TABLE ONLY "public"."siswa"
    ADD CONSTRAINT "siswa_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."siswa"
    ADD CONSTRAINT "siswa_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."siswa_wali"
    ADD CONSTRAINT "siswa_wali_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."siswa_wali"
    ADD CONSTRAINT "siswa_wali_siswa_id_wali_id_key" UNIQUE ("siswa_id", "wali_id");



ALTER TABLE ONLY "public"."tahun_ajaran"
    ADD CONSTRAINT "tahun_ajaran_nama_semester_key" UNIQUE ("nama", "semester");



ALTER TABLE ONLY "public"."tahun_ajaran"
    ADD CONSTRAINT "tahun_ajaran_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "unique_attendance_per_student_per_schedule_per_day" UNIQUE ("siswa_id", "schedule_id", "tanggal");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_role_id_key" UNIQUE ("user_id", "role_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wali_murid"
    ADD CONSTRAINT "wali_murid_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wali_murid"
    ADD CONSTRAINT "wali_murid_user_id_key" UNIQUE ("user_id");



CREATE INDEX "audit_logs_instance_id_idx" ON "auth"."audit_log_entries" USING "btree" ("instance_id");



CREATE UNIQUE INDEX "confirmation_token_idx" ON "auth"."users" USING "btree" ("confirmation_token") WHERE (("confirmation_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "email_change_token_current_idx" ON "auth"."users" USING "btree" ("email_change_token_current") WHERE (("email_change_token_current")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "email_change_token_new_idx" ON "auth"."users" USING "btree" ("email_change_token_new") WHERE (("email_change_token_new")::"text" !~ '^[0-9 ]*$'::"text");



CREATE INDEX "factor_id_created_at_idx" ON "auth"."mfa_factors" USING "btree" ("user_id", "created_at");



CREATE INDEX "flow_state_created_at_idx" ON "auth"."flow_state" USING "btree" ("created_at" DESC);



CREATE INDEX "identities_email_idx" ON "auth"."identities" USING "btree" ("email" "text_pattern_ops");



COMMENT ON INDEX "auth"."identities_email_idx" IS 'Auth: Ensures indexed queries on the email column';



CREATE INDEX "identities_user_id_idx" ON "auth"."identities" USING "btree" ("user_id");



CREATE INDEX "idx_auth_code" ON "auth"."flow_state" USING "btree" ("auth_code");



CREATE INDEX "idx_oauth_client_states_created_at" ON "auth"."oauth_client_states" USING "btree" ("created_at");



CREATE INDEX "idx_user_id_auth_method" ON "auth"."flow_state" USING "btree" ("user_id", "authentication_method");



CREATE INDEX "mfa_challenge_created_at_idx" ON "auth"."mfa_challenges" USING "btree" ("created_at" DESC);



CREATE UNIQUE INDEX "mfa_factors_user_friendly_name_unique" ON "auth"."mfa_factors" USING "btree" ("friendly_name", "user_id") WHERE (TRIM(BOTH FROM "friendly_name") <> ''::"text");



CREATE INDEX "mfa_factors_user_id_idx" ON "auth"."mfa_factors" USING "btree" ("user_id");



CREATE INDEX "oauth_auth_pending_exp_idx" ON "auth"."oauth_authorizations" USING "btree" ("expires_at") WHERE ("status" = 'pending'::"auth"."oauth_authorization_status");



CREATE INDEX "oauth_clients_deleted_at_idx" ON "auth"."oauth_clients" USING "btree" ("deleted_at");



CREATE INDEX "oauth_consents_active_client_idx" ON "auth"."oauth_consents" USING "btree" ("client_id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "oauth_consents_active_user_client_idx" ON "auth"."oauth_consents" USING "btree" ("user_id", "client_id") WHERE ("revoked_at" IS NULL);



CREATE INDEX "oauth_consents_user_order_idx" ON "auth"."oauth_consents" USING "btree" ("user_id", "granted_at" DESC);



CREATE INDEX "one_time_tokens_relates_to_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("relates_to");



CREATE INDEX "one_time_tokens_token_hash_hash_idx" ON "auth"."one_time_tokens" USING "hash" ("token_hash");



CREATE UNIQUE INDEX "one_time_tokens_user_id_token_type_key" ON "auth"."one_time_tokens" USING "btree" ("user_id", "token_type");



CREATE UNIQUE INDEX "reauthentication_token_idx" ON "auth"."users" USING "btree" ("reauthentication_token") WHERE (("reauthentication_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE UNIQUE INDEX "recovery_token_idx" ON "auth"."users" USING "btree" ("recovery_token") WHERE (("recovery_token")::"text" !~ '^[0-9 ]*$'::"text");



CREATE INDEX "refresh_tokens_instance_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id");



CREATE INDEX "refresh_tokens_instance_id_user_id_idx" ON "auth"."refresh_tokens" USING "btree" ("instance_id", "user_id");



CREATE INDEX "refresh_tokens_parent_idx" ON "auth"."refresh_tokens" USING "btree" ("parent");



CREATE INDEX "refresh_tokens_session_id_revoked_idx" ON "auth"."refresh_tokens" USING "btree" ("session_id", "revoked");



CREATE INDEX "refresh_tokens_updated_at_idx" ON "auth"."refresh_tokens" USING "btree" ("updated_at" DESC);



CREATE INDEX "saml_providers_sso_provider_id_idx" ON "auth"."saml_providers" USING "btree" ("sso_provider_id");



CREATE INDEX "saml_relay_states_created_at_idx" ON "auth"."saml_relay_states" USING "btree" ("created_at" DESC);



CREATE INDEX "saml_relay_states_for_email_idx" ON "auth"."saml_relay_states" USING "btree" ("for_email");



CREATE INDEX "saml_relay_states_sso_provider_id_idx" ON "auth"."saml_relay_states" USING "btree" ("sso_provider_id");



CREATE INDEX "sessions_not_after_idx" ON "auth"."sessions" USING "btree" ("not_after" DESC);



CREATE INDEX "sessions_oauth_client_id_idx" ON "auth"."sessions" USING "btree" ("oauth_client_id");



CREATE INDEX "sessions_user_id_idx" ON "auth"."sessions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "sso_domains_domain_idx" ON "auth"."sso_domains" USING "btree" ("lower"("domain"));



CREATE INDEX "sso_domains_sso_provider_id_idx" ON "auth"."sso_domains" USING "btree" ("sso_provider_id");



CREATE UNIQUE INDEX "sso_providers_resource_id_idx" ON "auth"."sso_providers" USING "btree" ("lower"("resource_id"));



CREATE INDEX "sso_providers_resource_id_pattern_idx" ON "auth"."sso_providers" USING "btree" ("resource_id" "text_pattern_ops");



CREATE UNIQUE INDEX "unique_phone_factor_per_user" ON "auth"."mfa_factors" USING "btree" ("user_id", "phone");



CREATE INDEX "user_id_created_at_idx" ON "auth"."sessions" USING "btree" ("user_id", "created_at");



CREATE UNIQUE INDEX "users_email_partial_key" ON "auth"."users" USING "btree" ("email") WHERE ("is_sso_user" = false);



COMMENT ON INDEX "auth"."users_email_partial_key" IS 'Auth: A partial unique index that applies only when is_sso_user is false';



CREATE INDEX "users_instance_id_email_idx" ON "auth"."users" USING "btree" ("instance_id", "lower"(("email")::"text"));



CREATE INDEX "users_instance_id_idx" ON "auth"."users" USING "btree" ("instance_id");



CREATE INDEX "users_is_anonymous_idx" ON "auth"."users" USING "btree" ("is_anonymous");



CREATE INDEX "idx_expenses_category_id" ON "public"."expenses" USING "btree" ("category_id");



CREATE INDEX "idx_expenses_transaction_date" ON "public"."expenses" USING "btree" ("transaction_date");



CREATE INDEX "idx_invoices_due_date" ON "public"."invoices" USING "btree" ("jatuh_tempo");



CREATE INDEX "idx_invoices_payment_type_id" ON "public"."invoices" USING "btree" ("payment_type_id");



CREATE INDEX "idx_invoices_siswa_id" ON "public"."invoices" USING "btree" ("siswa_id");



CREATE INDEX "idx_invoices_status" ON "public"."invoices" USING "btree" ("status");



CREATE INDEX "idx_payments_invoice_id" ON "public"."payments" USING "btree" ("invoice_id");



CREATE INDEX "idx_payments_method" ON "public"."payments" USING "btree" ("metode_bayar");



CREATE INDEX "idx_payments_siswa_id" ON "public"."payments" USING "btree" ("siswa_id");



CREATE INDEX "idx_payments_tanggal_bayar" ON "public"."payments" USING "btree" ("tanggal_bayar");



CREATE INDEX "idx_siswa_kelas_id" ON "public"."siswa" USING "btree" ("kelas_id");



CREATE INDEX "idx_siswa_user_id" ON "public"."siswa" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "on_auth_user_created" AFTER INSERT ON "auth"."users" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();



CREATE OR REPLACE TRIGGER "on_attendance_change" AFTER INSERT OR UPDATE OF "status" ON "public"."attendances" FOR EACH ROW EXECUTE FUNCTION "public"."handle_attendance_notification"();



CREATE OR REPLACE TRIGGER "on_invoice_created" AFTER INSERT ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."handle_invoice_notification"();



CREATE OR REPLACE TRIGGER "on_user_role_change" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_roles" FOR EACH ROW EXECUTE FUNCTION "public"."sync_user_roles_to_metadata"();



CREATE OR REPLACE TRIGGER "set_academic_year_trigger" BEFORE INSERT ON "public"."schedules" FOR EACH ROW EXECUTE FUNCTION "public"."set_default_academic_year"();



CREATE OR REPLACE TRIGGER "update_expenses_updated_at" BEFORE UPDATE ON "public"."expenses" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_kelas_modtime" BEFORE UPDATE ON "public"."kelas" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_modtime" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "auth"."identities"
    ADD CONSTRAINT "identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_amr_claims"
    ADD CONSTRAINT "mfa_amr_claims_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_challenges"
    ADD CONSTRAINT "mfa_challenges_auth_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "auth"."mfa_factors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."mfa_factors"
    ADD CONSTRAINT "mfa_factors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_authorizations"
    ADD CONSTRAINT "oauth_authorizations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."oauth_consents"
    ADD CONSTRAINT "oauth_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."one_time_tokens"
    ADD CONSTRAINT "one_time_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "auth"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_providers"
    ADD CONSTRAINT "saml_providers_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_flow_state_id_fkey" FOREIGN KEY ("flow_state_id") REFERENCES "auth"."flow_state"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."saml_relay_states"
    ADD CONSTRAINT "saml_relay_states_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_oauth_client_id_fkey" FOREIGN KEY ("oauth_client_id") REFERENCES "auth"."oauth_clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "auth"."sso_domains"
    ADD CONSTRAINT "sso_domains_sso_provider_id_fkey" FOREIGN KEY ("sso_provider_id") REFERENCES "auth"."sso_providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_input_by_fkey" FOREIGN KEY ("input_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id");



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "public"."siswa"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."expenses"
    ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."guru"
    ADD CONSTRAINT "guru_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_payment_type_id_fkey" FOREIGN KEY ("payment_type_id") REFERENCES "public"."payment_types"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "public"."siswa"("id");



ALTER TABLE ONLY "public"."kelas"
    ADD CONSTRAINT "kelas_jurusan_id_fkey" FOREIGN KEY ("jurusan_id") REFERENCES "public"."jurusan"("id");



ALTER TABLE ONLY "public"."kelas"
    ADD CONSTRAINT "kelas_ketua_kelas_id_fkey" FOREIGN KEY ("ketua_kelas_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."kelas"
    ADD CONSTRAINT "kelas_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "public"."tahun_ajaran"("id");



ALTER TABLE ONLY "public"."kelas"
    ADD CONSTRAINT "kelas_wali_kelas_id_fkey" FOREIGN KEY ("wali_kelas_id") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_received_by_fkey" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id");



ALTER TABLE ONLY "public"."payments"
    ADD CONSTRAINT "payments_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "public"."siswa"("id");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_guru_id_fkey" FOREIGN KEY ("guru_id") REFERENCES "public"."guru"("id");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_kelas_id_fkey" FOREIGN KEY ("kelas_id") REFERENCES "public"."kelas"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_mata_pelajaran_id_fkey" FOREIGN KEY ("mata_pelajaran_id") REFERENCES "public"."mata_pelajaran"("id");



ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_tahun_ajaran_id_fkey" FOREIGN KEY ("tahun_ajaran_id") REFERENCES "public"."tahun_ajaran"("id");



ALTER TABLE ONLY "public"."siswa"
    ADD CONSTRAINT "siswa_kelas_id_fkey" FOREIGN KEY ("kelas_id") REFERENCES "public"."kelas"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."siswa"
    ADD CONSTRAINT "siswa_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."siswa_wali"
    ADD CONSTRAINT "siswa_wali_siswa_id_fkey" FOREIGN KEY ("siswa_id") REFERENCES "public"."siswa"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."siswa_wali"
    ADD CONSTRAINT "siswa_wali_wali_id_fkey" FOREIGN KEY ("wali_id") REFERENCES "public"."wali_murid"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."wali_murid"
    ADD CONSTRAINT "wali_murid_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE "auth"."audit_log_entries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."flow_state" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."identities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."instances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_amr_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."mfa_factors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."one_time_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."refresh_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."saml_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."saml_relay_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."schema_migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sso_domains" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."sso_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "auth"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Admin delete users" ON "public"."users" FOR DELETE USING ("public"."has_role"('admin'::"text"));



CREATE POLICY "Admin manage guru" ON "public"."guru" USING ("public"."has_role"('admin'::"text"));



CREATE POLICY "Admin manage roles" ON "public"."user_roles" USING ("public"."has_role"('admin'::"text"));



CREATE POLICY "Admin manage siswa" ON "public"."siswa" USING ("public"."has_role"('admin'::"text"));



CREATE POLICY "Admin update users" ON "public"."users" FOR UPDATE USING ("public"."has_role"('admin'::"text"));



CREATE POLICY "Delete attendance" ON "public"."attendances" FOR DELETE USING (("auth"."uid"() = "input_by"));



CREATE POLICY "Enable all access for admins" ON "public"."school_info" TO "authenticated" USING ("public"."has_role"('admin'::"text"));



CREATE POLICY "Enable read access for all authenticated users" ON "public"."school_info" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Insert attendance" ON "public"."attendances" FOR INSERT WITH CHECK (("auth"."uid"() = "input_by"));



CREATE POLICY "Manage academic" ON "public"."tahun_ajaran" USING ("public"."has_role"('admin'::"text"));



CREATE POLICY "Manage classes" ON "public"."kelas" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('tu'::"text")));



CREATE POLICY "Manage expense categories" ON "public"."expense_categories" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('tu'::"text")));



CREATE POLICY "Manage expenses" ON "public"."expenses" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('tu'::"text")));



CREATE POLICY "Manage guru" ON "public"."guru" USING ("public"."has_role"('admin'::"text"));



CREATE POLICY "Manage invoices" ON "public"."invoices" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('tu'::"text")));



CREATE POLICY "Manage jam_pelajaran" ON "public"."jam_pelajaran" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('tu'::"text")));



CREATE POLICY "Manage jurusan" ON "public"."jurusan" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('tu'::"text")));



CREATE POLICY "Manage payments" ON "public"."payments" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('tu'::"text")));



CREATE POLICY "Manage schedules" ON "public"."schedules" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('tu'::"text")));



CREATE POLICY "Manage siswa" ON "public"."siswa" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('tu'::"text")));



CREATE POLICY "Manage siswa_wali" ON "public"."siswa_wali" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('tu'::"text")));



CREATE POLICY "Manage subjects" ON "public"."mata_pelajaran" USING ("public"."has_role"('admin'::"text"));



CREATE POLICY "Manage wali_murid" ON "public"."wali_murid" USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('tu'::"text")));



CREATE POLICY "Read academic" ON "public"."tahun_ajaran" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Read classes" ON "public"."kelas" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Read expense categories" ON "public"."expense_categories" FOR SELECT USING (true);



CREATE POLICY "Read expenses" ON "public"."expenses" FOR SELECT USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('tu'::"text") OR "public"."has_role"('guru'::"text")));



CREATE POLICY "Read guru" ON "public"."guru" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Read invoices" ON "public"."invoices" FOR SELECT USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('tu'::"text") OR "public"."has_role"('guru'::"text") OR "public"."has_role"('siswa'::"text") OR "public"."has_role"('wali_murid'::"text")));



CREATE POLICY "Read jam_pelajaran" ON "public"."jam_pelajaran" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Read jurusan" ON "public"."jurusan" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Read payments" ON "public"."payments" FOR SELECT USING (("public"."has_role"('admin'::"text") OR "public"."has_role"('tu'::"text") OR "public"."has_role"('guru'::"text") OR ("auth"."uid"() = ( SELECT "siswa"."user_id"
   FROM "public"."siswa"
  WHERE ("siswa"."id" = "payments"."siswa_id")))));



CREATE POLICY "Read roles" ON "public"."roles" FOR SELECT USING (true);



CREATE POLICY "Read schedules" ON "public"."schedules" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Read subjects" ON "public"."mata_pelajaran" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Read user roles" ON "public"."user_roles" FOR SELECT USING (true);



CREATE POLICY "Siswa view own" ON "public"."siswa" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR "public"."has_role"('admin'::"text") OR "public"."has_role"('guru'::"text") OR "public"."has_role"('tu'::"text")));



CREATE POLICY "Update attendance" ON "public"."attendances" FOR UPDATE USING (("auth"."uid"() = "input_by"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users update own" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users view own or privileged" ON "public"."users" FOR SELECT USING ((("auth"."uid"() = "id") OR "public"."has_role"('admin'::"text") OR "public"."has_role"('guru'::"text") OR "public"."has_role"('tu'::"text")));



CREATE POLICY "View attendance" ON "public"."attendances" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



ALTER TABLE "public"."attendances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."expense_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."guru" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invoices" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jam_pelajaran" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."jurusan" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kelas" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."school_info" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."siswa" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "auth" TO "anon";
GRANT USAGE ON SCHEMA "auth" TO "authenticated";
GRANT USAGE ON SCHEMA "auth" TO "service_role";
GRANT ALL ON SCHEMA "auth" TO "supabase_auth_admin";
GRANT ALL ON SCHEMA "auth" TO "dashboard_user";
GRANT USAGE ON SCHEMA "auth" TO "postgres";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "auth"."email"() TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."jwt"() TO "postgres";
GRANT ALL ON FUNCTION "auth"."jwt"() TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."role"() TO "dashboard_user";



GRANT ALL ON FUNCTION "auth"."uid"() TO "dashboard_user";



GRANT ALL ON FUNCTION "public"."assign_ketua_kelas"("p_kelas_id" integer, "p_siswa_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_ketua_kelas"("p_kelas_id" integer, "p_siswa_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_ketua_kelas"("p_kelas_id" integer, "p_siswa_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_wali_to_student"("p_siswa_id" integer, "p_wali_user_id" "uuid", "p_hubungan" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."assign_wali_to_student"("p_siswa_id" integer, "p_wali_user_id" "uuid", "p_hubungan" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_wali_to_student"("p_siswa_id" integer, "p_wali_user_id" "uuid", "p_hubungan" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_and_assign_wali"("p_siswa_id" integer, "p_user_id" "uuid", "p_hubungan" "text", "p_phone" "text", "p_pekerjaan" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_and_assign_wali"("p_siswa_id" integer, "p_user_id" "uuid", "p_hubungan" "text", "p_phone" "text", "p_pekerjaan" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_and_assign_wali"("p_siswa_id" integer, "p_user_id" "uuid", "p_hubungan" "text", "p_phone" "text", "p_pekerjaan" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_class"("p_nama" "text", "p_tingkat" integer, "p_tahun_ajaran_id" integer, "p_wali_kelas_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_class"("p_nama" "text", "p_tingkat" integer, "p_tahun_ajaran_id" integer, "p_wali_kelas_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_class"("p_nama" "text", "p_tingkat" integer, "p_tahun_ajaran_id" integer, "p_wali_kelas_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_expense"("p_category_id" integer, "p_description" "text", "p_amount" numeric, "p_transaction_date" "date", "p_pic" character varying, "p_status" character varying, "p_proof_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_expense"("p_category_id" integer, "p_description" "text", "p_amount" numeric, "p_transaction_date" "date", "p_pic" character varying, "p_status" character varying, "p_proof_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_expense"("p_category_id" integer, "p_description" "text", "p_amount" numeric, "p_transaction_date" "date", "p_pic" character varying, "p_status" character varying, "p_proof_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_guru_profile"("p_email" "text", "p_full_name" "text", "p_nip" "text", "p_bidang_studi" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_guru_profile"("p_email" "text", "p_full_name" "text", "p_nip" "text", "p_bidang_studi" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_guru_profile"("p_email" "text", "p_full_name" "text", "p_nip" "text", "p_bidang_studi" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_invoice_batch"("p_payment_type_id" integer, "p_class_id" integer, "p_bulan" integer, "p_tahun" integer, "p_due_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."create_invoice_batch"("p_payment_type_id" integer, "p_class_id" integer, "p_bulan" integer, "p_tahun" integer, "p_due_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_invoice_batch"("p_payment_type_id" integer, "p_class_id" integer, "p_bulan" integer, "p_tahun" integer, "p_due_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_invoice_single"("p_siswa_id" integer, "p_payment_type_id" integer, "p_nominal" numeric, "p_bulan" integer, "p_tahun" integer, "p_due_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."create_invoice_single"("p_siswa_id" integer, "p_payment_type_id" integer, "p_nominal" numeric, "p_bulan" integer, "p_tahun" integer, "p_due_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_invoice_single"("p_siswa_id" integer, "p_payment_type_id" integer, "p_nominal" numeric, "p_bulan" integer, "p_tahun" integer, "p_due_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_invoice_single"("p_siswa_id" integer, "p_payment_type_id" integer, "p_nominal" numeric, "p_bulan" integer, "p_tahun" integer, "p_due_date" "date", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_invoice_single"("p_siswa_id" integer, "p_payment_type_id" integer, "p_nominal" numeric, "p_bulan" integer, "p_tahun" integer, "p_due_date" "date", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_invoice_single"("p_siswa_id" integer, "p_payment_type_id" integer, "p_nominal" numeric, "p_bulan" integer, "p_tahun" integer, "p_due_date" "date", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_payment_type"("p_nama" "text", "p_nominal_default" numeric, "p_is_recurring" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."create_payment_type"("p_nama" "text", "p_nominal_default" numeric, "p_is_recurring" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_payment_type"("p_nama" "text", "p_nominal_default" numeric, "p_is_recurring" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_payment_type"("p_nama" "text", "p_nominal_default" numeric, "p_is_recurring" boolean, "p_billing_cycle" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_payment_type"("p_nama" "text", "p_nominal_default" numeric, "p_is_recurring" boolean, "p_billing_cycle" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_payment_type"("p_nama" "text", "p_nominal_default" numeric, "p_is_recurring" boolean, "p_billing_cycle" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_siswa_profile"("p_user_id" "uuid", "p_nis" character varying, "p_nisn" character varying, "p_kelas_id" integer, "p_jenis_kelamin" character varying, "p_tanggal_lahir" "date", "p_alamat" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_siswa_profile"("p_user_id" "uuid", "p_nis" character varying, "p_nisn" character varying, "p_kelas_id" integer, "p_jenis_kelamin" character varying, "p_tanggal_lahir" "date", "p_alamat" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_siswa_profile"("p_user_id" "uuid", "p_nis" character varying, "p_nisn" character varying, "p_kelas_id" integer, "p_jenis_kelamin" character varying, "p_tanggal_lahir" "date", "p_alamat" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_expense"("p_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."delete_expense"("p_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_expense"("p_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_payment_type"("p_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."delete_payment_type"("p_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_payment_type"("p_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_user_completely"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_completely"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_completely"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_dashboard"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_dashboard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_dashboard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_gurus"("p_page" integer, "p_limit" integer, "p_search" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_gurus"("p_page" integer, "p_limit" integer, "p_search" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_gurus"("p_page" integer, "p_limit" integer, "p_search" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_students"("p_page" integer, "p_limit" integer, "p_search" "text", "p_class_id" integer, "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_students"("p_page" integer, "p_limit" integer, "p_search" "text", "p_class_id" integer, "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_students"("p_page" integer, "p_limit" integer, "p_search" "text", "p_class_id" integer, "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_arrears_report"("p_class_id" integer, "p_month" integer, "p_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_arrears_report"("p_class_id" integer, "p_month" integer, "p_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_arrears_report"("p_class_id" integer, "p_month" integer, "p_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_attendance_recap"("p_kelas_id" integer, "p_start_date" "date", "p_end_date" "date", "p_mata_pelajaran_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_attendance_recap"("p_kelas_id" integer, "p_start_date" "date", "p_end_date" "date", "p_mata_pelajaran_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_attendance_recap"("p_kelas_id" integer, "p_start_date" "date", "p_end_date" "date", "p_mata_pelajaran_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_billable_invoices"("p_siswa_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_billable_invoices"("p_siswa_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_billable_invoices"("p_siswa_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_billing_stats_by_class"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_billing_stats_by_class"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_billing_stats_by_class"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_classes_by_academic_year"("p_academic_year_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_classes_by_academic_year"("p_academic_year_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_classes_by_academic_year"("p_academic_year_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_daily_finance_recap"("p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_daily_finance_recap"("p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_daily_finance_recap"("p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_expense_breakdown"("p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_expense_breakdown"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_expense_breakdown"("p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_expense_categories"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_expense_categories"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_expense_categories"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_expense_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_expense_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_expense_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_expenses"("p_search" "text", "p_category_id" integer, "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_expenses"("p_search" "text", "p_category_id" integer, "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_expenses"("p_search" "text", "p_category_id" integer, "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_financial_report_summary"("p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_financial_report_summary"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_financial_report_summary"("p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_financial_transaction_log"("p_start_date" "date", "p_end_date" "date", "p_type" "text", "p_category" "text", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_financial_transaction_log"("p_start_date" "date", "p_end_date" "date", "p_type" "text", "p_category" "text", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_financial_transaction_log"("p_start_date" "date", "p_end_date" "date", "p_type" "text", "p_category" "text", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_guru_classes"("p_guru_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_guru_classes"("p_guru_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_guru_classes"("p_guru_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_guru_daily_schedules"("p_guru_id" "uuid", "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_guru_daily_schedules"("p_guru_id" "uuid", "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_guru_daily_schedules"("p_guru_id" "uuid", "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_guru_dashboard"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_guru_dashboard"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_guru_dashboard"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_guru_dashboard"("p_user_id" "uuid", "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_guru_dashboard"("p_user_id" "uuid", "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_guru_dashboard"("p_user_id" "uuid", "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_guru_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_guru_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_guru_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_invoices"("p_page" integer, "p_limit" integer, "p_status" "text", "p_siswa_id" integer, "p_class_id" integer, "p_month" integer, "p_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_invoices"("p_page" integer, "p_limit" integer, "p_status" "text", "p_siswa_id" integer, "p_class_id" integer, "p_month" integer, "p_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_invoices"("p_page" integer, "p_limit" integer, "p_status" "text", "p_siswa_id" integer, "p_class_id" integer, "p_month" integer, "p_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ketuakelas_classmates"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ketuakelas_classmates"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ketuakelas_classmates"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ketuakelas_dashboard"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ketuakelas_dashboard"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ketuakelas_dashboard"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ketuakelas_profile"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ketuakelas_profile"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ketuakelas_profile"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_ketuakelas_schedule"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_ketuakelas_schedule"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_ketuakelas_schedule"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_payment_history"("p_siswa_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_payment_history"("p_siswa_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_payment_history"("p_siswa_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_payment_types"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_payment_types"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_payment_types"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_payments"("p_page" integer, "p_limit" integer, "p_search" "text", "p_method" "text", "p_start_date" "date", "p_end_date" "date", "p_payment_type_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_payments"("p_page" integer, "p_limit" integer, "p_search" "text", "p_method" "text", "p_start_date" "date", "p_end_date" "date", "p_payment_type_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_payments"("p_page" integer, "p_limit" integer, "p_search" "text", "p_method" "text", "p_start_date" "date", "p_end_date" "date", "p_payment_type_id" integer) TO "service_role";



GRANT ALL ON TABLE "public"."school_info" TO "anon";
GRANT ALL ON TABLE "public"."school_info" TO "authenticated";
GRANT ALL ON TABLE "public"."school_info" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_school_info"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_school_info"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_school_info"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_siswa_attendance_history"("p_user_id" "uuid", "p_month" integer, "p_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_siswa_attendance_history"("p_user_id" "uuid", "p_month" integer, "p_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_siswa_attendance_history"("p_user_id" "uuid", "p_month" integer, "p_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_siswa_dashboard"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_siswa_dashboard"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_siswa_dashboard"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_siswa_profile"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_siswa_profile"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_siswa_profile"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_siswa_schedule"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_siswa_schedule"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_siswa_schedule"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_student_attendance_card"("p_siswa_id" "text", "p_semester" integer, "p_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_student_attendance_card"("p_siswa_id" "text", "p_semester" integer, "p_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_student_attendance_card"("p_siswa_id" "text", "p_semester" integer, "p_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_student_attendance_log"("p_student_id" integer, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_student_attendance_log"("p_student_id" integer, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_student_attendance_log"("p_student_id" integer, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_student_bill"("p_siswa_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_student_bill"("p_siswa_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_student_bill"("p_siswa_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_student_billing_summary"("p_class_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_student_billing_summary"("p_class_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_student_billing_summary"("p_class_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_student_profile_detail"("p_student_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_student_profile_detail"("p_student_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_student_profile_detail"("p_student_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tu_arrears_report"("p_class_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_tu_arrears_report"("p_class_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tu_arrears_report"("p_class_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tu_dashboard_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_tu_dashboard_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tu_dashboard_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tu_financial_dashboard"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_tu_financial_dashboard"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tu_financial_dashboard"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_notifications"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_notifications"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_notifications"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_wali_children"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_wali_children"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_wali_children"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_wali_dashboard"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_wali_dashboard"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_wali_dashboard"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_wali_profile"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_wali_profile"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_wali_profile"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_walikelas_attendance_monitoring"("p_user_id" "uuid", "p_month" integer, "p_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_walikelas_attendance_monitoring"("p_user_id" "uuid", "p_month" integer, "p_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_walikelas_attendance_monitoring"("p_user_id" "uuid", "p_month" integer, "p_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_walikelas_class_students"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_walikelas_class_students"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_walikelas_class_students"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_walikelas_dashboard"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_walikelas_dashboard"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_walikelas_dashboard"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_walikelas_monthly_report"("p_user_id" "uuid", "p_month" integer, "p_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_walikelas_monthly_report"("p_user_id" "uuid", "p_month" integer, "p_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_walikelas_monthly_report"("p_user_id" "uuid", "p_month" integer, "p_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_walikelas_profile"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_walikelas_profile"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_walikelas_profile"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_walikelas_semester_report"("p_user_id" "uuid", "p_semester" integer, "p_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_walikelas_semester_report"("p_user_id" "uuid", "p_semester" integer, "p_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_walikelas_semester_report"("p_user_id" "uuid", "p_semester" integer, "p_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_attendance_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_attendance_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_attendance_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_invoice_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_invoice_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_invoice_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_role"("role_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_role"("role_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_role"("role_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_notifications_read"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_read"("p_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."promote_students"("p_student_ids" integer[], "p_target_class_id" integer, "p_new_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."promote_students"("p_student_ids" integer[], "p_target_class_id" integer, "p_new_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."promote_students"("p_student_ids" integer[], "p_target_class_id" integer, "p_new_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_payment"("p_invoice_id" integer, "p_amount" numeric, "p_method" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."record_payment"("p_invoice_id" integer, "p_amount" numeric, "p_method" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_payment"("p_invoice_id" integer, "p_amount" numeric, "p_method" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_ketua_kelas"("p_kelas_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."remove_ketua_kelas"("p_kelas_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_ketua_kelas"("p_kelas_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_wali_candidates"("p_query" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."search_wali_candidates"("p_query" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_wali_candidates"("p_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_default_academic_year"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_default_academic_year"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_default_academic_year"() TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_ketuakelas_attendance"("p_user_id" "uuid", "p_schedule_id" integer, "p_attendances" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_ketuakelas_attendance"("p_user_id" "uuid", "p_schedule_id" integer, "p_attendances" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_ketuakelas_attendance"("p_user_id" "uuid", "p_schedule_id" integer, "p_attendances" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_recent_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_recent_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_recent_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_user_roles_to_metadata"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_user_roles_to_metadata"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_user_roles_to_metadata"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_class"("p_id" integer, "p_nama" "text", "p_tingkat" integer, "p_wali_kelas_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_class"("p_id" integer, "p_nama" "text", "p_tingkat" integer, "p_wali_kelas_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_class"("p_id" integer, "p_nama" "text", "p_tingkat" integer, "p_wali_kelas_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_expense"("p_id" integer, "p_category_id" integer, "p_description" "text", "p_amount" numeric, "p_transaction_date" "date", "p_pic" character varying, "p_status" character varying, "p_proof_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_expense"("p_id" integer, "p_category_id" integer, "p_description" "text", "p_amount" numeric, "p_transaction_date" "date", "p_pic" character varying, "p_status" character varying, "p_proof_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_expense"("p_id" integer, "p_category_id" integer, "p_description" "text", "p_amount" numeric, "p_transaction_date" "date", "p_pic" character varying, "p_status" character varying, "p_proof_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_guru_profile"("p_phone" character varying, "p_alamat" "text", "p_pendidikan_terakhir" character varying, "p_sertifikasi" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."update_guru_profile"("p_phone" character varying, "p_alamat" "text", "p_pendidikan_terakhir" character varying, "p_sertifikasi" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_guru_profile"("p_phone" character varying, "p_alamat" "text", "p_pendidikan_terakhir" character varying, "p_sertifikasi" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_payment_type"("p_id" integer, "p_nama" "text", "p_nominal_default" numeric, "p_is_recurring" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_payment_type"("p_id" integer, "p_nama" "text", "p_nominal_default" numeric, "p_is_recurring" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_payment_type"("p_id" integer, "p_nama" "text", "p_nominal_default" numeric, "p_is_recurring" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_payment_type"("p_id" integer, "p_nama" character varying, "p_nominal_default" numeric, "p_is_recurring" boolean, "p_description" character varying, "p_is_active" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_payment_type"("p_id" integer, "p_nama" character varying, "p_nominal_default" numeric, "p_is_recurring" boolean, "p_description" character varying, "p_is_active" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_payment_type"("p_id" integer, "p_nama" character varying, "p_nominal_default" numeric, "p_is_recurring" boolean, "p_description" character varying, "p_is_active" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_payment_type"("p_id" integer, "p_nama" character varying, "p_nominal_default" numeric, "p_is_recurring" boolean, "p_description" character varying, "p_is_active" boolean, "p_billing_cycle" character varying) TO "anon";
GRANT ALL ON FUNCTION "public"."update_payment_type"("p_id" integer, "p_nama" character varying, "p_nominal_default" numeric, "p_is_recurring" boolean, "p_description" character varying, "p_is_active" boolean, "p_billing_cycle" character varying) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_payment_type"("p_id" integer, "p_nama" character varying, "p_nominal_default" numeric, "p_is_recurring" boolean, "p_description" character varying, "p_is_active" boolean, "p_billing_cycle" character varying) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_school_info"("p_name" "text", "p_address" "text", "p_phone" "text", "p_email" "text", "p_website" "text", "p_logo_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_school_info"("p_name" "text", "p_address" "text", "p_phone" "text", "p_email" "text", "p_website" "text", "p_logo_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_school_info"("p_name" "text", "p_address" "text", "p_phone" "text", "p_email" "text", "p_website" "text", "p_logo_url" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_student_status"("p_student_id" integer, "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_student_status"("p_student_id" integer, "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_student_status"("p_student_id" integer, "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."void_invoice"("p_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."void_invoice"("p_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."void_invoice"("p_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."void_payment"("p_payment_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."void_payment"("p_payment_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."void_payment"("p_payment_id" integer) TO "service_role";



GRANT ALL ON TABLE "auth"."audit_log_entries" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."audit_log_entries" TO "postgres";
GRANT SELECT ON TABLE "auth"."audit_log_entries" TO "postgres" WITH GRANT OPTION;



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."flow_state" TO "postgres";
GRANT SELECT ON TABLE "auth"."flow_state" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."flow_state" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."identities" TO "postgres";
GRANT SELECT ON TABLE "auth"."identities" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."identities" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."instances" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."instances" TO "postgres";
GRANT SELECT ON TABLE "auth"."instances" TO "postgres" WITH GRANT OPTION;



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."mfa_amr_claims" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_amr_claims" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_amr_claims" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."mfa_challenges" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_challenges" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_challenges" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."mfa_factors" TO "postgres";
GRANT SELECT ON TABLE "auth"."mfa_factors" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."mfa_factors" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_authorizations" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_authorizations" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_client_states" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_client_states" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_clients" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_clients" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."oauth_consents" TO "postgres";
GRANT ALL ON TABLE "auth"."oauth_consents" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."one_time_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."one_time_tokens" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."one_time_tokens" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."refresh_tokens" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."refresh_tokens" TO "postgres";
GRANT SELECT ON TABLE "auth"."refresh_tokens" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "dashboard_user";
GRANT ALL ON SEQUENCE "auth"."refresh_tokens_id_seq" TO "postgres";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."saml_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_providers" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."saml_relay_states" TO "postgres";
GRANT SELECT ON TABLE "auth"."saml_relay_states" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."saml_relay_states" TO "dashboard_user";



GRANT SELECT ON TABLE "auth"."schema_migrations" TO "postgres" WITH GRANT OPTION;



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."sessions" TO "postgres";
GRANT SELECT ON TABLE "auth"."sessions" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sessions" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."sso_domains" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_domains" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_domains" TO "dashboard_user";



GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."sso_providers" TO "postgres";
GRANT SELECT ON TABLE "auth"."sso_providers" TO "postgres" WITH GRANT OPTION;
GRANT ALL ON TABLE "auth"."sso_providers" TO "dashboard_user";



GRANT ALL ON TABLE "auth"."users" TO "dashboard_user";
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "auth"."users" TO "postgres";
GRANT SELECT ON TABLE "auth"."users" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "public"."attendances" TO "anon";
GRANT ALL ON TABLE "public"."attendances" TO "authenticated";
GRANT ALL ON TABLE "public"."attendances" TO "service_role";



GRANT ALL ON SEQUENCE "public"."attendances_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."attendances_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."attendances_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."expense_categories" TO "anon";
GRANT ALL ON TABLE "public"."expense_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."expense_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."expense_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."expense_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."expense_categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."expenses" TO "anon";
GRANT ALL ON TABLE "public"."expenses" TO "authenticated";
GRANT ALL ON TABLE "public"."expenses" TO "service_role";



GRANT ALL ON SEQUENCE "public"."expenses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."expenses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."expenses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."guru" TO "anon";
GRANT ALL ON TABLE "public"."guru" TO "authenticated";
GRANT ALL ON TABLE "public"."guru" TO "service_role";



GRANT ALL ON SEQUENCE "public"."guru_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."guru_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."guru_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invoices_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invoices_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invoices_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."jam_pelajaran" TO "anon";
GRANT ALL ON TABLE "public"."jam_pelajaran" TO "authenticated";
GRANT ALL ON TABLE "public"."jam_pelajaran" TO "service_role";



GRANT ALL ON SEQUENCE "public"."jam_pelajaran_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."jam_pelajaran_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."jam_pelajaran_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."jurusan" TO "anon";
GRANT ALL ON TABLE "public"."jurusan" TO "authenticated";
GRANT ALL ON TABLE "public"."jurusan" TO "service_role";



GRANT ALL ON SEQUENCE "public"."jurusan_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."jurusan_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."jurusan_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."kelas" TO "anon";
GRANT ALL ON TABLE "public"."kelas" TO "authenticated";
GRANT ALL ON TABLE "public"."kelas" TO "service_role";



GRANT ALL ON SEQUENCE "public"."kelas_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."kelas_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."kelas_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."mata_pelajaran" TO "anon";
GRANT ALL ON TABLE "public"."mata_pelajaran" TO "authenticated";
GRANT ALL ON TABLE "public"."mata_pelajaran" TO "service_role";



GRANT ALL ON SEQUENCE "public"."mata_pelajaran_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."mata_pelajaran_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."mata_pelajaran_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."payment_types" TO "anon";
GRANT ALL ON TABLE "public"."payment_types" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_types" TO "service_role";



GRANT ALL ON SEQUENCE "public"."payment_types_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."payment_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."payment_types_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."payments" TO "anon";
GRANT ALL ON TABLE "public"."payments" TO "authenticated";
GRANT ALL ON TABLE "public"."payments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."payments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."schedules" TO "anon";
GRANT ALL ON TABLE "public"."schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."schedules" TO "service_role";



GRANT ALL ON SEQUENCE "public"."schedules_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."schedules_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."schedules_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."siswa" TO "anon";
GRANT ALL ON TABLE "public"."siswa" TO "authenticated";
GRANT ALL ON TABLE "public"."siswa" TO "service_role";



GRANT ALL ON SEQUENCE "public"."siswa_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."siswa_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."siswa_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."siswa_wali" TO "anon";
GRANT ALL ON TABLE "public"."siswa_wali" TO "authenticated";
GRANT ALL ON TABLE "public"."siswa_wali" TO "service_role";



GRANT ALL ON SEQUENCE "public"."siswa_wali_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."siswa_wali_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."siswa_wali_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tahun_ajaran" TO "anon";
GRANT ALL ON TABLE "public"."tahun_ajaran" TO "authenticated";
GRANT ALL ON TABLE "public"."tahun_ajaran" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tahun_ajaran_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tahun_ajaran_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tahun_ajaran_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_roles_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."v_admin_dashboard_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_admin_dashboard_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_admin_dashboard_summary" TO "service_role";



GRANT ALL ON TABLE "public"."v_class_attendance_summary" TO "anon";
GRANT ALL ON TABLE "public"."v_class_attendance_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."v_class_attendance_summary" TO "service_role";



GRANT ALL ON TABLE "public"."v_weekly_attendance" TO "anon";
GRANT ALL ON TABLE "public"."v_weekly_attendance" TO "authenticated";
GRANT ALL ON TABLE "public"."v_weekly_attendance" TO "service_role";



GRANT ALL ON TABLE "public"."wali_murid" TO "anon";
GRANT ALL ON TABLE "public"."wali_murid" TO "authenticated";
GRANT ALL ON TABLE "public"."wali_murid" TO "service_role";



GRANT ALL ON SEQUENCE "public"."wali_murid_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."wali_murid_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."wali_murid_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON SEQUENCES TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON FUNCTIONS TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_auth_admin" IN SCHEMA "auth" GRANT ALL ON TABLES TO "dashboard_user";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







