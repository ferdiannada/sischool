
-- Add new columns to school_info
ALTER TABLE "public"."school_info" ADD COLUMN IF NOT EXISTS "npsn" varchar(50);
ALTER TABLE "public"."school_info" ADD COLUMN IF NOT EXISTS "headmaster" varchar(100);

-- Update the function to accept new parameters
CREATE OR REPLACE FUNCTION "public"."update_school_info"(
    "p_name" "text",
    "p_address" "text",
    "p_phone" "text",
    "p_email" "text", 
    "p_website" "text",
    "p_logo_url" "text",
    "p_npsn" "text" DEFAULT NULL,
    "p_headmaster" "text" DEFAULT NULL
) RETURNS "public"."school_info"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result public.school_info;
BEGIN
    -- Check permissions
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
            npsn = p_npsn,
            headmaster = p_headmaster,
            updated_at = NOW()
        RETURNING * INTO result;
    ELSE
        INSERT INTO public.school_info (name, address, phone, email, website, logo_url, npsn, headmaster)
        VALUES (p_name, p_address, p_phone, p_email, p_website, p_logo_url, p_npsn, p_headmaster)
        RETURNING * INTO result;
    END IF;

    RETURN result;
END;
$$;

-- Grant permissions for the updated function signatures if needed
GRANT ALL ON FUNCTION "public"."update_school_info"("text", "text", "text", "text", "text", "text", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_school_info"("text", "text", "text", "text", "text", "text", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_school_info"("text", "text", "text", "text", "text", "text", "text", "text") TO "service_role";
