const { dbRun, dbGet, dbAll } = require('../middlewares_helpers/sqlite3_helpers');

/* =============== READ (all) — bisa cari via ?search= =============== */
const findAllPelanggan = async (search) => {
  if (search) {
    const q = `%${search}%`;
    return await dbAll(
      `SELECT * FROM pelanggan
       WHERE nama LIKE ? OR no_hp LIKE ? OR alamat LIKE ?
       ORDER BY id DESC`,
      [q, q, q]
    );
  }
  return await dbAll('SELECT * FROM pelanggan ORDER BY id DESC');
};

/* =============== READ (by id) =============== */
const findPelangganById = async (id) => {
  return await dbGet('SELECT * FROM pelanggan WHERE id = ?', [id]);
};

const findPelangganByNoHp = async (noHp) => {
  return await dbGet('SELECT * FROM pelanggan WHERE no_hp = ?', [noHp]);
};

/* =============== CREATE =============== */
const createPelanggan = async (body) => {
  const { lastID } = await dbRun(
    'INSERT INTO pelanggan (nama, no_hp, alamat) VALUES (?, ?, ?)',
    [body.nama.trim(), body.no_hp.trim(), body.alamat ?? null]
  );
  return await findPelangganById(lastID);
};

/* =============== UPDATE =============== */
const updatePelanggan = async (id, body) => {
  const existing = await findPelangganById(id);
  if (!existing) return null;

  await dbRun(
    `UPDATE pelanggan
     SET nama = ?, no_hp = ?, alamat = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [
      body.nama !== undefined ? body.nama.trim() : existing.nama,
      body.no_hp !== undefined ? body.no_hp.trim() : existing.no_hp,
      body.alamat !== undefined ? body.alamat : existing.alamat,
      id,
    ]
  );
  return await findPelangganById(id);
};

/* =============== DELETE =============== */
const deletePelanggan = async (id) => {
  const { changes } = await dbRun('DELETE FROM pelanggan WHERE id = ?', [id]);
  return changes > 0;
};

/* Hitung jumlah pesanan milik pelanggan (untuk cegah hapus) */
const countPesananByPelanggan = async (id) => {
  const row = await dbGet('SELECT COUNT(*) AS total FROM pesanan WHERE pelanggan_id = ?', [id]);
  return row.total;
};

module.exports = {
  findAllPelanggan,
  findPelangganById,
  findPelangganByNoHp,
  createPelanggan,
  updatePelanggan,
  deletePelanggan,
  countPesananByPelanggan,
};
