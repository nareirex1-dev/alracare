# 🏥 Alra Care Clinic - Navigation Flow

## 📋 Urutan Buka Web

### 1. **Entry Point: Portal Utama** (`/`)
- **File**: `portal.html`
- **URL**: `https://alra02.vercel.app`
- **Fungsi**: Halaman pilihan utama antara Portal Publik dan Portal Admin

### 2. **Pilihan Navigasi dari Portal Utama**:

#### **A. Portal Publik** (`/public-site`)
- **File**: `public-site.html`
- **URL**: `https://alra02.vercel.app/public-site`
- **Fungsi**: Website publik untuk:
  - Melihat layanan klinik
  - Booking appointment
  - Cek riwayat booking
  - Notifikasi booking

#### **B. Portal Admin** (`/admin-login`)
- **File**: `admin-login.html`
- **URL**: `https://alra02.vercel.app/admin-login`
- **Fungsi**: Halaman login admin
- **Redirect setelah login**: `/admin` → `admin-panel.html`

## 🔄 Flow Navigasi Lengkap

```
🌐 https://alra02.vercel.app
    ↓
🏠 portal.html (Halaman Pilihan)
    ↓
├── 📱 public-site.html (Portal Publik)
│   ├── Layanan & Booking
│   ├── Riwayat Booking
│   └── Notifikasi
│
└── 🔐 admin-login.html (Login Admin)
    ↓ (setelah login berhasil)
    └── ⚙️ admin-panel.html (Panel Admin)
        ├── Kelola Booking
        ├── Kelola Layanan
        ├── Kelola Galeri
        └── Pengaturan Sistem
```

## ⚙️ Routing Configuration (vercel.json)

```json
{
  "rewrites": [
    { "source": "/", "destination": "/portal.html" },
    { "source": "/admin-login", "destination": "/admin-login.html" },
    { "source": "/admin", "destination": "/admin-panel.html" },
    { "source": "/public-site", "destination": "/public-site.html" },
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/:path*", "destination": "/portal.html" }
  ]
}
```

## ✅ Status Navigasi

- ✅ **Portal Utama** (`portal.html`) - Entry point
- ✅ **Routing Vercel** - Dikonfigurasi dengan benar
- ✅ **Navigasi ke Public Site** - Berfungsi
- ✅ **Navigasi ke Admin Login** - Berfungsi
- ✅ **Redirect setelah login admin** - Berfungsi

## 🚀 Cara Menggunakan

1. **Akses**: `https://alra02.vercel.app`
2. **Pilih**: Portal Publik atau Portal Admin
3. **Navigasi**: Ikuti flow sesuai kebutuhan

---

**📞 Support**: Jika ada masalah navigasi, hubungi tim development.</content>
<parameter name="filePath">d:\rexsa\codex\New folder\alra02\NAVIGATION_FLOW.md