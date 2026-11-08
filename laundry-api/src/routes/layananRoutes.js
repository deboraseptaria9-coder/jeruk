const express = require('express');
const router = express.Router();
const c = require('../controllers/layananController');

router.get('/',       c.getAllLayanan);
router.post('/bulk',  c.bulkCreateLayanan); // taruh sebelum '/:id'
router.get('/:id',    c.getLayananById);
router.post('/',      c.createLayanan);
router.put('/:id',    c.updateLayanan);
router.delete('/:id', c.deleteLayanan);

module.exports = router;
