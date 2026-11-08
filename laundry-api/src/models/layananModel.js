const { dbRun, dbGet, dbAll } = require('../middlewares_helpers/sqlite3_helpers');

/* =============== READ (all) — ?aktif=1 untuk layanan aktif saja =============== */
const findAllLayanan = async (onlyActive = false) => {
  if (onlyActive) {
    return await dbAll('SELECT * FROM layanan WHERE is_active = 1 ORDER BY id ASC');
  }
  return await dbAll('SELECT * FROM layanan ORDER BY id ASC');
};

/* =============== READ (by id) =============== */
const findLayananById = async (id) => {
  return await dbGet('SELECT * FROM layanan WHERE id = ?', [id]);
};

/* =============== CREATE =============== */
const createLayanan = async (body) => {
  const { lastID } = await dbRun(
    `INSERT INTO layanan (nama_layanan, satuan, harga, estimasi_hari, deskripsi, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      body.nama_layanan.trim(),
      body.satuan ?? 'kg',
      Number(body.harga),
      body.estimasi_hari !== undefined ? Number(body.estimasi_hari) : 2,
      body.deskripsi ?? null,
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
    ]
  );
  return await findLayananById(lastID);
};

/* =============== UPDATE =============== */
const updateLayanan = async (id, body) => {
  const existing = await findLayananById(id);
  if (!existing) return null;

  await dbRun(
    `UPDATE layanan
     SET nama_layanan = ?, satuan = ?, harga = ?, estimasi_hari = ?, deskripsi = ?,
         is_active = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      body.nama_layanan !== undefined ? body.nama_layanan.trim() : existing.nama_layanan,
      body.satuan ?? existing.satuan,
      body.harga !== undefined ? Number(body.harga) : existing.harga,
      body.estimasi_hari !== undefined ? Number(body.estimasi_hari) : existing.estimasi_hari,
      body.deskripsi !== undefined ? body.deskripsi : existing.deskripsi,
      body.is_active !== undefined ? (body.is_active ? 1 : 0) : existing.is_active,
      id,
    ]
  );
  return await findLayananById(id);
};

/* =============== DELETE =============== */
const deleteLayanan = async (id) => {
  const { changes } = await dbRun('DELETE FROM layanan WHERE id = ?', [id]);
  return changes > 0;
};

const countPesananByLayanan = async (id) => {
  const row = await dbGet('SELECT COUNT(*) AS total FROM pesanan WHERE layanan_id = ?', [id]);
  return row.total;
};

/* =============== BULK CREATE (pakai transaksi) =============== */
const bulkCreateLayanan = async (items) => {
  await dbRun('BEGIN TRANSACTION');
  try {
    const created = [];
    for (const item of items) {
      const { lastID } = await dbRun(
        `INSERT INTO layanan (nama_layanan, satuan, harga, estimasi_hari, deskripsi, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          item.nama_layanan.trim(),
          item.satuan ?? 'kg',
          Number(item.harga),
          item.estimasi_hari !== undefined ? Number(item.estimasi_hari) : 2,
          item.deskripsi ?? null,
          item.is_active !== undefined ? (item.is_active ? 1 : 0) : 1,
        ]
      );
      created.push(await findLayananById(lastID));
    }
    await dbRun('COMMIT');
    return created;
  } catch (error) {
    await dbRun('ROLLBACK');
    throw error;
  }
};

module.exports = {
  findAllLayanan,
  findLayananById,
  createLayanan,
  updateLayanan,
  deleteLayanan,
  countPesananByLayanan,
  bulkCreateLayanan,
};
