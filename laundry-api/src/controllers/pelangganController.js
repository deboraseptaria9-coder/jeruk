const pelangganModel = require('../models/pelangganModel');
const { success, fail, isFilled } = require('../middlewares_helpers/response');

/* Validasi no HP: 10–15 digit, boleh diawali + */
const isValidNoHp = (v) => typeof v === 'string' && /^\+?[0-9]{10,15}$/.test(v.trim());

/* GET /api/pelanggan?search= */
const getAllPelanggan = async (req, res) => {
  try {
    const data = await pelangganModel.findAllPelanggan(req.query.search);
    success(res, 200, 'Berhasil mengambil semua pelanggan', data);
  } catch (error) {
    console.error('[getAllPelanggan]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* GET /api/pelanggan/:id */
const getPelangganById = async (req, res) => {
  try {
    const data = await pelangganModel.findPelangganById(req.params.id);
    if (!data) return fail(res, 404, 'Pelanggan tidak ditemukan');
    success(res, 200, 'Berhasil mengambil pelanggan', data);
  } catch (error) {
    console.error('[getPelangganById]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* POST /api/pelanggan */
const createPelanggan = async (req, res) => {
  try {
    const { nama, no_hp } = req.body;
    if (!isFilled(nama)) return fail(res, 400, 'Validasi gagal', 'nama wajib diisi');
    if (!isValidNoHp(no_hp))
      return fail(res, 400, 'Validasi gagal', 'no_hp wajib diisi, 10-15 digit angka');

    if (await pelangganModel.findPelangganByNoHp(no_hp.trim()))
      return fail(res, 409, 'Validasi gagal', 'no_hp sudah terdaftar');

    const created = await pelangganModel.createPelanggan(req.body);
    success(res, 201, 'Pelanggan berhasil dibuat', created);
  } catch (error) {
    console.error('[createPelanggan]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* PUT /api/pelanggan/:id */
const updatePelanggan = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, no_hp } = req.body;

    if (nama !== undefined && !isFilled(nama))
      return fail(res, 400, 'Validasi gagal', 'nama tidak boleh kosong');
    if (no_hp !== undefined) {
      if (!isValidNoHp(no_hp))
        return fail(res, 400, 'Validasi gagal', 'no_hp harus 10-15 digit angka');
      const owner = await pelangganModel.findPelangganByNoHp(no_hp.trim());
      if (owner && String(owner.id) !== String(id))
        return fail(res, 409, 'Validasi gagal', 'no_hp sudah dipakai pelanggan lain');
    }

    const updated = await pelangganModel.updatePelanggan(id, req.body);
    if (!updated) return fail(res, 404, 'Pelanggan tidak ditemukan');
    success(res, 200, 'Pelanggan berhasil diupdate', updated);
  } catch (error) {
    console.error('[updatePelanggan]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

/* DELETE /api/pelanggan/:id */
const deletePelanggan = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pelangganModel.findPelangganById(id);
    if (!existing) return fail(res, 404, 'Pelanggan tidak ditemukan');

    const totalPesanan = await pelangganModel.countPesananByPelanggan(id);
    if (totalPesanan > 0)
      return fail(
        res,
        409,
        'Pelanggan tidak bisa dihapus',
        `Pelanggan masih memiliki ${totalPesanan} pesanan`
      );

    await pelangganModel.deletePelanggan(id);
    success(res, 200, 'Pelanggan berhasil dihapus');
  } catch (error) {
    console.error('[deletePelanggan]', error);
    fail(res, 500, 'Server Error', error.message);
  }
};

module.exports = {
  getAllPelanggan,
  getPelangganById,
  createPelanggan,
  updatePelanggan,
  deletePelanggan,
};
