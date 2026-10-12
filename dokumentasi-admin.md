# Panduan Penggunaan Sistem - Role Administrator

Dokumen ini berisi panduan lengkap penggunaan fitur-fitur yang tersedia untuk role **Administrator** di aplikasi School AI.

## Daftar Isi
1. [Dashboard](#1-dashboard)
2. [Manajemen Pengguna](#2-manajemen-pengguna-users)
3. [Data Master](#3-data-master)
4. [Jadwal Pelajaran](#4-jadwal-pelajaran)
5. [Laporan & Statistik](#5-laporan--statistik)
6. [Pengaturan Sistem](#6-pengaturan-sistem)

---

## 1. Dashboard
Halaman utama yang muncul setelah login. Dashboard memberikan gambaran umum kondisi sekolah.

**Fitur Utama:**
- **Statistik Cepat**: Jumlah siswa aktif, guru, kelas, dan persentase kehadiran hari ini.
- **Grafik Mingguan**: Memantau tren kehadiran siswa selama 7 hari terakhir.
- **Aktivitas Terbaru**: Log aktivitas penting yang terjadi dalam sistem (misal: siswa baru ditambahkan, jadwal diubah).
- **Menu Cepat**: Tombol pintas ke fitur yang sering digunakan (Tambah Siswa, Buat Jadwal, Laporan).

---

## 2. Manajemen Pengguna (Users)
Menu untuk mengelola akun pengguna sistem. Terbagi menjadi beberapa sub-menu berdasarkan peran:

### a. Siswa
Mengelola data seluruh siswa.
- **Tambah Siswa**: Klik tombol "Tambah Siswa" untuk input manual satu per satu.
- **Import Excel**: Gunakan tombol "Import Excel" untuk menambahkan banyak siswa sekaligus. Template Excel sudah disediakan di dalam menu import.
  > **Catatan Penting**: Saat import, sistem akan otomatis membuat akun untuk orang tua (Wali Murid) jika data wali diisi.
- **Filter & Pencarian**: Cari siswa berdasarkan nama, NIS, atau kelas.
- **Kenaikan Kelas**: Gunakan fitur ini di akhir tahun ajaran untuk memindahkan siswa ke tingkat selanjutnya secara massal.

### b. Guru
Mengelola data pengajar.
- **Tambah Guru**: Input nama, email, dan password.
- **Penugasan Wali Kelas**: Guru yang dibuat di sini nantinya bisa dipilih sebagai Wali Kelas di menu [Data Master](#3-data-master).
- **Status Kepegawaian**: Dapat mengatur status aktif/non-aktif guru.

### c. Staff TU & Admin
Mengelola akun staff Tata Usaha dan Administrator lainnya.
- **Role Admin**: Memiliki akses penuh ke seluruh sistem.
- **Role TU**: Memiliki akses khusus ke modul Keuangan dan Administrasi, namun terbatas pada pengaturan sistem inti.

---

## 3. Data Master
Menu inti untuk mengatur referensi data sekolah.

### a. Data Kelas
- **Tambah/Edit Kelas**: Mengatur nama kelas, tingkat, jurusan, dan **Wali Kelas**.
- **Lihat Siswa**: Klik pada angka jumlah siswa atau nama kelas untuk melihat daftar detail siswa yang terdaftar di kelas tersebut tanpa harus berpindah ke menu Users.

### b. Mata Pelajaran
- Mengatur daftar mata pelajaran, kode mapel, dan KKM.
- Pastikan kode mapel unik untuk memudahkan pendataan.

### c. Tahun Ajaran
- Mengatur periode akademik (misal: 2025/2026 Ganjil).
- **Status Aktif**: Hanya satu tahun ajaran yang boleh aktif dalam satu waktu. Mengganti tahun ajaran aktif akan mempengaruhi seluruh sistem (presensi, jadwal, dll).

### d. Ekstrakurikuler
- Menambah daftar kegiatan ekstrakurikuler yang tersedia di sekolah.

---

## 4. Jadwal Pelajaran
Fitur (Schedule Builder) untuk menyusun jadwal KBM.

**Cara Penggunaan:**
1. **Pilih Mode Tampilan**: "Per Kelas" atau "Per Guru" untuk memudahkan pengecekan.
2. **Tambah Jadwal**:
   - Klik slot kosong pada grid, atau tombol "Tambah Manual".
   - Pilih Kelas, Mata Pelajaran, Guru, Hari, dan Jam.
   - Sistem akan otomatis mengecek **Bentrok Jadwal**.
3. **Pendeteksi Konflik**:
   - Jika guru sedang mengajar di kelas lain pada jam yang sama, sistem akan menolak dan memberikan peringatan.
   - Jika ruangan (Lab/Perpus) sudah terpakai, sistem juga akan memberi peringatan.

> **Tips**: Gunakan tampilan "Per Guru" untuk memastikan seorang guru tidak memiliki jadwal yang tumpang tindih.

---

## 5. Laporan & Statistik
Pusat data untuk evaluasi sekolah.

- **Filter Laporan**: Pilih rentang tanggal dan kelas spesifik untuk melihat laporan.
- **Statistik Kehadiran**: Grafik kehadiran, izin, sakit, dan alpha.
- **Export Data**:
  - **Export Data Kelas**: Rekapitulasi persentase kehadiran per kelas.
  - **Export Data Siswa**: Detail kehadiran per individu siswa (Format Excel/CSV).

---

## 6. Pengaturan Sistem
Konfigurasi identitas sekolah dan preferensi aplikasi.

### a. Informasi Sekolah
- Nama Sekolah, Alamat, Kontak, dan Kepala Sekolah.
- **Upload Logo**: Mengganti logo sekolah yang tampil di kop laporan dan pojok kiri atas aplikasi.

### b. Tahun Ajaran Sistem
- Shortcut untuk mengganti tahun ajaran aktif dengan cepat.

### c. Notifikasi
Mengatur notifikasi otomatis (Email/WhatsApp) untuk:
- Absensi Harian (dikirim ke Orang Tua).
- Laporan Mingguan.
- Peringatan Alpha/Bolos (jika siswa tidak hadir tanpa keterangan > 3 hari).

---

**Butuh Bantuan Teknis?**
Jika mengalami kendala teknis atau error sistem, silakan hubungi tim IT Support atau developer melalui kontak yang tersedia di dashboard.
