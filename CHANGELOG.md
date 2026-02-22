# Changelog

## Version 3.0.0 - 2025-02-11

### 🎉 Major Restructuring

#### New Structure
- **Portal Utama (index.html)**: Halaman landing dengan 2 pilihan akses
  - Website Publik untuk pengunjung/pasien
  - Admin Panel untuk administrator (dengan login)

- **Website Publik (public-site.html)**: 
  - Menampilkan semua fitur publik tanpa akses admin
  - Layanan, galeri, booking, cek status, riwayat booking, notifikasi
  - Tombol "Portal" untuk kembali ke halaman utama

- **Admin Panel (admin-login.html & admin-panel.html)**:
  - Halaman login terpisah dengan username & password
  - Dashboard admin dengan statistik lengkap
  - Manajemen booking, layanan, galeri, pengaturan
  - Tombol logout untuk keluar dari sistem

#### Security Improvements
- ✅ Sistem autentikasi JWT dengan httpOnly cookies
- ✅ Password protection untuk admin panel
- ✅ Pemisahan akses publik dan admin
- ✅ Session management yang aman

#### Features
- ✅ Portal landing page dengan design modern
- ✅ Navigasi yang jelas antara publik dan admin
- ✅ Login form dengan toggle password visibility
- ✅ Auto-redirect jika tidak terautentikasi
- ✅ Logout functionality

#### Technical Changes
- Updated server.js untuk static file serving
- Added authentication endpoints (login, logout, verify)
- Improved routing structure
- Enhanced security middleware
- Better error handling

### Breaking Changes
- Admin panel sekarang memerlukan login
- URL struktur berubah:
  - `/` → Portal utama
  - `/public-site.html` → Website publik
  - `/admin-login.html` → Login admin
  - `/admin-panel.html` → Dashboard admin (protected)

### Migration Guide
1. Setup environment variables di `.env`
2. Pastikan database sudah ter-setup dengan user admin
3. Akses portal di `/` untuk memilih mode akses
4. Login menggunakan kredensial admin untuk akses panel

---

## Version 2.0.0 - Previous Release
- Initial booking system
- Service management
- Gallery management
- Notification system