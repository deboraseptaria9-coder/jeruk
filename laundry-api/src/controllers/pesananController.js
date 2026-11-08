const pesananModel = require('../models/pesananModel');
const pelangganModel = require('../models/pelangganModel');
const layananModel = require('../models/layananModel');
const { success, fail, toNumber } = require('../middlewares_helpers/response');

const STATUS = ['diterima', 'dicuci', 'disetrika', 'selesai', 'diambil', 'dibatalkan'];
const STATUS_BAYAR = ['belum_bayar', 'lunas'];

/* GET /api/pesanan?status=&status_bayar=&pelanggan_id=&search= */
const getAllPesanan = async (req, res) => {
  try {
    const { status, status_bayar, pelanggan_id, search } = req.query;
    if (status && !STATUS.includes(status))
      return fail(res, 400, 'Validasi gagal', `status harus salah satu dari: ${STATUS.join(', ')}`);
    const data = await pesananModel.findAllPesanan({ status, status_bayar, pelanggan_id, search });
    success(res, 200, 'Berhasil mengambil semua pesanan', data);
  } catch (error) {
    console.error('[getAllPesanan]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* GET /api/pesanan/:id */
const getPesananById = async (req, res) => {
  try {
    const data = await pesananModel.findPesananById(req.params.id);
    if (!data) return fail(res, 404, 'Pesanan tidak ditemukan');
    success(res, 200, 'Berhasil mengambil pesanan', data);
  } catch (error) {
    console.error('[getPesananById]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* POST /api/pesanan
 * Body: { pelanggan_id, layanan_id, jumlah, catatan?, status_bayar? }
 * total_harga DIHITUNG SERVER = jumlah x harga layanan
 */
const createPesanan = async (req, res) => {
  try {
    const { pelanggan_id, layanan_id, jumlah, status_bayar } = req.body;

    if (!pelanggan_id) return fail(res, 400, 'Validasi gagal', 'pelanggan_id wajib diisi');
    if (!layanan_id) return fail(res, 400, 'Validasi gagal', 'layanan_id wajib diisi');
    const qty = toNumber(jumlah);
    if (Number.isNaN(qty) || qty <= 0)
      return fail(res, 400, 'Validasi gagal', 'jumlah wajib angka > 0 (kg atau pcs)');
    if (status_bayar !== undefined && !STATUS_BAYAR.includes(status_bayar))
      return fail(res, 400, 'Validasi gagal', `status_bayar harus: ${STATUS_BAYAR.join(', ')}`);

    const pelanggan = await pelangganModel.findPelangganById(pelanggan_id);
    if (!pelanggan) return fail(res, 404, 'Pelanggan tidak ditemukan');

    const layanan = await layananModel.findLayananById(layanan_id);
    if (!layanan) return fail(res, 404, 'Layanan tidak ditemukan');
    if (!layanan.is_active) return fail(res, 400, 'Validasi gagal', 'Layanan sedang tidak aktif');
    if (layanan.satuan === 'pcs' && !Number.isInteger(qty))
      return fail(res, 400, 'Validasi gagal', 'jumlah untuk satuan pcs harus bilangan bulat');

    const created = await pesananModel.createPesanan(req.body, layanan);
    success(res, 201, 'Pesanan berhasil dibuat', created);
  } catch (error) {
    console.error('[createPesanan]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* PUT /api/pesanan/:id — ubah data pesanan (bukan status cucian) */
const updatePesanan = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pesananModel.findPesananById(id);
    if (!existing) return fail(res, 404, 'Pesanan tidak ditemukan');
    if (['diambil', 'dibatalkan'].includes(existing.status))
      return fail(res, 409, 'Pesanan tidak bisa diubah', `Pesanan sudah ${existing.status}`);

    const { pelanggan_id, layanan_id, jumlah, status_bayar } = req.body;

    if (status_bayar !== undefined && !STATUS_BAYAR.includes(status_bayar))
      return fail(res, 400, 'Validasi gagal', `status_bayar harus: ${STATUS_BAYAR.join(', ')}`);
    if (jumlah !== undefined) {
      const qty = toNumber(jumlah);
      if (Number.isNaN(qty) || qty <= 0) return fail(res, 400, 'Validasi gagal', 'jumlah wajib angka > 0');
    }
    if (pelanggan_id !== undefined && !(await pelangganModel.findPelangganById(pelanggan_id)))
      return fail(res, 404, 'Pelanggan tidak ditemukan');

    let layanan = null;
    if (layanan_id !== undefined && Number(layanan_id) !== existing.layanan_id) {
      layanan = await layananModel.findLayananById(layanan_id);
      if (!layanan) return fail(res, 404, 'Layanan tidak ditemukan');
      if (!layanan.is_active) return fail(res, 400, 'Validasi gagal', 'Layanan sedang tidak aktif');
    }

    const updated = await pesananModel.updatePesanan(id, req.body, layanan);
    success(res, 200, 'Pesanan berhasil diupdate', updated);
  } catch (error) {
    console.error('[updatePesanan]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* PATCH /api/pesanan/:id/status — Body: { status } */
const updateStatusPesanan = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!STATUS.includes(status))
      return fail(res, 400, 'Validasi gagal', `status harus salah satu dari: ${STATUS.join(', ')}`);

    const existing = await pesananModel.findPesananById(id);
    if (!existing) return fail(res, 404, 'Pesanan tidak ditemukan');

    // Aturan bisnis: cucian hanya boleh diambil jika sudah lunas
    if (status === 'diambil' && existing.status_bayar !== 'lunas')
      return fail(res, 409, 'Status tidak bisa diubah', 'Pesanan harus lunas sebelum diambil');
    if (existing.status === 'diambil')
      return fail(res, 409, 'Status tidak bisa diubah', 'Pesanan sudah diambil');

    const updated = await pesananModel.updateStatusPesanan(id, status);
    success(res, 200, `Status pesanan diubah menjadi "${status}"`, updated);
  } catch (error) {
    console.error('[updateStatusPesanan]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* DELETE /api/pesanan/:id */
const deletePesanan = async (req, res) => {
  try {
    const deleted = await pesananModel.deletePesanan(req.params.id);
    if (!deleted) return fail(res, 404, 'Pesanan tidak ditemukan');
    success(res, 200, 'Pesanan berhasil dihapus');
  } catch (error) {
    console.error('[deletePesanan]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* GET /api/dashboard */
const getDashboard = async (req, res) => {
  try {
    const data = await pesananModel.getDashboard();
    success(res, 200, 'Berhasil mengambil ringkasan', data);
  } catch (error) {
    console.error('[getDashboard]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  getAllPesanan,
  getPesananById,
  createPesanan,
  updatePesanan,
  updateStatusPesanan,
  deletePesanan,
  getDashboard,
};
