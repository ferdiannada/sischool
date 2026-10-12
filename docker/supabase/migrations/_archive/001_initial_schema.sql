-- ============================================
-- School AI Database Migration
-- Version: 001 - Initial Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- ============================================
-- 1. ROLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default roles
INSERT INTO public.roles (name, description) VALUES
    ('admin', 'Administrator sistem'),
    ('guru', 'Guru/Pengajar'),
    ('wali_kelas', 'Wali Kelas'),
    ('ketua_kelas', 'Ketua Kelas'),
    ('siswa', 'Siswa'),
    ('wali_murid', 'Wali Murid/Orang Tua'),
    ('tu', 'Tata Usaha/Keuangan')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Role mapping
CREATE TABLE IF NOT EXISTS public.user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- ============================================
-- 3. ACADEMIC STRUCTURE
-- ============================================

-- Tahun Ajaran
CREATE TABLE IF NOT EXISTS public.tahun_ajaran (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(20) NOT NULL,
    semester INTEGER CHECK (semester IN (1, 2)),
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(nama, semester)
);

-- Mata Pelajaran
CREATE TABLE IF NOT EXISTS public.mata_pelajaran (
    id SERIAL PRIMARY KEY,
    kode VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kelas (forward declaration without foreign keys first)
CREATE TABLE IF NOT EXISTS public.kelas (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(50) NOT NULL,
    tingkat INTEGER CHECK (tingkat BETWEEN 1 AND 12),
    tahun_ajaran_id INTEGER,
    wali_kelas_id UUID,
    ketua_kelas_id UUID,
    kapasitas INTEGER DEFAULT 40,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. PROFILE TABLES
-- ============================================

-- Guru Profile
CREATE TABLE IF NOT EXISTS public.guru (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    nip VARCHAR(30) UNIQUE,
    bidang_studi VARCHAR(100),
    tanggal_bergabung DATE,
    status VARCHAR(20) DEFAULT 'aktif',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Siswa Profile
CREATE TABLE IF NOT EXISTS public.siswa (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    nis VARCHAR(20) UNIQUE NOT NULL,
    nisn VARCHAR(20) UNIQUE,
    kelas_id INTEGER REFERENCES public.kelas(id),
    tanggal_lahir DATE,
    jenis_kelamin CHAR(1) CHECK (jenis_kelamin IN ('L', 'P')),
    alamat TEXT,
    status VARCHAR(20) DEFAULT 'aktif',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wali Murid Profile
CREATE TABLE IF NOT EXISTS public.wali_murid (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    pekerjaan VARCHAR(100),
    hubungan VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Siswa-Wali Relationship
CREATE TABLE IF NOT EXISTS public.siswa_wali (
    id SERIAL PRIMARY KEY,
    siswa_id INTEGER REFERENCES public.siswa(id) ON DELETE CASCADE,
    wali_id INTEGER REFERENCES public.wali_murid(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(siswa_id, wali_id)
);

-- Add foreign keys to kelas table
ALTER TABLE public.kelas 
    ADD CONSTRAINT fk_kelas_tahun_ajaran 
    FOREIGN KEY (tahun_ajaran_id) REFERENCES public.tahun_ajaran(id);

ALTER TABLE public.kelas 
    ADD CONSTRAINT fk_kelas_wali_kelas 
    FOREIGN KEY (wali_kelas_id) REFERENCES public.users(id);

ALTER TABLE public.kelas 
    ADD CONSTRAINT fk_kelas_ketua_kelas 
    FOREIGN KEY (ketua_kelas_id) REFERENCES public.users(id);

-- ============================================
-- 5. SCHEDULE & ATTENDANCE
-- ============================================

-- Jadwal
CREATE TABLE IF NOT EXISTS public.schedules (
    id SERIAL PRIMARY KEY,
    kelas_id INTEGER REFERENCES public.kelas(id) ON DELETE CASCADE,
    mata_pelajaran_id INTEGER REFERENCES public.mata_pelajaran(id),
    guru_id INTEGER REFERENCES public.guru(id),
    hari INTEGER CHECK (hari BETWEEN 1 AND 7),
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    ruangan VARCHAR(50),
    tahun_ajaran_id INTEGER REFERENCES public.tahun_ajaran(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Absensi
CREATE TABLE IF NOT EXISTS public.attendances (
    id SERIAL PRIMARY KEY,
    siswa_id INTEGER REFERENCES public.siswa(id) ON DELETE CASCADE,
    schedule_id INTEGER REFERENCES public.schedules(id),
    tanggal DATE NOT NULL,
    status VARCHAR(10) CHECK (status IN ('hadir', 'izin', 'sakit', 'alpha')),
    waktu_hadir TIMESTAMPTZ,
    catatan TEXT,
    input_by UUID REFERENCES public.users(id),
    verified_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(siswa_id, schedule_id, tanggal)
);

-- Daily Attendance Summary (Denormalized for performance)
CREATE TABLE IF NOT EXISTS public.attendance_daily_summary (
    id SERIAL PRIMARY KEY,
    kelas_id INTEGER REFERENCES public.kelas(id),
    tanggal DATE NOT NULL,
    total_siswa INTEGER,
    hadir INTEGER DEFAULT 0,
    izin INTEGER DEFAULT 0,
    sakit INTEGER DEFAULT 0,
    alpha INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(kelas_id, tanggal)
);

-- ============================================
-- 6. FINANCE (TU MODULE)
-- ============================================

-- Jenis Pembayaran
CREATE TABLE IF NOT EXISTS public.payment_types (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    nominal_default DECIMAL(12,2),
    is_recurring BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tagihan
CREATE TABLE IF NOT EXISTS public.invoices (
    id SERIAL PRIMARY KEY,
    siswa_id INTEGER REFERENCES public.siswa(id),
    payment_type_id INTEGER REFERENCES public.payment_types(id),
    bulan INTEGER CHECK (bulan BETWEEN 1 AND 12),
    tahun INTEGER,
    nominal DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'unpaid',
    jatuh_tempo DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pembayaran
CREATE TABLE IF NOT EXISTS public.payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES public.invoices(id),
    siswa_id INTEGER REFERENCES public.siswa(id),
    nominal DECIMAL(12,2) NOT NULL,
    metode_bayar VARCHAR(50),
    bukti_bayar TEXT,
    tanggal_bayar TIMESTAMPTZ DEFAULT NOW(),
    received_by UUID REFERENCES public.users(id),
    catatan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pengeluaran
CREATE TABLE IF NOT EXISTS public.expenses (
    id SERIAL PRIMARY KEY,
    kategori VARCHAR(100),
    deskripsi TEXT NOT NULL,
    nominal DECIMAL(12,2) NOT NULL,
    tanggal DATE NOT NULL,
    bukti TEXT,
    created_by UUID REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'normal',
    data JSONB,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notification_recipients (
    id SERIAL PRIMARY KEY,
    notification_id INTEGER REFERENCES public.notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_attendances_siswa_tanggal ON public.attendances(siswa_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_attendances_schedule_tanggal ON public.attendances(schedule_id, tanggal);
CREATE INDEX IF NOT EXISTS idx_attendances_tanggal ON public.attendances(tanggal);
CREATE INDEX IF NOT EXISTS idx_schedules_kelas_hari ON public.schedules(kelas_id, hari);
CREATE INDEX IF NOT EXISTS idx_schedules_guru ON public.schedules(guru_id);
CREATE INDEX IF NOT EXISTS idx_siswa_kelas ON public.siswa(kelas_id);
CREATE INDEX IF NOT EXISTS idx_invoices_siswa_status ON public.invoices(siswa_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_siswa ON public.payments(siswa_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notification_recipients(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role_id);

-- ============================================
-- 9. FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_kelas_updated_at ON public.kelas;
CREATE TRIGGER update_kelas_updated_at BEFORE UPDATE ON public.kelas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guru_updated_at ON public.guru;
CREATE TRIGGER update_guru_updated_at BEFORE UPDATE ON public.guru
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_siswa_updated_at ON public.siswa;
CREATE TRIGGER update_siswa_updated_at BEFORE UPDATE ON public.siswa
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schedules_updated_at ON public.schedules;
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON public.schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendances_updated_at ON public.attendances;
CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON public.attendances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. DEFAULT ROLES FOR POSTGREST
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN NOINHERIT;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN NOINHERIT;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'service_role') THEN
        CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
    END IF;
END
$$;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

COMMENT ON SCHEMA public IS 'School AI Database Schema';
