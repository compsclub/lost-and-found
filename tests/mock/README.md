# Mock data naming

Folder ini berisi mock data JSON untuk frontend dan backend selama pengembangan. Setiap data harus mengikuti struktur pada [REST API contract](../../docs/rest-api.md).

## Pola nama file

Gunakan nama file `kebab-case` dengan akhiran yang menjelaskan peran mock data:

```text
<resource>.<purpose>.json
```

| Akhiran | Fungsi | Contoh |
| --- | --- | --- |
| `.response.json` | Body respons sukses atau error dari endpoint. | `get-reports.response.json` |
| `.request.json` | Body request yang valid atau tidak valid. | `post-report-predefined.request.json` |
| `.seed.json` | Kumpulan data dasar yang dapat dipakai ulang untuk in-memory store, Prisma seed, atau test setup. | `reports.seed.json` |

Jika mock data mewakili endpoint HTTP, awali nama dengan method dan resource endpoint dalam huruf kecil, misalnya `get-reports.response.json` atau `post-report-other-location.request.json`.

Jika beberapa skenario untuk endpoint yang sama diperlukan, sisipkan nama skenario sebelum akhiran peran:

```text
get-reports-empty.response.json
get-reports-page-2.response.json
post-report-invalid-location.response.json
```

## Listing mock data

| File | Kegunaan |
| --- | --- |
| `categories.response.json` | Respons `GET /api/v1/categories`. |
| `locations.response.json` | Respons `GET /api/v1/locations`, termasuk lokasi `other`. |
| `reports.seed.json` | Data laporan lengkap untuk seed dan setup test. |
| `get-reports.response.json` | Respons daftar dan metadata pagination dari `GET /api/v1/reports`. |
| `get-report-by-id.response.json` | Respons detail dari `GET /api/v1/reports/:id`. |
| `post-report-predefined.request.json` | Request laporan dengan lokasi biasa. |
| `post-report-other-location.request.json` | Request laporan dengan lokasi ber-slug `other`. |
| `post-report.response.json` | Respons `201 Created` dari `POST /api/v1/reports`. |
| `validation-error.response.json` | Respons `400 VALIDATION_ERROR`. |
