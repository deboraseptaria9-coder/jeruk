const express = require('express');
const router = express.Router();
const c = require('../controllers/pesananController');

router.get('/',             c.getAllPesanan);
router.get('/:id',          c.getPesananById);
router.post('/',            c.createPesanan);
router.put('/:id',          c.updatePesanan);
router.patch('/:id/status', c.updateStatusPesanan);
router.delete('/:id',       c.deletePesanan);

module.exports = router;
