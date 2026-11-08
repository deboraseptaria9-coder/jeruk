# Dokumentasi REST API — Sistem Manajemen Laundry

**Base URL:** `http://localhost:3000/api`
**Format data:** JSON (`Content-Type: application/json`)

Semua response memakai format yang sama:

```json
// Berhasil
{ "success": true,  "message": "Pesan", "data": { ... } }
// Gagal
{ "success": false, "message": "Validasi gagal", "error": "nama wajib diisi" }
```

| Kode | Arti |
|---|---|
| 200 | OK — berhasil |
| 201 | Created — data baru berhasil dibuat |
| 400 | Bad Request — input tidak valid |
| 404 | Not Found — data / endpoint tidak ditemukan |
| 409 | Conflict — melanggar aturan bisnis (mis. no HP ganda, hapus data yang masih dipakai) |
| 500 | Server Error |

---

## Ringkasan Endpoint

| No | Method | Endpoint | Keterangan |
|---|---|---|---|
| 1 | GET | `/dashboard` | Ringkasan: jumlah pesanan, pendapatan, per status |
| 2 | GET | `/pelanggan` | Semua pelanggan (opsional `?search=`) |
| 3 | GET | `/pelanggan/:id` | Detail pelanggan |
| 4 | POST | `/pelanggan` | Tambah pelanggan |
| 5 | PUT | `/pelanggan/:id` | Ubah pelanggan |
| 6 | DELETE | `/pelanggan/:id` | Hapus pelanggan |
| 7 | GET | `/layanan` | Semua layanan (opsional `?aktif=1`) |
| 8 | GET | `/layanan/:id` | Detail layanan |
| 9 | POST | `/layanan` | Tambah layanan |
| 10 | POST | `/layanan/bulk` | Tambah banyak layanan sekaligus |
| 11 | PUT | `/layanan/:id` | Ubah layanan |
| 12 | DELETE | `/layanan/:id` | Hapus layanan |
| 13 | GET | `/pesanan` | Semua pesanan (filter `?status=&status_bayar=&pelanggan_id=&search=`) |
| 14 | GET | `/pesanan/:id` | Detail pesanan |
| 15 | POST | `/pesanan` | Buat pesanan (total dihitung server) |
| 16 | PUT | `/pesanan/:id` | Ubah data pesanan / status bayar |
| 17 | PATCH | `/pesanan/:id/status` | Ubah status cucian |
| 18 | DELETE | `/pesanan/:id` | Hapus pesanan |

---

## Tabel Detail (Method, Endpoint, Request, Response)

### A. Pelanggan

| Method | Endpoint | Request Body | Response Sukses | Response Gagal |
|---|---|---|---|---|
| GET | `/pelanggan` | – (query `search` opsional) | `200` `data: Pelanggan[]` | `500` |
| GET | `/pelanggan/:id` | – | `200` `data: Pelanggan` | `404` Pelanggan tidak ditemukan |
| POST | `/pelanggan` | `{ "nama": "Dewi", "no_hp": "081234567890", "alamat": "Jl. Melati 7" }` | `201` `data: Pelanggan` | `400` nama/no_hp tidak valid · `409` no_hp sudah terdaftar |
| PUT | `/pelanggan/:id` | Field yang mau diubah, mis. `{ "alamat": "Jl. Baru" }` | `200` `data: Pelanggan` | `400` · `404` · `409` |
| DELETE | `/pelanggan/:id` | – | `200` Pelanggan berhasil dihapus | `404` · `409` masih punya pesanan |

**Contoh response `GET /pelanggan/1`:**
```json
{
  "success": true,
  "message": "Berhasil mengambil pelanggan",
  "data": {
    "id": 1,
    "nama": "Budi Santoso",
    "no_hp": "081234567801",
    "alamat": "Jl. Merdeka No. 10",
    "created_at": "2026-11-06 14:46:35",
    "updated_at": "2026-11-06 14:46:35"
  }
}
```

### B. Layanan

| Method | Endpoint | Request Body | Response Sukses | Response Gagal |
|---|---|---|---|---|
| GET | `/layanan` | – (query `aktif=1` opsional) | `200` `data: Layanan[]` | `500` |
| GET | `/layanan/:id` | – | `200` `data: Layanan` | `404` |
| POST | `/layanan` | `{ "nama_layanan": "Cuci Karpet", "satuan": "pcs", "harga": 40000, "estimasi_hari": 4, "deskripsi": "..." }` | `201` `data: Layanan` | `400` nama/harga/satuan tidak valid |
| POST | `/layanan/bulk` | `{ "layanan": [ {...}, {...} ] }` | `201` `data: Layanan[]` | `400` (semua dibatalkan / rollback) |
| PUT | `/layanan/:id` | mis. `{ "harga": 45000 }` atau `{ "is_active": 0 }` | `200` `data: Layanan` | `400` · `404` |
| DELETE | `/layanan/:id` | – | `200` Layanan berhasil dihapus | `404` · `409` dipakai di pesanan |

