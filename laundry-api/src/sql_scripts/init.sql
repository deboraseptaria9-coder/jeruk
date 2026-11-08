-- =========================================================
--  init.sql — dijalankan otomatis setiap server start
--  (lihat src/config/database.js)
-- =========================================================

-- Aktifkan foreign key (SQLite default-nya OFF)
PRAGMA foreign_keys = ON;

-- ---------- Bawaan template dosen ----------
CREATE TABLE IF NOT EXISTS test_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO test_logs DEFAULT VALUES;

CREATE TABLE IF NOT EXISTS products (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      price         REAL    NOT NULL,
      stock         INTEGER DEFAULT 0,
      category      TEXT,
      description   TEXT,
      is_available  INTEGER DEFAULT 1,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
--  SISTEM MANAJEMEN LAUNDRY
--  Entitas: Pelanggan, Layanan, Pesanan
-- =========================================================

-- 1. PELANGGAN
CREATE TABLE IF NOT EXISTS pelanggan (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    nama        TEXT    NOT NULL,
    no_hp       TEXT    NOT NULL UNIQUE,
    alamat      TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. LAYANAN (jenis layanan laundry + harga per satuan)
CREATE TABLE IF NOT EXISTS layanan (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_layanan   TEXT    NOT NULL,
    satuan         TEXT    NOT NULL DEFAULT 'kg' CHECK (satuan IN ('kg', 'pcs')),
    harga          REAL    NOT NULL CHECK (harga >= 0),
    estimasi_hari  INTEGER NOT NULL DEFAULT 2 CHECK (estimasi_hari >= 0),
    deskripsi      TEXT,
    is_active      INTEGER NOT NULL DEFAULT 1,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. PESANAN (transaksi: 1 pelanggan memesan 1 layanan)
CREATE TABLE IF NOT EXISTS pesanan (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    kode_pesanan      TEXT    NOT NULL UNIQUE,
    pelanggan_id      INTEGER NOT NULL REFERENCES pelanggan(id) ON DELETE RESTRICT,
    layanan_id        INTEGER NOT NULL REFERENCES layanan(id)   ON DELETE RESTRICT,
    jumlah            REAL    NOT NULL CHECK (jumlah > 0),
    harga_satuan      REAL    NOT NULL,
    total_harga       REAL    NOT NULL,
    status            TEXT    NOT NULL DEFAULT 'diterima'
                      CHECK (status IN ('diterima','dicuci','disetrika','selesai','diambil','dibatalkan')),
    status_bayar      TEXT    NOT NULL DEFAULT 'belum_bayar'
                      CHECK (status_bayar IN ('belum_bayar','lunas')),
    catatan           TEXT,
    tanggal_masuk     DATETIME DEFAULT CURRENT_TIMESTAMP,
    estimasi_selesai  DATETIME,
    tanggal_diambil   DATETIME,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
--  DATA AWAL (seed) — hanya dimasukkan SATU KALI
--  Penanda disimpan di tabel app_meta, jadi data yang sudah
--  Anda hapus tidak akan muncul lagi saat server restart.
--  Untuk mengulang dari awal: npm run reset-db
-- =========================================================
CREATE TABLE IF NOT EXISTS app_meta (
    key   TEXT PRIMARY KEY,
    value TEXT
);

INSERT INTO layanan (nama_layanan, satuan, harga, estimasi_hari, deskripsi)
SELECT * FROM (VALUES
    ('Cuci Kering',        'kg',  6000,  2, 'Cuci + kering, dilipat rapi'),
    ('Cuci Setrika',       'kg',  8000,  3, 'Cuci + kering + setrika'),
    ('Setrika Saja',       'kg',  5000,  2, 'Hanya setrika'),
    ('Express 1 Hari',     'kg', 12000,  1, 'Cuci setrika selesai 1 hari'),
    ('Bed Cover',          'pcs',25000,  3, 'Cuci bed cover / selimut besar'),
    ('Sepatu',             'pcs',30000,  3, 'Cuci sepatu (deep clean)')
)
WHERE NOT EXISTS (SELECT 1 FROM app_meta WHERE key = 'seed_v1');

INSERT INTO pelanggan (nama, no_hp, alamat)
SELECT * FROM (VALUES
    ('Budi Santoso',   '081234567801', 'Jl. Merdeka No. 10'),
    ('Siti Aminah',    '081234567802', 'Jl. Sudirman No. 25'),
    ('Andi Wijaya',    '081234567803', 'Perum Griya Indah Blok B2')
)
WHERE NOT EXISTS (SELECT 1 FROM app_meta WHERE key = 'seed_v1');

INSERT INTO pesanan (kode_pesanan, pelanggan_id, layanan_id, jumlah, harga_satuan, total_harga,
                     status, status_bayar, catatan, tanggal_masuk, estimasi_selesai)
SELECT * FROM (VALUES
    ('LDR-SEED-0001', 1, 2, 3.5, 8000, 28000, 'dicuci',   'belum_bayar', 'Pisahkan baju putih',
        datetime('now','-1 day'), datetime('now','+2 day')),
    ('LDR-SEED-0002', 2, 1, 5,   6000, 30000, 'selesai',  'lunas',       NULL,
        datetime('now','-2 day'), datetime('now')),
    ('LDR-SEED-0003', 3, 5, 2,  25000, 50000, 'diterima', 'belum_bayar', 'Bed cover motif bunga',
        datetime('now'),          datetime('now','+3 day'))
)
WHERE NOT EXISTS (SELECT 1 FROM app_meta WHERE key = 'seed_v1');

INSERT OR IGNORE INTO app_meta (key, value) VALUES ('seed_v1', datetime('now'));
