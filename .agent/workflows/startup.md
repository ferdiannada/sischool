---
description: Startup Docker, Supabase, dan Frontend setelah komputer/laptop baru dinyalakan
---

# 🚀 Startup Guide - School AI

Panduan langkah-langkah untuk menjalankan Docker, Supabase, dan aplikasi setelah komputer/laptop baru dinyalakan.

## Prerequisites Check

Sebelum memulai, pastikan:
- ✅ Docker Desktop sudah terinstall
- ✅ Node.js v18+ sudah terinstall

---

## Step 1: Start Docker Desktop

1. Buka **Docker Desktop** dari Start Menu atau Desktop
2. Tunggu sampai Docker Desktop fully running (icon di system tray berubah dari "starting" ke "running")
3. Pastikan tidak ada error di Docker Desktop

> **Catatan**: Di Windows, biasanya Docker memerlukan 1-2 menit untuk fully start.

---

## Step 2: Start Supabase Services

```powershell
# Masuk ke folder docker
cd d:\Project\school-ai\docker

// turbo
# Jalankan semua Supabase services
docker-compose up -d
```

Tunggu sampai semua container running. Verifikasi dengan:

```powershell
// turbo
# Cek status containers
docker-compose ps
```

### Expected Output:
- ✅ school-ai-db (healthy)
- ✅ school-ai-meta
- ✅ school-ai-studio
- ✅ school-ai-auth
- ✅ school-ai-rest
- ✅ school-ai-realtime
- ✅ school-ai-kong

---

## Step 3: Verify Database Ready

```powershell
// turbo
# Tunggu database healthy (biasanya 30-60 detik)
docker-compose logs db | Select-String -Pattern "ready"
```

Atau cek di Docker Desktop → Containers → school-ai-db → Status: "healthy"

---

## Step 4: Run Migrations (Jika Diperlukan)

### 4a. Jika Database Fresh/Reset

Migrations otomatis dijalankan oleh Docker saat pertama kali container `db` dibuat. File migrations terletak di:
- `docker/supabase/migrations/001_initial_schema.sql` - Schema dasar
- `docker/supabase/migrations/002_seed_data.sql` - Seed data
- `docker/supabase/migrations/003_add_password_and_sample_users.sql` - User samples
- `docker/supabase/migrations/004_verify_password_function.sql` - Password verification
- `docker/supabase/migrations/005_reset_clean_seed.sql` - Clean reset seed

### 4b. Jika Perlu Update Database Manual

Jika ada migration baru atau database tidak ter-seed dengan benar:

```powershell
// turbo
# Jalankan semua migrations secara berurutan
docker exec -i school-ai-db psql -U postgres -d school_ai -f /docker-entrypoint-initdb.d/001_initial_schema.sql
```

```powershell
// turbo
docker exec -i school-ai-db psql -U postgres -d school_ai -f /docker-entrypoint-initdb.d/002_seed_data.sql
```

```powershell
// turbo
docker exec -i school-ai-db psql -U postgres -d school_ai -f /docker-entrypoint-initdb.d/003_add_password_and_sample_users.sql
```

```powershell
// turbo
docker exec -i school-ai-db psql -U postgres -d school_ai -f /docker-entrypoint-initdb.d/004_verify_password_function.sql
```

```powershell
// turbo
docker exec -i school-ai-db psql -U postgres -d school_ai -f /docker-entrypoint-initdb.d/005_reset_clean_seed.sql
```

### 4c. Complete Reset Database

Jika ingin reset database sepenuhnya:

```powershell
# Stop & hapus volumes (HATI-HATI: semua data akan hilang!)
docker-compose down -v

// turbo
# Start ulang
docker-compose up -d
```

---

## Step 5: Verify Supabase Studio

1. Buka browser
2. Akses: **http://localhost:3333**
3. Verifikasi bisa melihat tables dan data

### Endpoints yang Tersedia:

| Service | URL | Keterangan |
|---------|-----|------------|
| Supabase Studio | http://localhost:3333 | Database GUI |
| Kong API Gateway | http://localhost:8000 | API Gateway |
| PostgreSQL | localhost:5432 | Direct DB Access |
| Auth (GoTrue) | http://localhost:9999 | Authentication |
| REST (PostgREST) | http://localhost:3001 | REST API |
| Realtime | http://localhost:4000 | WebSocket |

---

## Step 6: Start Frontend Development Server

```powershell
# Masuk ke root folder project
cd d:\Project\school-ai

// turbo
# Install dependencies (jika perlu)
npm install

// turbo
# Jalankan development server
npm run dev
```

Frontend akan berjalan di: **http://localhost:5173**

---

## 🎉 Done!

Aplikasi siap digunakan:
- **Frontend**: http://localhost:5173
- **Supabase Studio**: http://localhost:3333
- **API Gateway**: http://localhost:8000

---

## Troubleshooting

### Container tidak start

```powershell
// turbo
# Lihat logs untuk error
docker-compose logs
```

### Port sudah digunakan

```powershell
# Cek port yang bentrok
netstat -ano | findstr :5432

# Kill process (ganti PID dengan hasil dari command di atas)
taskkill /PID <PID> /F
```

### Database connection error

```powershell
// turbo
# Restart database container
docker-compose restart db
```

### Full Reset

```powershell
# Nuclear option - reset everything
docker-compose down -v
docker-compose up -d
```
