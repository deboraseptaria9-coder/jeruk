// Menghapus database.sqlite supaya data awal (seed) dibuat ulang saat server start.
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.sqlite');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️  database.sqlite dihapus. Jalankan "npm run dev" untuk membuat ulang.');
} else {
  console.log('ℹ️  database.sqlite belum ada, tidak ada yang dihapus.');
}
