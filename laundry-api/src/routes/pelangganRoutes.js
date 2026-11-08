const express = require('express');
const router = express.Router();
const c = require('../controllers/pelangganController');

router.get('/',       c.getAllPelanggan);
router.get('/:id',    c.getPelangganById);
router.post('/',      c.createPelanggan);
router.put('/:id',    c.updatePelanggan);
router.delete('/:id', c.deletePelanggan);

module.exports = router;
