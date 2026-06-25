# 📚 JIU Library Attendance System

Sistem Presensi Kiosk Pintar dan Manajemen Anggota khusus dikembangkan untuk Perpustakaan JIU (Jakarta International University). Sistem ini dirancang dari nol menggunakan arsitektur PHP Native modern yang ringan, secepat kilat, dan dioptimalkan untuk performa tinggi pada *shared hosting* (seperti Hostinger).

---

## ✨ Fitur Utama

### 💻 1. Kiosk Pemindai Cerdas (Frontend)
- **Tampilan Premium**: Antarmuka 3D bergaya modern (Glassmorphism + Tailwind CSS).
- **Dual Mode**: Mendukung absensi anggota internal (Mahasiswa/Dosen/Staff JIU) via input ID/NIM, maupun pendaftaran tamu eksternal.
- **Kiosk Security Lock**: Layar pemindai dilengkapi fitur kunci layar otomatis (*Lock Screen*). Hanya pustakawan dengan PIN terenkripsi yang dapat membuka kunci layar.
- **Micro-Animations**: Transisi UI yang mulus didukung oleh Alpine.js.

### ⚙️ 2. Panel Admin (Backend)
- **Dashboard Statistik Real-time**: Memantau tren kunjungan berdasarkan *role* (Student, Lecturer, Staff, Tamu) dan *ranking* pengunjung terbanyak (Leaderboard).
- **Manajemen Anggota Lengkap**: Tambah, Edit, Hapus data civitas akademika JIU.
- **Filter Pintar & Ekspor Excel**: Rekapitulasi absensi otomatis per-semester atau per-rentang waktu dengan satu klik tombol (menggantikan perhitungan manual sepenuhnya).
- **Manajemen Hari Libur**: Pengaturan jam kerja khusus dan pemblokiran absensi di hari libur.
- **Optimasi Bulk Action**: Hapus/Tandai banyak data sekaligus (Bulk Checkbox).

### 🛡️ 3. Fitur Keamanan (Security Hardening)
Sistem ini menggunakan perlindungan industri modern:
- **XSS Protection**: Menangkal serangan *Cross-Site Scripting* menggunakan fungsi pelolosan karakter (*escapeHTML*).
- **Anti SQL-Injection**: 100% menggunakan arsitektur *PDO Prepared Statements*.
- **Password Hashing**: PIN Kiosk & Password Admin di-enkripsi secara mutlak menggunakan algoritma `Bcrypt`.
- **CSRF Tokens**: Mencegah eksploitasi form dari luar sistem.
- **Brute Force Limiter**: Delay pintar & blokir akun sementara jika terjadi tebakan *password/PIN* yang beruntun.

---

## 🛠️ Stack Teknologi Terapan

- **Backend**: PHP 8.x (Native / Vanilla PDO)
- **Database**: MySQL / MariaDB (Teroptimasi menggunakan *Indexing*)
- **Frontend / Styling**: Tailwind CSS (Kustomisasi JIU Colors)
- **Interaktivitas UI**: Alpine.js & Vanilla JavaScript
- **Pengekspor Data**: SheetJS (XLSX) 

---

## 🚀 Panduan Instalasi (Deployment)

Panduan ini ditujukan jika Anda ingin menjalankan sistem di *Localhost* (XAMPP) maupun *Shared Hosting* (Hostinger, cPanel, dll).

### 1. Kloning Repository
```bash
git clone https://github.com/LindungiLw/absensi_jiu_library.git
cd absensi_jiu_library
```

### 2. Pengaturan Database
1. Buka `phpMyAdmin` (atau *database manager* Anda).
2. Buat *database* baru, misalnya bernama `db_presensi`.
3. Lakukan **Import** file instalasi tabel-tabel SQL yang diperlukan (File `.sql` disimpan terpisah demi alasan keamanan repositori).

### 3. Pengaturan Koneksi (`koneksi.php`)
Demi keamanan rahasia (*secrets*), file konfigurasi utama **tidak disertakan** di GitHub. Anda harus menyiapkannya secara manual.
1. Masuk ke folder `presensi/config/`.
2. Buat file baru bernama `koneksi.php`.
3. Di dalam file tersebut, Anda perlu menuliskan *logic* standar PDO PHP untuk melakukan koneksi ke database Anda (mendefinisikan variabel `$host`, `$user`, `$pass`, dan `$dbname` lalu memasukkannya ke koneksi PDO). Jangan lupa mengatur zona waktu PHP dan MySQL ke `Asia/Jakarta` (`+07:00`) agar catatan waktu absensi tetap akurat.

### 4. Setup Panel Admin
> **PENTING:** Demi keamanan akses, folder `admin` diabaikan dari GitHub (tidak berstatus publik). Saat melakukan *deploy* ke Hosting, Anda wajib mengunggah (*upload*) folder `presensi/admin` dari *Localhost* Anda ke *File Manager* Hosting secara manual.

---

## 👨‍💻 Kontributor
Sistem ini khusus di-desain, dimigrasikan, dan dipelihara untuk kebutuhan pencatatan dan pelaporan otomatis di **Jakarta International University**. 

*Ditenagai dengan kebanggaan, desain yang elegan, dan performa tinggi.*
