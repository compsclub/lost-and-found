# Database Design

Dokumen ini mendeskripsikan desain database PostgreSQL untuk Lost and Found Website. Desain ini menjadi acuan Prisma schema dan migration pada Checkpoint 3. Visual database akan dibuat terpisah di DrawDB; dokumen ini sengaja berfokus pada schema, constraint, dan relasi.

## Ruang lingkup dan keputusan desain

- Aplikasi tidak memakai akun atau autentikasi pada kebutuhan saat ini. Karena itu, tidak ada tabel `users`.
- Setiap laporan memiliki tepat satu kontak publik yang dipilih pelapor. Aplikasi tidak menyimpan metode kontak tambahan yang tidak dipilih untuk ditampilkan.
- Setiap laporan dapat memiliki nol atau satu foto. File gambar disimpan di Cloudinary, sedangkan PostgreSQL hanya menyimpan referensinya.
- Kategori dan lokasi disimpan sebagai tabel referensi agar filter konsisten antara frontend, API, dan database. Baris lokasi ber-slug `other` menangani lokasi di luar daftar; nama lokasi yang diketik pelapor disimpan di `reports.location_detail`.
- Nama tabel menggunakan bentuk jamak `snake_case`; nama kolom juga memakai `snake_case`. Prisma dapat memetakan nama model dan field `camelCase` memakai `@@map` dan `@map`.
- Primary key memakai UUID. Prisma akan menghasilkan UUID melalui `@default(uuid())`; di PostgreSQL kolomnya menggunakan tipe `uuid`.
- Semua waktu menggunakan `timestamp with time zone` (`timestamptz`) dan disimpan dalam UTC.

## Entity relationship summary

- Satu `category` dapat dipakai oleh banyak `reports`; setiap `report` wajib mempunyai satu kategori.
- Satu `location` dapat dipakai oleh banyak `reports`; setiap `report` wajib mempunyai satu lokasi. Lokasi ber-slug `other` menggunakan `location_detail` sebagai nama lokasi kustom.
- Satu `report` wajib memiliki tepat satu `report_contact`. Constraint unik pada `report_contacts.report_id` memastikan satu laporan tidak bisa memiliki lebih dari satu kontak publik.
- Foto bukan entity terpisah karena kebutuhan hanya mengizinkan satu foto opsional per laporan. Referensi Cloudinary disimpan langsung pada `reports`.

## Enum PostgreSQL

Enum membuat nilai penting konsisten dan mudah dimapping ke Prisma.

| Enum | Nilai | Digunakan oleh |
| --- | --- | --- |
| `report_type` | `LOST`, `FOUND` | `reports.report_type` |
| `contact_method` | `EMAIL`, `PHONE`, `WHATSAPP` | `report_contacts.method` |

`LOST` berarti pemilik sedang mencari barangnya; `FOUND` berarti seseorang melaporkan barang yang telah ditemukan.

## Tabel `categories`

Menyimpan pilihan kategori untuk form dan filter laporan. Kategori `other` dipakai bila barang tidak cocok dengan pilihan yang tersedia; nama kategori spesifiknya kemudian disimpan di `reports.category_other`.

| Kolom | Tipe PostgreSQL | Null | Constraint / default | Keterangan |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Tidak | Primary key; Prisma `uuid()` | ID kategori. |
| `slug` | `varchar(50)` | Tidak | Unique | Identifier stabil untuk query API, misalnya `electronics` atau `other`. |
| `name` | `varchar(100)` | Tidak | Unique | Nama kategori yang ditampilkan, misalnya `Elektronik`. |
| `created_at` | `timestamptz` | Tidak | Default `now()` | Waktu kategori dibuat. |
| `updated_at` | `timestamptz` | Tidak | Diperbarui Prisma dengan `@updatedAt` | Waktu kategori terakhir diubah. |

Contoh data awal: `electronics`, `id-card`, `keys`, `bottle`, `bag`, `clothing`, `stationery`, dan `other`.

## Tabel `locations`

