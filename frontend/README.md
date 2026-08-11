# AgroWaste

> **"Mengubah Limbah Organik Peternakan Menjadi Kehidupan Baru — Aksi Nyata Ekonomi Sirkular & Reduksi Emisi Metana."**

Platform cerdas pengelolaan & marketplace sirkular limbah peternakan berbasis Next.js 15, Laravel 11 REST API, & PostgreSQL. Dibangun untuk menghubungkan peternak, pengolah pupuk, dan kurir logistik dalam mendaur ulang limbah, mendistribusikan pupuk berkualitas, serta menekan laju pemanasan global secara real-time.

---

## Live Demo

| Service | URL | Status |
|---|---|---|
| Frontend / Web App | [agrowaste.ubcloud.id](https://agrowaste.ubcloud.id) | ![Live](https://img.shields.io/badge/status-live-brightgreen) |
| Laravel REST API | [agrowaste.ubcloud.id/api/v1](https://agrowaste.ubcloud.id/api/v1) | ![Live](https://img.shields.io/badge/status-live-brightgreen) |

---

## Tentang Proyek

**AgroWaste** adalah platform ekonomi sirkular terpadu yang memfasilitasi transaksi dan pendistribusian limbah organik peternakan. Platform ini dirancang untuk menjawab tantangan krisis lingkungan dan membuka peluang ekonomi baru bagi komunitas peternak lokal di Indonesia.

### Problem Statement
- **Krisis Emisi Metana**: Pembusukan limbah kotoran ternak secara terbuka menghasilkan gas metana ($\text{CH}_4$) yang **28× lebih berbahaya daripada $\text{CO}_2$** terhadap pemanasan global.
- **Rantai Pasok Pupuk Terputus**: Kesulitan pengolah pupuk organik dalam memperoleh bahan baku kotoran ternak terverifikasi secara konsisten.
- **Tinggi Biaya Logistik**: Belum tersedianya penentuan armada logistik yang optimal untuk pengangkutan limbah volume besar.

### Solusi
Platform end-to-end yang menyatukan pasar limbah peternakan, kalkulasi armada pengiriman dinamis, keandalan keamanan berstandar enterprise dengan **Google Authenticator 2FA**, serta kalkulator transparansi dampak lingkungan real-time berbasis standar IPCC & US EPA.

---

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| **Marketplace Sirkular** | Katalog limbah organik peternakan terverifikasi (Sapi, Ayam, Kambing, Domba, Kuda, Babi) |
| **Logistik Dinamis** | Kalkulasi otomatis armada kurir (Motor maks 25 kg & Pick-up maks 700 kg/armada) |
| **Enterprise 2FA Security** | Autentikasi dua langkah dengan Google Authenticator (TOTP RFC 6238 + Scan QR Code) |
| **Impact Calculator** | Transparansi reduksi emisi metana ($\text{CO}_2\text{e}$), kesetaraan pohon, dan dampak lingkungan |
| **Galeri Lencana 3D** | Sistem apresiasi lencana dampak 3D kustom (Petani Hijau, Agen Iklim, Pahlawan Bumi, Master Alkemis) |
| **Dashboard Multirole** | Panel kontrol terpisah untuk Pembeli, Penjual (Peternak), Kurir, dan Administrator |

---

## Arsitektur

```
┌─────────────────────────┐      ┌─────────────────────────┐      ┌─────────────────────────┐
│     Next.js 15          │      │   Laravel 11 REST API   │      │   PostgreSQL Database   │
│   React 19 Frontend     │─────▶│   Backend Service       │─────▶│   Server 18.0 (64-bit)  │
│   :3000                 │      │   :8000                 │      │                         │
└─────────────────────────┘      └─────────────────────────┘      └─────────────────────────┘
             │                                │
             ▼                                ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│  Google Authenticator   │      │   Token Authentication  │
│  TOTP 2FA (RFC 6238)    │      │   Bearer Token Header   │
└─────────────────────────┘      └─────────────────────────┘
```

---

## Tech Stack

**Frontend**
- Next.js 15.5 (App Router), React 19, TypeScript 5.0 (98% Type-Safe)
- Tailwind CSS v4, Lucide Icons, Vanilla CSS Design System

**Backend & API**
- Laravel 11 (PHP 8.3) RESTful API Service
- Next.js API Routes (Internal Services & 2FA Engine)
- Token-Based Bearer Authentication Header

**Database & Security**
- PostgreSQL 18.0 (64-bit)
- TOTP RFC 6238 (Google Authenticator Engine) & QuickChart QR API
- Automatic JSX Escaping (XSS Protection)

**Infrastructure**
- Vercel Platform / Node.js & PHP Server Environment
- Git, GitHub Actions

---

## Struktur Project

```
agrowaste/
├── src/
│   ├── app/                    # Next.js App Router (Pages & API Routes)
│   │   ├── (auth)/             # Login, Register, Role Selection
│   │   ├── (public)/           # Landing, Marketplace, Cart, Impact, Profile
│   │   ├── admin/              # Admin Dashboard, Logistics, Users, Listings
│   │   ├── courier/            # Courier Shipments, Payments, Impact
│   │   ├── seller/             # Seller Inventory, Badges, Analytics, Orders
│   │   └── api/                # REST API Endpoints (2FA, Auth, Dashboard)
│   ├── components/             # Reusable React UI Components
│   │   ├── admin/              # Admin Components
│   │   ├── common/             # Common Shared Modals (TwoFactorModal.tsx)
│   │   ├── courier/            # Courier Components
│   │   ├── public/             # Public Header, Footer, Earthy Cards
│   │   └── seller/             # Seller Components
│   ├── lib/                    # Core Libraries (api.ts, auth.ts, totp.ts, location.ts)
│   └── types/                  # TypeScript Interface Definitions
├── public/                     # Static Assets & 3D Badges Images
├── package.json
└── tsconfig.json
```

---

## Quick Start

### Prerequisites
- Node.js 18+ / 20+
- PHP 8.3+ & Composer (Laravel Backend)
- PostgreSQL 16+ / 18+
- npm / yarn / pnpm

### 1. Clone & Setup
```bash
git clone https://github.com/arumsalsa/AgroWaste.git
cd agrowaste
```

### 2. Install Dependensi Frontend
```bash
npm install
```

### 3. Jalankan Frontend (Next.js)
```bash
npm run dev
```

### 4. Verifikasi Tipe Kode (Type Check)
```bash
npx tsc --noEmit
```

### 5. Akses Aplikasi
- Web Dashboard: http://localhost:3000
- Halaman Laporan Dampak: http://localhost:3000/impact

---

## API Endpoints

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Login pengguna & penerbitan Bearer Token |
| `POST` | `/api/auth/2fa/setup` | Generate Secret Key Base32 & QR Code 2FA |
| `POST` | `/api/auth/2fa/verify` | Verifikasi 6-digit TOTP Google Authenticator |
| `GET` | `/api/v1/dashboard/impact` | Data transparansi dampak lingkungan real-time |
| `GET` | `/api/v1/marketplace/products` | Daftar produk limbah & pupuk terolah |
| `POST` | `/api/v1/orders` | Pembuatan pesanan & penentuan armada kurir |

---

## Roadmap

- [ ] Integrasi IoT Sensor Kadar Kelembaban & Nutrisi Kotoran Ternak
- [ ] Peta Pemetaan Spasial Real-time Rute Kurir Berbasis GIS
- [ ] Notifikasi Otomatis Status Penjemputan via WhatsApp Gateway
- [ ] Dukungan Bahasa Internasional (Multi-language Support)

---

## Lisensi

Dibangun untuk **OLIVIA XI UNESA 2026 — Web Technology**.

---

<div align="center">
  <strong>AgroWaste — Circular Economy for Sustainable Farming</strong><br/>
  <a href="https://agrowaste.ubcloud.id">Live Demo Server UB Cloud</a> •
  <a href="https://agrowaste.ubcloud.id/impact">Laporan Dampak</a>
</div>
