# Overview - NodeWave Backend Assessment

## Tentang Proyek

Proyek ini adalah sistem Backend API untuk **NodeWave Back End Candidate Assessment**. Sistem ini dirancang untuk memproses dan memparsing data Excel dalam jumlah besar secara efisien dengan menggunakan mekanisme background processing.

## Tujuan Utama

Membangun sistem yang mampu:
1. **Menerima upload file** dari pengguna
2. **Memproses file Excel** di background (non-blocking)
3. **Menyimpan data** ke database MySQL
4. **Melacak status** pemrosesan file
5. **Mendukung retry mechanism** untuk proses yang gagal
6. **Menyediakan API** yang terautentikasi dengan JWT

## Fitur Wajib

### 1. Autentikasi
- Sistem login menggunakan JWT (JSON Web Token)
- Protected routes untuk endpoint yang memerlukan autentikasi

### 2. Upload & Processing File
- Upload file Excel dari client
- Simpan file atau gunakan URL untuk processing
- Background job processing (tidak fire-and-forget)
- Status tracking: `PENDING` → `IN_PROGRESS` → `SUCCESS` / `FAILED`

### 3. Database Operations
- Menyimpan hasil parsing Excel ke MySQL
- Data dapat berupa: users, products, sales, atau data lainnya

### 4. Monitoring & Retry
- Endpoint untuk melihat status proses
- Retry mechanism untuk job yang gagal
- List file dengan filter dan pagination

## Arsitektur High-Level

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Client    │────▶│   API GW    │────▶│  Auth Service   │
│  (Upload)   │     │   (Express) │     │    (JWT)        │
└─────────────┘     └─────────────┘     └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  File Handler   │
                    │  (Save/URL)     │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Job Queue      │
                    │  (Background)   │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  Excel Parser   │
                    │  (Process Data) │
                    └─────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     MySQL       │
                    │   (Database)    │
                    └─────────────────┘
```

## Repository Structure

Proyek ini menggunakan **Monorepo** structure yang akan berisi:
- `apps/api` - Backend API (Node.js/Express + TypeScript)
- `apps/web` - Frontend (akan ditambahkan nanti)
- `packages/shared` - Shared utilities dan types

## Link Referensi

- **Base Repository**: GitHub - Nodewave Backend Base Repository
- **UI Design**: Figma - Visual Representation
- **Documentation**: Notion - Pagination and Filtering Guide

## Tim Review

Invite sebagai collaborator di private repository:
- rizqyep
- Mkput
- nodewavescout

## Deliverables

1. ✅ Backend API dengan fitur lengkap
2. ✅ Postman Collection (contoh request & response)
3. ✅ Dokumentasi kode
4. ✅ Private GitHub Repository

---

**Catatan**: Baca dokumen lainnya untuk detail teknis lebih lanjut:
- `2-struktur-folder.md` - Struktur folder modular
- `3-tech-stack.md` - Daftar teknologi yang digunakan
- `4-alur-sistem.md` - Alur dan mekanisme sistem
- `5-instalasi.md` - Panduan setup dan instalasi