Menyimpan lokasi umum yang dapat dipilih pada form dan filter, termasuk satu baris ber-slug `other` untuk lokasi di luar daftar. Tabel ini hanya berisi lokasi yang dikelola aplikasi; nilai kustom dari pengguna tidak membuat baris baru. Rincian seperti nomor ruangan tidak dibuat menjadi tabel terpisah karena dapat beragam dan bersifat opsional; rincian itu disimpan di `reports.location_detail`. Jika lokasi ber-slug `other` dipilih, `location_detail` menyimpan nama lokasi kustom.

| Kolom | Tipe PostgreSQL | Null | Constraint / default | Keterangan |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Tidak | Primary key; Prisma `uuid()` | ID lokasi. |
| `slug` | `varchar(80)` | Tidak | Unique | Identifier stabil untuk query API, misalnya `fasilkom-a-building`. |
| `name` | `varchar(150)` | Tidak | Unique | Nama lokasi yang ditampilkan. |
| `created_at` | `timestamptz` | Tidak | Default `now()` | Waktu lokasi dibuat. |
| `updated_at` | `timestamptz` | Tidak | Diperbarui Prisma dengan `@updatedAt` | Waktu lokasi terakhir diubah. |

Contoh data awal: `fasilkom-a-building`, `fasilkom-b-building`, `fasilkom-library`, `fasilkom-canteen`, `fasilkom-parking`, dan `other`. Baris `other` memiliki nama tampilan `Lokasi lainnya`.

## Tabel `reports`

Tabel utama untuk laporan barang hilang atau ditemukan. Tabel ini tidak menyimpan semua informasi kontak secara langsung agar kontak publik memiliki batas yang jelas melalui relasi ke `report_contacts`.

| Kolom | Tipe PostgreSQL | Null | Constraint / default | Keterangan |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Tidak | Primary key; Prisma `uuid()` | ID laporan yang dipakai di URL API. |
| `report_type` | `report_type` | Tidak | - | Jenis laporan: `LOST` atau `FOUND`. |
| `item_name` | `varchar(100)` | Tidak | - | Nama singkat barang untuk daftar dan pencarian. |
| `category_id` | `uuid` | Tidak | Foreign key ke `categories.id` | Kategori laporan. |
| `category_other` | `varchar(100)` | Ya | - | Nama kategori buatan pelapor jika kategori ber-slug `other`; selain itu `NULL`. |
| `description` | `text` | Tidak | - | Ciri, keadaan, atau konteks barang. |
| `location_id` | `uuid` | Tidak | Foreign key ke `locations.id` | Lokasi kejadian, termasuk baris `other`. |
| `location_detail` | `varchar(200)` | Ya | - | Rincian tambahan, misalnya `Lantai 2` atau `Ruang A206`. Wajib berisi nama lokasi kustom jika lokasi ber-slug `other`. |
| `occurred_at` | `timestamptz` | Ya | - | Perkiraan waktu barang hilang atau ditemukan. |
| `image_url` | `text` | Ya | - | URL HTTPS foto dari Cloudinary. `NULL` bila tidak ada foto. |
| `image_public_id` | `varchar(255)` | Ya | Unique | Public ID Cloudinary untuk pengelolaan aset internal; tidak dikirim ke API publik. |
| `created_at` | `timestamptz` | Tidak | Default `now()` | Waktu laporan dibuat. |
| `updated_at` | `timestamptz` | Tidak | Diperbarui Prisma dengan `@updatedAt` | Waktu laporan terakhir diubah. |

Validasi aplikasi sebelum insert atau update:

- `item_name` harus 3 sampai 100 karakter setelah trim.
- `description` harus 10 sampai 2.000 karakter.
- `category_other` harus diisi 3 sampai 100 karakter jika kategori ber-slug `other`, dan harus `NULL` untuk kategori lain.
- `location_id` wajib mengacu pada lokasi yang tersedia.
- `location_detail`, jika diisi, maksimal 200 karakter. Ketika lokasi yang dipilih memiliki slug `other`, field ini wajib berisi 3 sampai 200 karakter dan menjadi nama lokasi kustom; untuk lokasi lain field ini boleh `NULL`.
- `occurred_at`, jika diisi, tidak boleh lebih baru daripada waktu request.
- Jika `image_url` bernilai `NULL`, `image_public_id` juga harus `NULL`. Jika ada foto, keduanya harus terisi.

