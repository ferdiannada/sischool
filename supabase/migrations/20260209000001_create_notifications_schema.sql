
-- Drop existing incompatible tables
DROP TABLE IF EXISTS "public"."notification_recipients" CASCADE;
DROP TABLE IF EXISTS "public"."notifications" CASCADE;

-- Create notifications table
CREATE TABLE "public"."notifications" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "title" text NOT NULL,
    "message" text NOT NULL,
    "type" text CHECK (type IN ('info', 'success', 'warning', 'danger', 'error')),
    "category" text DEFAULT 'general',
    "priority" text DEFAULT 'normal',
    "data" jsonb DEFAULT '{}'::jsonb,
    "created_by" uuid,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL
);

-- Create notification_recipients table
CREATE TABLE IF NOT EXISTS "public"."notification_recipients" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "notification_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    CONSTRAINT "notification_recipients_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "notification_recipients_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE CASCADE,
    CONSTRAINT "notification_recipients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."notification_recipients" ENABLE ROW LEVEL SECURITY;

-- Policies for notification_recipients
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notification_recipients' AND policyname = 'Users can view own notification recipients'
    ) THEN
        CREATE POLICY "Users can view own notification recipients" ON "public"."notification_recipients"
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notification_recipients' AND policyname = 'Users can update own notification recipients'
    ) THEN
        CREATE POLICY "Users can update own notification recipients" ON "public"."notification_recipients"
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Policies for notifications
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view notifications they are recipients of'
    ) THEN
        CREATE POLICY "Users can view notifications they are recipients of" ON "public"."notifications"
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM "public"."notification_recipients" nr
                    WHERE nr.notification_id = "notifications"."id"
                    AND nr.user_id = auth.uid()
                ) OR "created_by" = auth.uid()
            );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Services can insert notifications'
    ) THEN
        CREATE POLICY "Services can insert notifications" ON "public"."notifications"
            FOR INSERT WITH CHECK (true); -- Allow all inserts (controlled by code/permissions)
    END IF;
END
$$;

-- Grants
GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";

GRANT ALL ON TABLE "public"."notification_recipients" TO "anon";
GRANT ALL ON TABLE "public"."notification_recipients" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_recipients" TO "service_role";
