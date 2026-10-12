-- Give permissions to view and update attendance
-- Missing policies in baseline caused "row-level security policy" violation errors.

-- 1. Allow Authenticated users (Teachers/Admin/Students/Parents) to VIEW attendance
-- We can refine this later, but for now allow reading to show status.
DROP POLICY IF EXISTS "Select attendance" ON "public"."attendances";
CREATE POLICY "Select attendance" ON "public"."attendances" 
FOR SELECT 
TO authenticated 
USING (true);

-- 2. Allow Inputter (Teacher) to UPDATE their own attendance records
-- This enables 'upsert' to work when updating existing rows.
DROP POLICY IF EXISTS "Update attendance" ON "public"."attendances";
CREATE POLICY "Update attendance" ON "public"."attendances" 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = input_by)
WITH CHECK (auth.uid() = input_by);
