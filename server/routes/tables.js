const express = require('express');
const Table = require('../models/Table');
const { authRequired, allowRoles } = require('../middleware/auth');
const router = express.Router();

router.get('/', authRequired, async (req, res) => {
  res.json(await Table.find().sort({ label: 1 }));
});

router.post('/', authRequired, allowRoles('admin', 'manager'), async (req, res) => {
  const table = await Table.create({ label: req.body.label });
  res.json(table);
});

router.put('/:id/status', authRequired, async (req, res) => {
  const table = await Table.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json(table);
});

router.delete('/:id', authRequired, allowRoles('admin'), async (req, res) => {
  await Table.findByIdAndDelete(req.params.id);
  res.json({ message: 'Table deleted' });
});

module.exports = router;
