const { dbRun, dbGet, dbAll } = require('../middlewares_helpers/sqlite3_helpers');

/* Query dasar: pesanan + nama pelanggan + nama layanan (JOIN) */
const BASE_SELECT = `
  SELECT p.*,
         pl.nama  AS nama_pelanggan,
         pl.no_hp AS no_hp_pelanggan,
         l.nama_layanan,
         l.satuan
  FROM pesanan p
  JOIN pelanggan pl ON pl.id = p.pelanggan_id
  JOIN layanan  l  ON l.id  = p.layanan_id
`;

/* =============== READ (all) + filter =============== */
// filter: { status, status_bayar, pelanggan_id, search }
const findAllPesanan = async (filter = {}) => {
  const where = [];
  const params = [];

  if (filter.status) {
    where.push('p.status = ?');
    params.push(filter.status);
  }
  if (filter.status_bayar) {
    where.push('p.status_bayar = ?');
    params.push(filter.status_bayar);
  }
  if (filter.pelanggan_id) {
    where.push('p.pelanggan_id = ?');
    params.push(filter.pelanggan_id);
  }
  if (filter.search) {
    where.push('(p.kode_pesanan LIKE ? OR pl.nama LIKE ?)');
    params.push(`%${filter.search}%`, `%${filter.search}%`);
  }

  const sql =
    BASE_SELECT + (where.length ? ` WHERE ${where.join(' AND ')}` : '') + ' ORDER BY p.id DESC';
  return await dbAll(sql, params);
};

/* =============== READ (by id) =============== */
const findPesananById = async (id) => {
  return await dbGet(`${BASE_SELECT} WHERE p.id = ?`, [id]);
};

/* Format kode: LDR-YYYYMMDD-0001 (nomor diambil dari id) */
const buildKode = (id) => {
  const d = new Date();
  const ymd =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0');
  return `LDR-${ymd}-${String(id).padStart(4, '0')}`;
};

/* =============== CREATE =============== */
// layanan = baris layanan dari DB (harga & estimasi diambil dari sini, BUKAN dari client)
const createPesanan = async (body, layanan) => {
  const jumlah = Number(body.jumlah);
  const total = Math.round(jumlah * layanan.harga);
  const tempKode = `TMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const { lastID } = await dbRun(
    `INSERT INTO pesanan
      (kode_pesanan, pelanggan_id, layanan_id, jumlah, harga_satuan, total_harga,
       status_bayar, catatan, tanggal_masuk, estimasi_selesai)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now', ?))`,
    [
      tempKode,
      Number(body.pelanggan_id),
      layanan.id,
      jumlah,
      layanan.harga,
      total,
      body.status_bayar ?? 'belum_bayar',
      body.catatan ?? null,
      `+${layanan.estimasi_hari} day`,
    ]
  );

  await dbRun('UPDATE pesanan SET kode_pesanan = ? WHERE id = ?', [buildKode(lastID), lastID]);
  return await findPesananById(lastID);
};

/* =============== UPDATE (data pesanan) =============== */
// layanan boleh null kalau layanan_id tidak diganti
const updatePesanan = async (id, body, layanan) => {
  const existing = await findPesananById(id);
  if (!existing) return null;

  const layananId = layanan ? layanan.id : existing.layanan_id;
  const hargaSatuan = layanan ? layanan.harga : existing.harga_satuan;
  const jumlah = body.jumlah !== undefined ? Number(body.jumlah) : existing.jumlah;
  const total = Math.round(jumlah * hargaSatuan);

  await dbRun(
    `UPDATE pesanan
     SET pelanggan_id = ?, layanan_id = ?, jumlah = ?, harga_satuan = ?, total_harga = ?,
         status_bayar = ?, catatan = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      body.pelanggan_id !== undefined ? Number(body.pelanggan_id) : existing.pelanggan_id,
      layananId,
      jumlah,
      hargaSatuan,
      total,
      body.status_bayar ?? existing.status_bayar,
      body.catatan !== undefined ? body.catatan : existing.catatan,
      id,
    ]
  );
  return await findPesananById(id);
};

/* =============== UPDATE STATUS =============== */
const updateStatusPesanan = async (id, status) => {
  await dbRun(
    `UPDATE pesanan
     SET status = ?,
         tanggal_diambil = CASE WHEN ? = 'diambil' THEN datetime('now') ELSE tanggal_diambil END,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [status, status, id]
  );
  return await findPesananById(id);
};

/* =============== DELETE =============== */
const deletePesanan = async (id) => {
  const { changes } = await dbRun('DELETE FROM pesanan WHERE id = ?', [id]);
  return changes > 0;
};

/* =============== DASHBOARD / RINGKASAN =============== */
const getDashboard = async () => {
  const totals = await dbGet(`
    SELECT
      (SELECT COUNT(*) FROM pelanggan)                                         AS total_pelanggan,
      (SELECT COUNT(*) FROM layanan WHERE is_active = 1)                       AS total_layanan_aktif,
      (SELECT COUNT(*) FROM pesanan)                                           AS total_pesanan,
      (SELECT COUNT(*) FROM pesanan WHERE status NOT IN ('diambil','dibatalkan')) AS pesanan_aktif,
      (SELECT COALESCE(SUM(total_harga),0) FROM pesanan
         WHERE status_bayar = 'lunas' AND status <> 'dibatalkan')              AS pendapatan,
      (SELECT COALESCE(SUM(total_harga),0) FROM pesanan
         WHERE status_bayar = 'belum_bayar' AND status <> 'dibatalkan')        AS belum_dibayar
  `);
  const perStatus = await dbAll(
    'SELECT status, COUNT(*) AS jumlah FROM pesanan GROUP BY status ORDER BY jumlah DESC'
  );
  const terbaru = await dbAll(`${BASE_SELECT} ORDER BY p.id DESC LIMIT 5`);
  return { ...totals, per_status: perStatus, pesanan_terbaru: terbaru };
};

module.exports = {
  findAllPesanan,
  findPesananById,
  createPesanan,
  updatePesanan,
  updateStatusPesanan,
  deletePesanan,
  getDashboard,
};
