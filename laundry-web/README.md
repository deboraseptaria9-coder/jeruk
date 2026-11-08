# LaundryKu — Web Client

Web client **React + TypeScript + axios** untuk Laundry API.

## Menjalankan

1. Pastikan server `laundry-api` sudah berjalan (`npm run dev` di folder laundry-api).
2. Di folder ini:

```bash
npm install
npm run dev
```

3. Buka `http://localhost:5173`.

Alamat server default `http://localhost:3000/api`. Bisa diganti lewat file `.env` (`VITE_API_URL=...`) atau klik indikator server di pojok kanan atas aplikasi.

## Struktur

```text
src/
├── main.tsx              # titik awal React
├── LaundryApp.tsx        # layout + menu tab
├── types.ts              # tipe data (sama dengan tabel di server)
├── format.ts             # format Rupiah, tanggal, label status
├── useApi.ts             # hook GET + loading + error + reload
├── api/
│   ├── client.ts         # axios.create({ baseURL }) + pesan error
│   └── laundry.ts        # semua fungsi GET/POST/PUT/PATCH/DELETE
└── components/
    ├── ui.tsx            # tombol, modal, badge, dll
    ├── DashboardView.tsx # GET /dashboard
    ├── PesananView.tsx   # CRUD pesanan + PATCH status
    ├── PelangganView.tsx # CRUD pelanggan
    └── LayananView.tsx   # CRUD layanan
```

## Contoh pemakaian axios

```ts
// GET
const daftar = await pelangganApi.list();          // GET  /pelanggan
// POST
await pelangganApi.create({ nama, no_hp, alamat }); // POST /pelanggan
// PUT
await pelangganApi.update(id, { alamat });          // PUT  /pelanggan/:id
// PATCH
await pesananApi.updateStatus(id, "dicuci");        // PATCH /pesanan/:id/status
// DELETE
await pelangganApi.remove(id);                      // DELETE /pelanggan/:id
```
