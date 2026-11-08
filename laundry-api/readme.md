# Laundry API

REST API **Sistem Manajemen Laundry** — Node.js, Express.js, SQLite3.
Dikembangkan dari template `base_server` (dosen). Entitas: **Pelanggan**, **Layanan**, **Pesanan**.

## Menjalankan

```bash
npm install
cp .env.example .env     # Windows: copy .env.example .env
# Edit .env: isi LOGIN_USERNAME, LOGIN_PASSWORD, dan JWT_SECRET
npm run dev              # atau: npm start
```

Server berjalan di `http://localhost:3000`. Database `database.sqlite` dan data awal dibuat otomatis.

### Login JWT

Atur `LOGIN_USERNAME`, `LOGIN_PASSWORD`, dan `JWT_SECRET` pada `.env` sebelum menjalankan server. Gunakan password kuat dan secret acak minimal 32 karakter. Endpoint `POST /api/auth/login` menerima JSON `{"username":"...","password":"..."}` dan mengembalikan token JWT yang berlaku 8 jam. Aplikasi web menyimpan token untuk sesi login dan mengirimkannya sebagai `Authorization: Bearer <token>` ke endpoint data. Semua endpoint `/api` selain login memerlukan token yang valid.

Reset database ke data awal:

```bash
npm run reset-db
```

## Struktur

```text
laundry-api/
├── server.js                      # entry point + daftar route
├── scripts/reset-db.js
├── docs/
│   ├── API_DOCS.md                # tabel Method/Endpoint/Request/Response
│   └── Laundry_API.postman_collection.json
└── src/
    ├── config/database.js         # koneksi SQLite + jalankan init.sql
    ├── sql_scripts/init.sql       # CREATE TABLE + data awal
    ├── middlewares_helpers/
    │   ├── sqlite3_helpers.js     # dbRun, dbGet, dbAll (Promise)
    │   └── response.js            # format response standar
    ├── models/                    # query SQL
    │   ├── pelangganModel.js
    │   ├── layananModel.js
    │   └── pesananModel.js
    ├── controllers/               # validasi + response
    │   ├── pelangganController.js
    │   ├── layananController.js
    │   └── pesananController.js
    └── routes/                    # daftar endpoint
        ├── pelangganRoutes.js
        ├── layananRoutes.js
        └── pesananRoutes.js
```

Alur: `Client → Routes → Controllers → Models → SQLite Helpers → database.sqlite`

## Endpoint

Lihat **[docs/API_DOCS.md](docs/API_DOCS.md)**. Ringkasnya:

| Method | Endpoint |
|---|---|
| GET | `/api/dashboard` |
| GET, POST | `/api/pelanggan` |
| GET, PUT, DELETE | `/api/pelanggan/:id` |
| GET, POST | `/api/layanan` |
| POST | `/api/layanan/bulk` |
| GET, PUT, DELETE | `/api/layanan/:id` |
| GET, POST | `/api/pesanan` |
| GET, PUT, DELETE | `/api/pesanan/:id` |
| PATCH | `/api/pesanan/:id/status` |

Endpoint bawaan template (`/api/test`, `/api/products`) tetap ada.

## Testing dengan Postman

Import `docs/Laundry_API.postman_collection.json` → klik **Run collection**. Semua request punya test otomatis dan ID tersimpan ke variable koleksi.