Service Express harus memuat lokasi yang dipilih dan memvalidasi aturan `other` sebelum membuat laporan. Aturan ini tidak dapat dibuat sebagai `CHECK` constraint biasa karena bergantung pada `locations.slug`; gunakan trigger PostgreSQL hanya jika validasi database-level diperlukan di masa depan. Pasangan `image_url` dan `image_public_id` sebaiknya ditambahkan sebagai `CHECK` constraint SQL pada migration Prisma:

```sql
ALTER TABLE reports
  ADD CONSTRAINT reports_image_reference_check CHECK (
    (image_url IS NULL AND image_public_id IS NULL)
    OR (image_url IS NOT NULL AND image_public_id IS NOT NULL)
  );
```

## Tabel `report_contacts`

Menyimpan tepat satu metode kontak yang secara eksplisit dipilih pelapor untuk ditampilkan pada detail laporan. Pemisahan ini memudahkan backend memilih hanya data yang memang boleh dipublikasikan.

| Kolom | Tipe PostgreSQL | Null | Constraint / default | Keterangan |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Tidak | Primary key; Prisma `uuid()` | ID kontak. |
| `report_id` | `uuid` | Tidak | Unique; foreign key ke `reports.id` | Menghubungkan kontak ke satu laporan. |
| `method` | `contact_method` | Tidak | - | `EMAIL`, `PHONE`, atau `WHATSAPP`. |
| `value` | `varchar(255)` | Tidak | - | Nilai kontak yang akan diekspos API sebagai `publicContact.value`. |
| `created_at` | `timestamptz` | Tidak | Default `now()` | Waktu kontak dibuat. |
| `updated_at` | `timestamptz` | Tidak | Diperbarui Prisma dengan `@updatedAt` | Waktu kontak terakhir diubah. |

Validasi aplikasi untuk `value` bergantung pada `method`:

- `EMAIL` harus berupa alamat email yang valid.
- `PHONE` dan `WHATSAPP` harus merupakan nomor telepon internasional yang dinormalisasi ke format E.164, misalnya `+6281234567890`.

## Foreign key dan kebijakan penghapusan

| Child table dan kolom | Parent table | Aturan | Alasan |
| --- | --- | --- | --- |
| `reports.category_id` | `categories.id` | `ON DELETE RESTRICT` | Kategori yang masih dipakai tidak boleh terhapus. |
| `reports.location_id` | `locations.id` | `ON DELETE RESTRICT` | Lokasi yang masih dipakai, termasuk baris `other`, tidak boleh terhapus. |
| `report_contacts.report_id` | `reports.id` | `ON DELETE CASCADE` | Kontak tidak boleh tetap ada setelah laporan yang memilikinya dihapus pada proses administratif masa depan. |

Tidak ada endpoint publik untuk menghapus laporan. Kebijakan di atas hanya melindungi integritas referensial jika maintenance administratif ditambahkan kelak.

## Index dan kebutuhan query

Index primary key dan unique untuk `slug`, `name`, serta `report_contacts.report_id` dibuat otomatis oleh primary key atau unique constraint. Tambahkan index berikut pada `reports`:

| Index | Kolom | Mendukung |
| --- | --- | --- |
| `reports_created_at_idx` | `created_at DESC` | Urutan daftar laporan terbaru. |
| `reports_type_created_at_idx` | `report_type, created_at DESC` | Filter `type` lalu urut terbaru. |
| `reports_category_created_at_idx` | `category_id, created_at DESC` | Filter kategori lalu urut terbaru. |
| `reports_location_created_at_idx` | `location_id, created_at DESC` | Filter semua lokasi, termasuk `location=other`, lalu urut terbaru. |

Pada ukuran data kecil, pencarian `item_name ILIKE '%query%'` dapat berjalan tanpa index khusus. Jika data atau traffic meningkat, aktifkan extension PostgreSQL `pg_trgm` dan buat GIN index berikut melalui migration SQL:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX reports_item_name_trgm_idx
  ON reports USING gin (item_name gin_trgm_ops);
