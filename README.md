# Lost and Found Website

Aplikasi web untuk mencatat dan mencari barang hilang di lingkungan Fakultas Ilmu Komputer Universitas Indonesia. Siapa pun dapat menelusuri laporan yang sudah dipublikasikan, atau membuat laporan baru agar barang kembali ke pemiliknya.

## Fitur

- **Daftar laporan publik** dengan pencarian nama barang, filter jenis/kategori/lokasi, dan pagination. Semua penyaringan dikerjakan di sisi server.
- **Detail laporan** berisi kategori, lokasi, deskripsi, tanggal kejadian, dan satu metode kontak pelapor agar penemu bisa menghubungi.
- **Formulir laporan** untuk barang hilang maupun ditemukan, dengan validasi di sisi klien dan server.
- **Data referensi dari database**: pilihan kategori dan lokasi diambil dari API, jadi menambah data di database langsung muncul di formulir tanpa mengubah kode.

## Menjalankan aplikasi

Prasyarat: Node.js 22 atau lebih baru, pnpm 12, dan database PostgreSQL.

```bash
cp .env.example .env   # konfigurasi lebih dulu
pnpm install
```

Siapkan database, lalu jalankan aplikasi:

```bash
pnpm dev:db && pnpm db:deploy && pnpm db:seed   # database sekali pakai dari Prisma
pnpm dev
```

`pnpm dev` menjalankan dua proses sekaligus: API Express di <http://localhost:3100/api/v1> dan frontend Vite di <http://localhost:5273>. Vite mem-proxy `/api/v1` ke API, sehingga tidak perlu konfigurasi CORS tambahan.

Panduan lengkap termasuk pilihan database dan penyajian build ada di [docs/development.md](docs/development.md).

## Konfigurasi

Nilai di bawah diambil dari `.env`; `.env.example` sudah berisi nilai bawaan yang bisa langsung dipakai.

| Variabel | Bawaan | Fungsi |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://lostfound:lostfound_dev@localhost:55432/lostfound` | Koneksi PostgreSQL untuk API dan Prisma. |
| `PORT` | `3100` | Port API Express. |
| `FRONTEND_ORIGIN` | `http://localhost:5273` | Origin yang diizinkan CORS. Beberapa origin dipisahkan koma. |
| `PREVIEW_PORT` | `8080` | Port server build statis. |
| `API_TARGET` | `http://127.0.0.1:3100` | Tujuan proxy `/api/v1` pada server build statis. |

## API

Seluruh endpoint berada di bawah `/api/v1`:

| Endpoint | Fungsi |
| --- | --- |
| `GET /reports` | Daftar laporan dengan `q`, `type`, `category`, `location`, `page`, `limit`. |
| `GET /reports/:id` | Detail satu laporan, termasuk kontak publik. |
| `POST /reports` | Membuat laporan baru. |
| `GET /categories` | Daftar kategori untuk filter dan formulir. |
| `GET /locations` | Daftar lokasi, termasuk `other`. |
| `GET /health` | Status layanan. |

Bentuk request dan response beserta kode error dijelaskan di [docs/rest-api.md](docs/rest-api.md).

## Pengembangan

```bash
pnpm dev        # API dan frontend sekaligus
pnpm check      # Biome, typecheck, dan seluruh test
pnpm test       # test saja
pnpm build      # build API ke dist/core dan frontend ke dist/client
```

Test API berjalan terhadap database sungguhan, bukan mock, jadi siapkan database dan jalankan `pnpm db:deploy && pnpm db:seed` lebih dulu.

Struktur proyek:

| Direktori | Isi |
| --- | --- |
| `core/` | API Express: routing, validasi, repository Prisma. |
| `src/` | Frontend React: halaman, komponen, dan helper. |
| `prisma/` | Schema, migration, dan seed. |
| `tests/` | Vitest: `tests/api`, `tests/client`, dan fixture di `tests/mock`. |
| `preview/` | Server build statis yang mem-proxy `/api/v1`. |
| `db/` | Docker Compose untuk PostgreSQL lokal. |
| `docs/` | Kontrak REST API, desain database, dan panduan pengembangan. |

## Deployment

Build produksi memisahkan berkas statis dan API:

```bash
pnpm build
pnpm start          # API di :3100
pnpm preview:serve  # berkas statis di :8080, /api/v1 diproxy ke :3100
```

`preview/server.ts` menyajikan `dist/client` dan meneruskan `/api/v1` ke `API_TARGET`, sehingga browser hanya melihat satu origin. Express sendiri tetap API saja dan tidak menyajikan berkas statis; reverse proxy produksi cukup mengarahkan `/` ke berkas statis dan `/api/v1` ke Express.

## Dokumentasi

- [docs/rest-api.md](docs/rest-api.md) — kontrak REST API.
- [docs/database-design.md](docs/database-design.md) — desain database dan aturan datanya.
- [docs/development.md](docs/development.md) — setup, perintah, dan catatan implementasi.

## Anggota

- Taruna Prasetya / 2606888521 — Backend Developer
- Aqila Callista Khansa / 2606733204 — Frontend Developer

## Hak cipta

Proyek ini dilisensikan di bawah MIT License. Lihat [LICENSE](LICENSE) untuk teks lisensi secara penuh.

Seluruh kontribusi, baik dari anggota tim maupun kontributor lain, tunduk pada MIT License yang sama. Dengan berkontribusi, kontributor menyetujui bahwa kontribusinya dilisensikan di bawah MIT License.
