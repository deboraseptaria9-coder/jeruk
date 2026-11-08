const layananModel = require('../models/layananModel');
const { success, fail, isFilled, toNumber } = require('../middlewares_helpers/response');

const SATUAN = ['kg', 'pcs'];

/* Validasi satu objek layanan. partial = true untuk PUT (field boleh tidak dikirim) */
const validateLayanan = (body, partial = false) => {
  if (!partial || body.nama_layanan !== undefined) {
    if (!isFilled(body.nama_layanan)) return 'nama_layanan wajib diisi';
  }
  if (!partial || body.harga !== undefined) {
    const harga = toNumber(body.harga);
    if (Number.isNaN(harga) || harga < 0) return 'harga wajib angka >= 0';
  }
  if (body.satuan !== undefined && !SATUAN.includes(body.satuan))
    return `satuan harus salah satu dari: ${SATUAN.join(', ')}`;
  if (body.estimasi_hari !== undefined) {
    const e = toNumber(body.estimasi_hari);
    if (Number.isNaN(e) || e < 0 || !Number.isInteger(e)) return 'estimasi_hari harus bilangan bulat >= 0';
  }
  return null;
};

/* GET /api/layanan?aktif=1 */
const getAllLayanan = async (req, res) => {
  try {
    const data = await layananModel.findAllLayanan(req.query.aktif === '1');
    success(res, 200, 'Berhasil mengambil semua layanan', data);
  } catch (error) {
    console.error('[getAllLayanan]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* GET /api/layanan/:id */
const getLayananById = async (req, res) => {
  try {
    const data = await layananModel.findLayananById(req.params.id);
    if (!data) return fail(res, 404, 'Layanan tidak ditemukan');
    success(res, 200, 'Berhasil mengambil layanan', data);
  } catch (error) {
    console.error('[getLayananById]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* POST /api/layanan */
const createLayanan = async (req, res) => {
  try {
    const err = validateLayanan(req.body);
    if (err) return fail(res, 400, 'Validasi gagal', err);
    const created = await layananModel.createLayanan(req.body);
    success(res, 201, 'Layanan berhasil dibuat', created);
  } catch (error) {
    console.error('[createLayanan]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* POST /api/layanan/bulk */
const bulkCreateLayanan = async (req, res) => {
  try {
    const { layanan } = req.body;
    if (!Array.isArray(layanan) || layanan.length === 0)
      return fail(res, 400, 'Validasi gagal', 'layanan harus berupa array yang tidak kosong');

    for (const [i, item] of layanan.entries()) {
      const err = validateLayanan(item || {});
      if (err) return fail(res, 400, 'Validasi gagal', `layanan[${i}]: ${err}`);
    }

    const created = await layananModel.bulkCreateLayanan(layanan);
    success(res, 201, `${created.length} layanan berhasil dibuat`, created);
  } catch (error) {
    console.error('[bulkCreateLayanan]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* PUT /api/layanan/:id */
const updateLayanan = async (req, res) => {
  try {
    const err = validateLayanan(req.body, true);
    if (err) return fail(res, 400, 'Validasi gagal', err);
    const updated = await layananModel.updateLayanan(req.params.id, req.body);
    if (!updated) return fail(res, 404, 'Layanan tidak ditemukan');
    success(res, 200, 'Layanan berhasil diupdate', updated);
  } catch (error) {
    console.error('[updateLayanan]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* DELETE /api/layanan/:id */
const deleteLayanan = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await layananModel.findLayananById(id);
    if (!existing) return fail(res, 404, 'Layanan tidak ditemukan');

    const used = await layananModel.countPesananByLayanan(id);
    if (used > 0)
      return fail(
        res,
        409,
        'Layanan tidak bisa dihapus',
        `Layanan dipakai di ${used} pesanan. Nonaktifkan saja (is_active = 0).`
      );

    await layananModel.deleteLayanan(id);
    success(res, 200, 'Layanan berhasil dihapus');
  } catch (error) {
    console.error('[deleteLayanan]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  getAllLayanan,
  getLayananById,
  createLayanan,
  bulkCreateLayanan,
  updateLayanan,
  deleteLayanan,
};
