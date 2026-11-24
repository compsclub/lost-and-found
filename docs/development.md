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
src/           React frontend (halaman, komponen, helper API dan validasi)
preview/       Server preview: menyajikan build statis dan mem-proxy /api/v1
prisma/        Schema, migration, dan seed
tests/         Vitest: tests/api, tests/client, dan tests/mock (fixture kontrak)
db/            docker compose untuk PostgreSQL lokal
docs/          Kontrak REST API dan desain database
```

## Frontend

Frontend adalah aplikasi React yang memanggil API sungguhan; tidak ada lagi penyimpanan lokal.

| Halaman | Route | Sumber data |
| --- | --- | --- |
| Daftar laporan | `/` | `GET /reports` dengan pencarian, filter, dan pagination |
| Detail laporan | `/report/:id` | `GET /reports/:id` |
| Buat laporan | `/new` | `POST /reports` |

Kategori dan lokasi diambil dari `GET /categories` dan `GET /locations`, jadi menambah data di database langsung muncul di formulir.

`src/lib/api.ts` adalah satu-satunya lapisan yang menyentuh jaringan. Base URL relatif (`/api/v1`), sehingga browser, Vite, dan preview semuanya bekerja tanpa konfigurasi CORS.

Styling memakai CSS Modules (`*.module.css`); `src/styles/global.css` hanya berisi reset dan token.

## Perintah berguna

| Perintah | Fungsi |
| --- | --- |
| `pnpm dev` | API dan frontend sekaligus |
| `pnpm check` | Biome + seluruh test |
| `pnpm test` | Vitest sekali jalan |
| `pnpm build` | Typecheck, lalu build API ke `dist/core` dan frontend ke `dist/client` |
| `pnpm start` | Jalankan API hasil build |
| `pnpm preview:serve` | Sajikan `dist/client` dan proxy `/api/v1` ke API |
| `pnpm db:migrate` | Buat dan terapkan migration baru |
| `pnpm db:seed` | Isi database dari `tests/mock/reports.seed.json` |
| `pnpm db:studio` | Buka Prisma Studio |

## Menyajikan build statis

Build produksi memisahkan dua hal: berkas statis dan API.

```bash
pnpm build
pnpm start          # API di :3100
pnpm preview:serve  # berkas statis di :8080, /api/v1 diproxy ke :3100
```

`preview/server.ts` menyajikan `dist/client` dan meneruskan `/api/v1` ke `API_TARGET` (default `http://127.0.0.1:3100`), sehingga browser hanya melihat satu origin. Express sendiri tetap API saja dan tidak menyajikan berkas statis, jadi reverse proxy produksi cukup mengarahkan `/` ke berkas statis dan `/api/v1` ke Express.

Aset ber-hash di `dist/client/assets` bersifat immutable; path lain jatuh ke `index.html` supaya route React Router tetap bekerja saat di-refresh.

## Catatan implementasi

- Proyek memakai TypeScript untuk API, frontend, dan test.
- Semua styling frontend memakai CSS Modules (`*.module.css`).
- Validasi request memakai Zod di `core/validation.ts`; aturan yang bergantung pada data (`other` untuk kategori dan lokasi) diperiksa di `core/routes.ts` setelah lookup database.
- Test API berjalan terhadap database sungguhan, bukan mock. Jalankan `pnpm db:migrate` dan `pnpm db:seed` lebih dulu.
- `tests/client` menguji helper dan validasi frontend tanpa jaringan; `tests/api/client-contract.test.ts` memastikan bentuk respons API sesuai yang dibaca frontend.
- Cloudinary belum diintegrasikan; `imageUrl` selalu `null` untuk saat ini.