Keterangan field: `satuan` = `kg` atau `pcs`; `is_active` = `1` aktif / `0` nonaktif.

### C. Pesanan

| Method | Endpoint | Request Body | Response Sukses | Response Gagal |
|---|---|---|---|---|
| GET | `/pesanan` | – (query opsional `status`, `status_bayar`, `pelanggan_id`, `search`) | `200` `data: Pesanan[]` (+ nama pelanggan & layanan) | `400` status tidak valid |
| GET | `/pesanan/:id` | – | `200` `data: Pesanan` | `404` |
| POST | `/pesanan` | `{ "pelanggan_id": 1, "layanan_id": 2, "jumlah": 3.5, "catatan": "Pisahkan baju putih", "status_bayar": "belum_bayar" }` | `201` `data: Pesanan` (kode & total otomatis) | `400` jumlah ≤ 0 / layanan nonaktif · `404` pelanggan/layanan tidak ada |
| PUT | `/pesanan/:id` | mis. `{ "jumlah": 4 }` atau `{ "status_bayar": "lunas" }` | `200` `data: Pesanan` (total dihitung ulang) | `400` · `404` · `409` sudah diambil/dibatalkan |
| PATCH | `/pesanan/:id/status` | `{ "status": "dicuci" }` | `200` `data: Pesanan` | `400` status tidak valid · `404` · `409` belum lunas saat "diambil" |
| DELETE | `/pesanan/:id` | – | `200` Pesanan berhasil dihapus | `404` |

Nilai `status`: `diterima` → `dicuci` → `disetrika` → `selesai` → `diambil` (atau `dibatalkan`).
Nilai `status_bayar`: `belum_bayar`, `lunas`.

**Contoh response `POST /pesanan`:**
```json
{
  "success": true,
  "message": "Pesanan berhasil dibuat",
  "data": {
    "id": 4,
    "kode_pesanan": "LDR-20261106-0004",
    "pelanggan_id": 1,
    "layanan_id": 2,
    "jumlah": 3.5,
    "harga_satuan": 8000,
    "total_harga": 28000,
    "status": "diterima",
    "status_bayar": "belum_bayar",
    "catatan": "Pisahkan baju putih",
    "tanggal_masuk": "2026-11-06 14:52:00",
    "estimasi_selesai": "2026-11-09 14:52:00",
    "tanggal_diambil": null,
    "nama_pelanggan": "Budi Santoso",
    "no_hp_pelanggan": "081234567801",
    "nama_layanan": "Cuci Setrika",
    "satuan": "kg"
  }
}
```

**Contoh response gagal `PATCH /pesanan/4/status` dengan `{ "status": "diambil" }` saat belum lunas:**
```json
{
  "success": false,
  "message": "Status tidak bisa diubah",
  "error": "Pesanan harus lunas sebelum diambil"
}
```

### D. Dashboard

| Method | Endpoint | Request Body | Response Sukses |
|---|---|---|---|
| GET | `/dashboard` | – | `200` `data: { total_pelanggan, total_layanan_aktif, total_pesanan, pesanan_aktif, pendapatan, belum_dibayar, per_status[], pesanan_terbaru[] }` |

---

## Aturan Bisnis

1. `total_harga` **selalu dihitung server**: `jumlah × harga layanan` (client tidak bisa mengirim total sendiri).
2. `kode_pesanan` dibuat otomatis: `LDR-YYYYMMDD-<id 4 digit>`.
3. `estimasi_selesai` = tanggal masuk + `estimasi_hari` layanan.
4. Layanan satuan `pcs` hanya menerima jumlah bilangan bulat.
5. Pesanan hanya boleh berstatus **diambil** jika sudah **lunas**.
6. Pesanan yang sudah *diambil* / *dibatalkan* tidak bisa diubah lagi.
7. Pelanggan / layanan yang masih dipakai di pesanan tidak bisa dihapus (gunakan `is_active = 0` untuk layanan).
8. `no_hp` pelanggan harus unik, 10–15 digit.
