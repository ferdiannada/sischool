# Backend Setup Guide - School AI

Panduan lengkap untuk menjalankan backend dengan local Supabase dan Docker.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) terinstall dan running
- [Node.js](https://nodejs.org/) v18+ terinstall
- Git

## Quick Start

### 1. Start Docker Services

```bash
# Masuk ke folder docker
cd docker

# Jalankan semua services (tanpa Redis)
docker-compose up -d

# Jika ingin menggunakan Redis (optional)
docker-compose --profile with-redis up -d
```

### 2. Verify Services

| Service | URL | Keterangan |
|---------|-----|------------|
| PostgreSQL | `localhost:5432` | Database |
| Supabase Studio | `http://localhost:3333` | Database GUI |
| Kong API Gateway | `http://localhost:8000` | API Gateway |
| Auth (GoTrue) | `http://localhost:9999` | Authentication |
| REST (PostgREST) | `http://localhost:3001` | REST API |
| Realtime | `http://localhost:4000` | WebSocket |
| Redis | `localhost:6379` | Cache (optional) |

### 3. Access Supabase Studio

Buka browser dan akses `http://localhost:3333`:
- Gunakan untuk melihat dan mengelola database
- Buat user baru melalui Auth section
- Edit data langsung jika diperlukan

### 4. Start Frontend

```bash
# Kembali ke root folder
cd ..

# Install dependencies (jika belum)
npm install

# Jalankan development server
npm run dev
```

## Database Structure

### Core Tables
- `users` - Data user dasar
- `roles` - Definisi role (admin, guru, siswa, dll)
- `user_roles` - Mapping user ke role

### Academic
- `tahun_ajaran` - Tahun ajaran dan semester
- `kelas` - Data kelas
- `mata_pelajaran` - Mata pelajaran
- `guru` - Profil guru
- `siswa` - Profil siswa
- `wali_murid` - Profil wali murid

### Operations
- `schedules` - Jadwal pelajaran
- `attendances` - Data absensi
- `attendance_daily_summary` - Summary harian (denormalized)

### Finance (TU)
- `payment_types` - Jenis pembayaran
- `invoices` - Tagihan
- `payments` - Pembayaran
- `expenses` - Pengeluaran

### Notifications
- `notifications` - Data notifikasi
- `notification_recipients` - Penerima notifikasi

## Environment Variables

File `.env.local` sudah dikonfigurasi untuk development:

```env
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Common Commands

```bash
# Stop semua services
docker-compose down

# Stop dan hapus volumes (reset database)
docker-compose down -v

# Lihat logs
docker-compose logs -f

# Lihat logs service tertentu
docker-compose logs -f db
docker-compose logs -f auth

# Restart service tertentu
docker-compose restart auth
```

## Database Connection

Untuk connect langsung ke PostgreSQL:

```bash
# Menggunakan psql
psql -h localhost -U postgres -d school_ai
# Password: postgres

# Atau menggunakan connection string
postgres://postgres:postgres@localhost:5432/school_ai
```

## Troubleshooting

### Port sudah digunakan
```bash
# Cek port yang digunakan
netstat -ano | findstr :5432

# Stop process yang menggunakan port tersebut
taskkill /PID <PID> /F
```

### Database tidak ter-seed
```bash
# Jalankan migration manual
docker exec -i school-ai-db psql -U postgres -d school_ai < docker/supabase/migrations/001_initial_schema.sql
docker exec -i school-ai-db psql -U postgres -d school_ai < docker/supabase/migrations/002_seed_data.sql
```

### Reset database
```bash
docker-compose down -v
docker-compose up -d
```

## API Endpoints

Base URL: `http://localhost:8000`

### Authentication
- `POST /auth/v1/signup` - Register
- `POST /auth/v1/token?grant_type=password` - Login
- `POST /auth/v1/logout` - Logout

### REST API
- `GET /rest/v1/users` - Get users
- `GET /rest/v1/kelas` - Get classes
- `GET /rest/v1/attendances` - Get attendance
- dll...

Semua REST endpoint mengikuti format PostgREST.
Dokumentasi: https://postgrest.org/en/stable/api.html
