# REST API Contract

Dokumen ini menetapkan kontrak publik antara frontend React dan backend Express untuk Lost and Found Website. Kontrak ini adalah acuan mock data pada Checkpoint 1, API in-memory pada Checkpoint 2, dan API PostgreSQL/Cloudinary pada Checkpoint 3.

## Konvensi umum

- Base URL saat pengembangan adalah `http://localhost:3000/api/v1`. Base URL produksi akan dipublikasikan setelah backend dideploy.
- Semua endpoint mengembalikan JSON dengan `Content-Type: application/json`, kecuali request unggah foto yang menggunakan `multipart/form-data`.
- Semua waktu memakai ISO 8601 UTC, misalnya `2026-11-16T08:30:00.000Z`.
- ID memakai UUID. Nilai enum selalu huruf besar.
- Rute di bawah ditulis relatif terhadap `/api/v1`; misalnya `GET /reports` berarti `GET /api/v1/reports`.
- Laporan bersifat publik dan tidak memerlukan autentikasi. API publik ini sengaja tidak menyediakan endpoint edit atau hapus agar pengunjung tidak dapat mengubah atau menghapus laporan secara sewenang-wenang.

Respons berhasil menggunakan properti `data`.

```json
{
  "data": {}
}
```

Respons gagal menggunakan bentuk berikut.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some input fields are invalid."
  }
}
```

`details` hanya dikirim untuk kesalahan validasi. Backend tidak boleh menyertakan stack trace, detail Cloudinary, atau nilai kontak pada respons error.

## Model JSON publik

### Ringkasan laporan

Objek ini dipakai pada daftar laporan.

```json
{
  "id": "d90eb074-6607-4c0a-8fec-995bd93b9d6",
  "reportType": "LOST",
  "itemName": "Tumbler hitam",
  "category": {
    "id": "db5eb9fd-73d8-4c2e-86e2-9a34ac94fdca",
    "slug": "bottle",
    "name": "Botol minum"
  },
  "location": {
    "id": "eb3f0895-f5f2-4e18-9e16-19596e8b1351",
    "slug": "fasilkom-a-building",
    "name": "Gedung A Fasilkom UI"
  },
  "locationDetail": "Ruang A206",
  "imageUrl": null,
  "createdAt": "2026-11-16T08:30:00.000Z"
}
```

`location` selalu berasal dari tabel lokasi predefined. `locationDetail` dapat bernilai `null` atau menyimpan rincian tambahan, misalnya lantai atau nomor ruangan. Untuk lokasi dengan slug `other`, `locationDetail` wajib diisi dengan nama lokasi kustom pelapor, misalnya `Kantin Fakultas Teknik, dekat pintu timur`. `imageUrl` bernilai `null` jika pelapor tidak mengunggah foto. Frontend harus menampilkan placeholder lokal pada kondisi tersebut, bukan menganggap URL kosong sebagai gambar rusak.

### Detail laporan

`GET /reports/:id` dan respons sukses `POST /reports` memakai objek berikut. Hanya satu metode kontak yang dipilih pelapor yang dikembalikan dalam `publicContact`.

```json
{
  "id": "d90eb074-6607-4c0a-8fec-995bd93b9d6",
  "reportType": "LOST",
  "itemName": "Tumbler hitam",
  "category": {
    "id": "db5eb9fd-73d8-4c2e-86e2-9a34ac94fdca",
    "slug": "bottle",
    "name": "Botol minum"
  },
  "categoryOther": null,
  "description": "Tumbler hitam 600 ml dengan stiker kucing di bagian bawah.",
  "location": {
    "id": "eb3f0895-f5f2-4e18-9e16-19596e8b1351",
    "slug": "fasilkom-a-building",
    "name": "Gedung A Fasilkom UI"
  },
  "locationDetail": "Ruang A206",
  "occurredAt": "2026-11-16T05:00:00.000Z",
  "imageUrl": null,
  "publicContact": {
    "method": "WHATSAPP",
    "value": "+6281234567890"
  },
  "createdAt": "2026-11-16T08:30:00.000Z"
}
```

Nilai `reportType` adalah `LOST` atau `FOUND`. Nilai `publicContact.method` adalah `EMAIL`, `PHONE`, atau `WHATSAPP`.

## Endpoints

### `GET /reports`

Mengambil daftar laporan publik dengan pencarian, filter, dan pagination. Laporan diurutkan dari yang paling baru secara default.

| Parameter query | Tipe | Wajib | Perilaku |
| --- | --- | --- | --- |
| `q` | string | Tidak | Pencarian case-insensitive pada nama barang. Spasi awal/akhir diabaikan. Maksimum 100 karakter. |
| `type` | `LOST` atau `FOUND` | Tidak | Menyaring jenis laporan. |
| `category` | string | Tidak | Slug kategori, misalnya `electronics`. |
| `location` | string | Tidak | Slug lokasi predefined, termasuk `other`; misalnya `fasilkom-a-building` atau `other`. |
| `page` | integer | Tidak | Nomor halaman, minimum `1`, default `1`. |
| `limit` | integer | Tidak | Jumlah item per halaman, minimum `1`, maksimum `50`, default `12`. |

Contoh request:

```http
GET /api/v1/reports?q=charger&type=LOST&category=electronics&location=fasilkom-a-building&page=1&limit=12
```

Contoh respons `200 OK`:

```json
{
  "data": [
    {
      "id": "d90eb074-6607-4c0a-8fec-995bd93b9d6",
      "reportType": "LOST",
      "itemName": "Charger laptop ASUS",
      "category": {
        "id": "db5eb9fd-73d8-4c2e-86e2-9a34ac94fdca",
        "slug": "electronics",
        "name": "Elektronik"
      },
      "location": {
        "id": "eb3f0895-f5f2-4e18-9e16-19596e8b1351",
        "slug": "fasilkom-a-building",
        "name": "Gedung A Fasilkom UI"
      },
      "locationDetail": "Dekat stop kontak ruang A101",
      "imageUrl": "https://res.cloudinary.com/example/image/upload/v1/lost-found/charger.jpg",
      "createdAt": "2026-11-16T08:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Status yang mungkin:

| Status | Kode error | Arti |
| --- | --- | --- |
| `200` | - | Daftar laporan berhasil diambil; `data` dapat berupa array kosong. |
| `400` | `VALIDATION_ERROR` | Parameter query tidak valid, misalnya `page=0` atau `type=MISSING`. |
| `500` | `INTERNAL_ERROR` | Kesalahan server yang tidak diperkirakan. |

### `GET /reports/:id`

Mengambil detail satu laporan publik berdasarkan UUID.

Contoh request:

```http
GET /api/v1/reports/d90eb074-6607-4c0a-8fec-995bd93b9d6
```

Contoh respons `200 OK`:

```json
{
  "data": {
    "id": "d90eb074-6607-4c0a-8fec-995bd93b9d6",
    "reportType": "FOUND",
    "itemName": "KTM atas nama Budi",
    "category": {
      "id": "ad4ed793-310b-489b-b269-5f50f0b8e1a4",
      "slug": "id-card",
      "name": "Kartu identitas"
    },
    "categoryOther": null,
    "description": "Ditemukan di lorong lantai dua dan dititipkan sementara kepada penemu.",
    "location": {
      "id": "eb3f0895-f5f2-4e18-9e16-19596e8b1351",
      "slug": "fasilkom-a-building",
      "name": "Gedung A Fasilkom UI"
    },
    "locationDetail": "Lorong lantai 2",
    "occurredAt": "2026-11-16T04:15:00.000Z",
    "imageUrl": null,
    "publicContact": {
      "method": "EMAIL",
      "value": "penemu@example.com"
    },
    "createdAt": "2026-11-16T08:30:00.000Z"
  }
}
```

Status yang mungkin:

| Status | Kode error | Arti |
| --- | --- | --- |
| `200` | - | Detail laporan ditemukan. |
| `400` | `VALIDATION_ERROR` | Format `id` bukan UUID yang valid. |
| `404` | `REPORT_NOT_FOUND` | Tidak ada laporan dengan ID tersebut. |
| `500` | `INTERNAL_ERROR` | Kesalahan server yang tidak diperkirakan. |

### `POST /reports`

Membuat laporan baru. Endpoint ini menerima laporan `LOST` maupun `FOUND`, dengan foto opsional.

Tanpa foto, kirim body berikut sebagai `application/json`.

```json
{
  "reportType": "LOST",
  "itemName": "Tumbler hitam",
  "categoryId": "db5eb9fd-73d8-4c2e-86e2-9a34ac94fdca",
  "categoryOther": null,
  "description": "Tumbler hitam 600 ml dengan stiker kucing di bagian bawah.",
  "locationId": "eb3f0895-f5f2-4e18-9e16-19596e8b1351",
  "locationDetail": "Ruang A206",
  "occurredAt": "2026-11-16T05:00:00.000Z",
  "contact": {
    "method": "WHATSAPP",
    "value": "+6281234567890"
  }
}
```

Dengan foto, gunakan `multipart/form-data` dengan dua field berikut:

| Field | Tipe | Keterangan |
| --- | --- | --- |
| `data` | string JSON | Objek JSON yang sama persis dengan contoh body di atas. |
| `photo` | file | Opsional. Hanya JPEG, PNG, atau WebP dengan ukuran maksimum 5 MB. |

Backend harus memvalidasi tipe dan ukuran file sebelum mengunggahnya ke Cloudinary. Pada Checkpoint 2, frontend dapat mengirim request tanpa `photo`; integrasi Cloudinary baru diwajibkan pada Checkpoint 3.

Aturan validasi body:

| Field | Aturan |
| --- | --- |
| `reportType` | Wajib; `LOST` atau `FOUND`. |
| `itemName` | Wajib; 3 sampai 100 karakter setelah trim. |
| `categoryId` | Wajib; UUID kategori yang tersedia. |
| `categoryOther` | Wajib 3 sampai 100 karakter jika kategori yang dipilih memiliki slug `other`; selain itu boleh `null`. |
| `description` | Wajib; 10 sampai 2.000 karakter. |
| `locationId` | Wajib; UUID lokasi dari `GET /locations`, termasuk lokasi ber-slug `other`. |
| `locationDetail` | Opsional dan maksimum 200 karakter untuk lokasi biasa. Wajib 3 sampai 200 karakter setelah trim jika `locationId` merujuk ke lokasi ber-slug `other`; nilainya menjadi nama lokasi kustom pelapor. |
| `occurredAt` | Opsional; waktu ISO 8601 yang tidak boleh berada di masa depan. |
| `contact.method` | Wajib; `EMAIL`, `PHONE`, atau `WHATSAPP`. |
| `contact.value` | Wajib; harus cocok dengan metode kontak yang dipilih. Hanya nilai ini yang boleh diekspos sebagai kontak publik. |

Contoh respons `201 Created` menggunakan bentuk detail laporan:

```json
{
  "data": {
    "id": "9be5bcf0-2ae6-4a24-b69e-e1db561ea17b",
    "reportType": "LOST",
    "itemName": "Tumbler hitam",
    "category": {
      "id": "db5eb9fd-73d8-4c2e-86e2-9a34ac94fdca",
      "slug": "bottle",
      "name": "Botol minum"
    },
    "categoryOther": null,
    "description": "Tumbler hitam 600 ml dengan stiker kucing di bagian bawah.",
    "location": {
      "id": "eb3f0895-f5f2-4e18-9e16-19596e8b1351",
      "slug": "fasilkom-a-building",
      "name": "Gedung A Fasilkom UI"
    },
    "locationDetail": "Ruang A206",
    "occurredAt": "2026-11-16T05:00:00.000Z",
    "imageUrl": null,
    "publicContact": {
      "method": "WHATSAPP",
      "value": "+6281234567890"
    },
    "createdAt": "2026-11-16T08:35:00.000Z"
  }
}
```

Status yang mungkin:

| Status | Kode error | Arti |
| --- | --- | --- |
| `201` | - | Laporan dan referensi gambar opsional berhasil dibuat. |
| `400` | `VALIDATION_ERROR` | Body, JSON di field `data`, atau parameter gambar tidak valid. |
| `404` | `CATEGORY_NOT_FOUND` atau `LOCATION_NOT_FOUND` | ID kategori atau lokasi tidak tersedia. |
| `413` | `FILE_TOO_LARGE` | Foto melebihi 5 MB. |
| `415` | `UNSUPPORTED_MEDIA_TYPE` | Foto bukan JPEG, PNG, atau WebP. |
| `502` | `IMAGE_UPLOAD_FAILED` | Cloudinary gagal menerima foto; laporan tidak boleh dibuat sebagian. |
| `500` | `INTERNAL_ERROR` | Kesalahan server yang tidak diperkirakan. |

### `GET /categories`

Mengambil kategori yang valid untuk filter dan form laporan. Endpoint ini mencegah frontend menyimpan daftar kategori sendiri yang dapat berbeda dari database.

Contoh respons `200 OK`:

```json
{
  "data": [
    { "id": "db5eb9fd-73d8-4c2e-86e2-9a34ac94fdca", "slug": "electronics", "name": "Elektronik" },
    { "id": "ad4ed793-310b-489b-b269-5f50f0b8e1a4", "slug": "id-card", "name": "Kartu identitas" },
    { "id": "2d361c7e-ae86-4195-a147-9c976f3c7dd9", "slug": "other", "name": "Lainnya" }
  ]
}
```

### `GET /locations`

Mengambil semua lokasi predefined yang valid untuk filter dan form laporan, termasuk lokasi ber-slug `other`. Frontend menampilkan nama lokasi biasa sebagai pilihan. Ketika pengguna memilih `other`, frontend harus mengganti label `locationDetail` menjadi "Nama lokasi" dan menjadikannya wajib. Untuk lokasi lain, `locationDetail` tetap opsional dan dapat dipakai untuk lantai atau nomor ruangan.

Contoh respons `200 OK`:

```json
{
  "data": [
    {
      "id": "eb3f0895-f5f2-4e18-9e16-19596e8b1351",
      "slug": "fasilkom-a-building",
      "name": "Gedung A Fasilkom UI"
    },
    {
      "id": "4f768272-c345-4a59-bf92-0d9c3ccbe6aa",
      "slug": "fasilkom-library",
      "name": "Perpustakaan Fasilkom UI"
    },
    {
      "id": "b1000000-0000-4000-8000-000000000006",
      "slug": "other",
      "name": "Lokasi lainnya"
    }
  ]
}
```

Untuk membuat laporan dengan lokasi kustom, kirim ID lokasi ber-slug `other` dan gunakan `locationDetail` untuk nama lokasi; misalnya:

```json
{
  "locationId": "b1000000-0000-4000-8000-000000000006",
  "locationDetail": "Kantin Fakultas Teknik, dekat pintu timur"
}
```

Pada `GET /reports`, parameter `location` menerima semua slug lokasi predefined. Gunakan `location=other` untuk mengembalikan laporan yang menggunakan nama lokasi kustom dalam `locationDetail`.

Kedua endpoint metadata mengembalikan `200 OK` atau `500 INTERNAL_ERROR`.

## Catatan implementasi

- Controller list harus menghitung `totalItems` dengan filter yang sama dengan query data agar metadata pagination konsisten.
- Backend hanya memilih kolom kontak yang dipakai dari laporan dan memetakkannya ke `publicContact`. Jangan menambahkan nomor atau email lain ke respons, termasuk dalam objek debug atau relasi Prisma.
- Saat foto tersedia, simpan referensi Cloudinary di database dan kirim URL aman (`https`) sebagai `imageUrl`. Jangan menyimpan binary gambar di PostgreSQL.
- Mock data frontend dan seed backend harus memakai nilai enum, respons envelope, UUID, slug, dan struktur objek yang sama dengan dokumen ini. Sertakan contoh lokasi biasa dengan `locationDetail` bernilai maupun `null`, serta lokasi ber-slug `other` yang memakai `locationDetail` sebagai nama lokasi kustom.