```

Index trigram adalah optimasi opsional, bukan prasyarat Checkpoint 3.

## Rencana mapping Prisma

Berikut gambaran schema Prisma yang konsisten dengan desain ini. Ini adalah rencana untuk Checkpoint 1, bukan migration yang harus langsung dibuat sekarang.

```prisma
enum ReportType {
  LOST
  FOUND
}

enum ContactMethod {
  EMAIL
  PHONE
  WHATSAPP
}

model Category {
  id        String   @id @default(uuid()) @db.Uuid
  slug      String   @unique @db.VarChar(50)
  name      String   @unique @db.VarChar(100)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  reports   Report[]

  @@map("categories")
}

model Location {
  id        String   @id @default(uuid()) @db.Uuid
  slug      String   @unique @db.VarChar(80)
  name      String   @unique @db.VarChar(150)
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  reports   Report[]

  @@map("locations")
}

model Report {
  id            String         @id @default(uuid()) @db.Uuid
  reportType    ReportType     @map("report_type")
  itemName      String         @map("item_name") @db.VarChar(100)
  categoryId    String         @map("category_id") @db.Uuid
  categoryOther String?        @map("category_other") @db.VarChar(100)
  description   String
  locationId     String         @map("location_id") @db.Uuid
  locationDetail String?        @map("location_detail") @db.VarChar(200)
  occurredAt    DateTime?      @map("occurred_at") @db.Timestamptz(6)
  imageUrl      String?        @map("image_url")
  imagePublicId String?        @unique @map("image_public_id") @db.VarChar(255)
  createdAt     DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)
  category      Category       @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  location      Location       @relation(fields: [locationId], references: [id], onDelete: Restrict)
  contact       ReportContact?

  @@index([createdAt(sort: Desc)], map: "reports_created_at_idx")
  @@index([reportType, createdAt(sort: Desc)], map: "reports_type_created_at_idx")
  @@index([categoryId, createdAt(sort: Desc)], map: "reports_category_created_at_idx")
  @@index([locationId, createdAt(sort: Desc)], map: "reports_location_created_at_idx")
  @@map("reports")
}

model ReportContact {
  id        String        @id @default(uuid()) @db.Uuid
  reportId  String        @unique @map("report_id") @db.Uuid
  method    ContactMethod
  value     String        @db.VarChar(255)
  createdAt DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime      @updatedAt @map("updated_at") @db.Timestamptz(6)
  report    Report        @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@map("report_contacts")
}
```

Prisma relation `contact` ditulis opsional pada `Report` karena database tidak dapat menjamin bahwa parent dan child dibuat pada urutan yang sama hanya dari foreign key. Service `POST /reports` harus membuat `Report` dan `ReportContact` bersama-sama dalam satu nested write atau `$transaction`; dengan itu setiap laporan yang berhasil dibuat selalu memiliki satu kontak.

## Pemetaan ke REST API

| REST API | Sumber database | Catatan |
| --- | --- | --- |
| `category.id`, `category.slug`, `category.name` | `categories` | Dipilih melalui relasi `reports.category_id`. |
| `location.id`, `location.slug`, `location.name` | `locations` | Selalu berasal dari relasi `reports.location_id`, termasuk lokasi ber-slug `other`. |
| `locationDetail` | `reports.location_detail` | Detail opsional untuk lokasi biasa; nama lokasi kustom jika `location.slug` adalah `other`. |
| `categoryOther` | `reports.category_other` | Bernilai `null` kecuali kategori `other`. |
| `imageUrl` | `reports.image_url` | Bernilai `null` jika foto tidak diunggah. |
| `publicContact.method` | `report_contacts.method` | Satu-satunya metode kontak yang tersedia untuk publik. |
| `publicContact.value` | `report_contacts.value` | Satu-satunya nilai kontak yang tersedia untuk publik. |
| `createdAt` | `reports.created_at` | Dipakai sebagai urutan default daftar laporan. |

Query detail API harus menggunakan `include` Prisma untuk `category`, `location`, dan `contact`, lalu membentuk objek respons eksplisit. Jangan mengembalikan seluruh hasil Prisma mentah karena `image_public_id` bersifat internal dan struktur respons harus tetap sesuai dengan [REST API contract](./rest-api.md).
