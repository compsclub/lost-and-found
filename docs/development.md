# Development guide

Panduan singkat untuk menjalankan dan mengembangkan Lost and Found Website di mesin lokal.

## Prasyarat

- Node.js 22 atau lebih baru
- pnpm 12
- Docker (untuk database PostgreSQL)

## Setup pertama kali

```bash
pnpm install
cp .env.example .env
docker compose -f db/compose.yml up -d
pnpm db:migrate
pnpm db:seed
```

`pnpm install` menjalankan `prisma generate` secara otomatis lewat `postinstall`.

## Menjalankan saat pengembangan

```bash
pnpm dev
```

Dua proses berjalan bersamaan:

| Proses | Alamat |
| --- | --- |
| API Express | `http://localhost:3100/api/v1` |
| Frontend Vite | `http://localhost:5273` |

Vite mem-proxy `/api/v1` ke API, jadi frontend cukup memanggil path relatif tanpa konfigurasi CORS tambahan.

Port `3100`, `5273`, dan `55432` dipilih karena `3000`, `5173`, dan `5432` sudah dipakai layanan lain di host pengembangan. Ubah lewat `.env` bila perlu.

## Struktur direktori

```text
core/          Express API (config, routes, validation, Prisma repository)
src/           React frontend (sengaja dikosongkan untuk Frontend Developer)
prisma/        Schema, migration, dan seed
tests/         Vitest: tests/api dan tests/mock (fixture kontrak)
db/            docker compose untuk PostgreSQL lokal
docs/          Kontrak REST API dan desain database
```

## Status frontend

Folder `src/` sengaja dikosongkan supaya Frontend Developer bisa menyusun struktur komponennya sendiri. Backend, database, dan kontrak API sudah siap dipakai.

Yang sudah tersedia untuk frontend:

- API berjalan di `http://localhost:3100/api/v1` dan sudah diproxy oleh Vite pada path `/api/v1`.
- Vite, React, dan konfigurasi proxy ada di `vite.config.js`; tidak perlu mengubah apa pun untuk mulai.
- Mock data kontrak ada di `tests/mock/` sebagai acuan bentuk respons.

Yang perlu ditambahkan oleh Frontend Developer:

1. Entry point React, lalu daftarkan module script-nya di `index.html` pada elemen `#root`.
2. Struktur komponen dan styling. Proyek ini memakai CSS Modules (`*.module.css`); hindari CSS global kecuali reset dan variabel dasar.
3. Halaman Report Listing, Report Detail, dan Report Submission sesuai `docs/rest-api.md`.

## Perintah berguna

| Perintah | Fungsi |
| --- | --- |
| `pnpm dev` | API dan frontend sekaligus |
| `pnpm check` | Biome + seluruh test |
| `pnpm test` | Vitest sekali jalan |
| `pnpm build` | Build frontend ke `dist/client` |
| `pnpm db:migrate` | Buat dan terapkan migration baru |
| `pnpm db:seed` | Isi database dari `tests/mock/reports.seed.json` |
| `pnpm db:studio` | Buka Prisma Studio |

`pnpm build` saat ini hanya menghasilkan `index.html` kosong sampai entry point frontend ditambahkan.

## Catatan implementasi

- Proyek memakai JavaScript murni (tanpa TypeScript).
- Semua styling frontend memakai CSS Modules (`*.module.css`).
- Validasi request memakai Zod di `core/validation.js`; aturan yang bergantung pada data (`other` untuk kategori dan lokasi) diperiksa di `core/routes.js` setelah lookup database.
- Test API berjalan terhadap database sungguhan, bukan mock. Jalankan `pnpm db:migrate` dan `pnpm db:seed` lebih dulu.
