/* =========================================================
 *  Helper response standar — dipakai SEMUA controller
 *  supaya format JSON selalu sama:
 *  { success, message, data }  atau  { success, message, error }
 * ========================================================= */
const success = (res, code, message, data = null) =>
  res.status(code).json({ success: true, message, data });

const fail = (res, code, message, error = null) =>
  res.status(code).json({ success: false, message, error });

/* Cek string tidak kosong */
const isFilled = (v) => typeof v === 'string' && v.trim() !== '';

/* Cek angka valid (boleh dikirim sebagai string dari form, mis. "3.5") */
const toNumber = (v) => {
  if (v === undefined || v === null || v === '') return NaN;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

module.exports = { success, fail, isFilled, toNumber };
