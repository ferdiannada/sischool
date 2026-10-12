-- ============================================
-- School AI Database Schema - Renewal
-- Date: 2026-01-27
-- Description: Consolidated schema using Supabase Native Auth
-- ============================================

-- 0. AUTH SCHEMA STUB (Required for FK references if Auth service hasn't initialized yet)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY,
    email VARCHAR(255),
    raw_user_meta_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. PUBLIC USERS & ROLES (RBAC)

-- Roles Dictionary
CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.roles (name, description) VALUES
    ('admin', 'Administrator System'),
    ('guru', 'Teacher'),
    ('siswa', 'Student'),
    ('wali_murid', 'Parent/Guardian'),
    ('tu', 'Administration/Finance')
ON CONFLICT (name) DO NOTHING;

-- Public Profile Table (Synced with auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles Junction
CREATE TABLE public.user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES public.roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role_id)
);

-- 3. ACADEMIC STRUCTURE

-- Academic Years
CREATE TABLE public.tahun_ajaran (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(20) NOT NULL, -- e.g. "2025/2026"
    semester INTEGER CHECK (semester IN (1, 2)),
    tanggal_mulai DATE NOT NULL,
    tanggal_selesai DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(nama, semester)
);

-- Subjects
CREATE TABLE public.mata_pelajaran (
    id SERIAL PRIMARY KEY,
    kode VARCHAR(20) UNIQUE NOT NULL,
    nama VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes
CREATE TABLE public.kelas (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(50) NOT NULL,
    tingkat INTEGER CHECK (tingkat BETWEEN 1 AND 12),
    tahun_ajaran_id INTEGER REFERENCES public.tahun_ajaran(id),
    wali_kelas_id UUID REFERENCES public.users(id), -- Will point to Guru later
    kapasitas INTEGER DEFAULT 40,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROFILES (EXTENDED INFO)

-- Guru Profile
CREATE TABLE public.guru (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    nip VARCHAR(30) UNIQUE,
    bidang_studi VARCHAR(100),
    status VARCHAR(20) DEFAULT 'aktif',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Siswa Profile
CREATE TABLE public.siswa (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    nis VARCHAR(20) UNIQUE,
    nisn VARCHAR(20) UNIQUE,
    kelas_id INTEGER REFERENCES public.kelas(id) ON DELETE SET NULL,
    tanggal_lahir DATE,
    jenis_kelamin CHAR(1) CHECK (jenis_kelamin IN ('L', 'P')),
    alamat TEXT,
    status VARCHAR(20) DEFAULT 'aktif',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wali Murid Profile
CREATE TABLE public.wali_murid (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    pekerjaan VARCHAR(100),
    hubungan VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Siswa-Wali Relation
CREATE TABLE public.siswa_wali (
    id SERIAL PRIMARY KEY,
    siswa_id INTEGER REFERENCES public.siswa(id) ON DELETE CASCADE,
    wali_id INTEGER REFERENCES public.wali_murid(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,
    UNIQUE(siswa_id, wali_id)
);

-- 5. SCHEDULES & ATTENDANCE

CREATE TABLE public.schedules (
    id SERIAL PRIMARY KEY,
    kelas_id INTEGER REFERENCES public.kelas(id) ON DELETE CASCADE,
    mata_pelajaran_id INTEGER REFERENCES public.mata_pelajaran(id),
    guru_id INTEGER REFERENCES public.guru(id),
    hari INTEGER CHECK (hari BETWEEN 1 AND 7), -- 1=Monday
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    ruangan VARCHAR(50),
    tahun_ajaran_id INTEGER REFERENCES public.tahun_ajaran(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.attendances (
    id SERIAL PRIMARY KEY,
    siswa_id INTEGER REFERENCES public.siswa(id) ON DELETE CASCADE,
    schedule_id INTEGER REFERENCES public.schedules(id),
    tanggal DATE NOT NULL,
    status VARCHAR(10) CHECK (status IN ('hadir', 'izin', 'sakit', 'alpha')),
    waktu_hadir TIMESTAMPTZ,
    catatan TEXT,
    input_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(siswa_id, schedule_id, tanggal)
);

-- 6. FINANCE (TU)

CREATE TABLE public.payment_types (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    nominal_default DECIMAL(12,2),
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.invoices (
    id SERIAL PRIMARY KEY,
    siswa_id INTEGER REFERENCES public.siswa(id),
    payment_type_id INTEGER REFERENCES public.payment_types(id),
    bulan INTEGER,
    tahun INTEGER,
    nominal DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'unpaid',
    jatuh_tempo DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES public.invoices(id),
    siswa_id INTEGER REFERENCES public.siswa(id),
    nominal DECIMAL(12,2) NOT NULL,
    metode_bayar VARCHAR(50),
    tanggal_bayar TIMESTAMPTZ DEFAULT NOW(),
    received_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.expenses (
    id SERIAL PRIMARY KEY,
    kategori VARCHAR(100),
    deskripsi TEXT NOT NULL,
    nominal DECIMAL(12,2) NOT NULL,
    tanggal DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TRIGGERS & FUNCTIONS

-- Function to handle new user creation from Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_modtime BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_kelas_modtime BEFORE UPDATE ON public.kelas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. ROW LEVEL SECURITY (RLS)
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guru ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kelas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check Role
CREATE OR REPLACE FUNCTION public.has_role(role_name text) RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.name = role_name
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies

-- Public Users: Users can view their own profile. Admin/Guru/TU can view all.
CREATE POLICY "Users view own or privileged" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR 
        public.has_role('admin') OR 
        public.has_role('guru') OR 
        public.has_role('tu')
    );

CREATE POLICY "Users update own" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Roles: Public read
CREATE POLICY "Read roles" ON public.roles FOR SELECT USING (true);

-- User Roles: Read own, Admin manage
CREATE POLICY "Read user roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Admin manage roles" ON public.user_roles FOR ALL USING (public.has_role('admin'));

-- Academic Data: Read accessible by Authenticated, Write by Admin/Guru
CREATE POLICY "Read academic" ON public.tahun_ajaran FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage academic" ON public.tahun_ajaran FOR ALL USING (public.has_role('admin'));

CREATE POLICY "Read subjects" ON public.mata_pelajaran FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage subjects" ON public.mata_pelajaran FOR ALL USING (public.has_role('admin'));

CREATE POLICY "Read classes" ON public.kelas FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage classes" ON public.kelas FOR ALL USING (public.has_role('admin') OR public.has_role('tu'));

-- Student Data: Siswa see own, Guru/Admin/TU see all
CREATE POLICY "Siswa view own" ON public.siswa FOR SELECT USING (
    user_id = auth.uid() OR
    public.has_role('admin') OR
    public.has_role('guru') OR
    public.has_role('tu')
);

-- Grant Base Access
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;
