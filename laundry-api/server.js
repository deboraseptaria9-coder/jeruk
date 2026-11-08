require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./src/config/database');
const testRoutes = require('./src/routes/test');
const productRoutes = require('./src/routes/productRoutes');

// ---- Laundry ----
const pelangganRoutes = require('./src/routes/pelangganRoutes');
const layananRoutes = require('./src/routes/layananRoutes');
const pesananRoutes = require('./src/routes/pesananRoutes');
const { getDashboard } = require('./src/controllers/pesananController');
const { login, requireAuth } = require('./src/middlewares_helpers/auth');

const app = express();
const PORT = process.env.PORT || 3000;

/* Middleware */
app.use(cors()); // izinkan Web, Mobile, Desktop mengakses API
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Auth: login terbuka, seluruh endpoint data memerlukan JWT yang valid. */
app.post('/api/auth/login', login);
app.use('/api', (req, res, next) => {
  if (req.path === '/' || req.path === '/auth/login') return next();
  return requireAuth(req, res, next);
});

/* Log sederhana setiap request (membantu saat demo 3 client) */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl}`);
  next();
});

/* Root route */
app.get('/', (req, res) => {
  res.json({
    message: '🧺 Laundry API is running',
    endpoints: {
      'GET    /api/dashboard': 'Ringkasan (jumlah pesanan, pendapatan, dll)',
      'POST   /api/auth/login': 'Login admin dan mendapatkan JWT',
      'GET    /api/pelanggan': 'Ambil semua pelanggan (?search=)',
      'GET    /api/pelanggan/:id': 'Ambil pelanggan by id',
      'POST   /api/pelanggan': 'Buat pelanggan baru',
      'PUT    /api/pelanggan/:id': 'Update pelanggan',
      'DELETE /api/pelanggan/:id': 'Hapus pelanggan',
      'GET    /api/layanan': 'Ambil semua layanan (?aktif=1)',
      'GET    /api/layanan/:id': 'Ambil layanan by id',
      'POST   /api/layanan': 'Buat layanan baru',
      'POST   /api/layanan/bulk': 'Buat banyak layanan sekaligus',
      'PUT    /api/layanan/:id': 'Update layanan',
      'DELETE /api/layanan/:id': 'Hapus layanan',
      'GET    /api/pesanan': 'Ambil semua pesanan (?status=&status_bayar=&pelanggan_id=&search=)',
      'GET    /api/pesanan/:id': 'Ambil pesanan by id',
      'POST   /api/pesanan': 'Buat pesanan baru (total dihitung server)',
      'PUT    /api/pesanan/:id': 'Update data pesanan',
      'PATCH  /api/pesanan/:id/status': 'Update status cucian',
      'DELETE /api/pesanan/:id': 'Hapus pesanan',
    },
  });
});

/* Routes */
app.use('/api/test', testRoutes);
app.use('/api/products', productRoutes); // bawaan template
app.get('/api/dashboard', getDashboard);
app.use('/api/pelanggan', pelangganRoutes);
app.use('/api/layanan', layananRoutes);
app.use('/api/pesanan', pesananRoutes);

/* 404 */
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

/* Error handler (mis. body JSON tidak valid dari Postman) */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ success: false, message: 'Body JSON tidak valid', error: err.message });
  }
  console.error('[unhandled]', err);
  res.status(500).json({ success: false, message: 'Server Error', error: err.message });
});

/* Start */
(async () => {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
  });
})();
