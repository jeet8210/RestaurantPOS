const express = require('express');
const Inventory = require('../models/Inventory');
const { authRequired, allowRoles } = require('../middleware/auth');
const router = express.Router();

router.get('/', authRequired, async (req, res) => {
  res.json(await Inventory.find().sort({ name: 1 }));
});

router.post('/', authRequired, allowRoles('admin', 'manager'), async (req, res) => {
  const item = await Inventory.create(req.body);
  res.json(item);
});

router.put('/:id', authRequired, allowRoles('admin', 'manager'), async (req, res) => {
  const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(item);
});

router.delete('/:id', authRequired, allowRoles('admin', 'manager'), async (req, res) => {
  await Inventory.findByIdAndDelete(req.params.id);
  res.json({ message: 'Inventory item deleted' });
});

// Items at or below their low-stock threshold
router.get('/alerts/low-stock', authRequired, async (req, res) => {
  const items = await Inventory.find();
  const low = items.filter(i => i.quantity <= i.lowStockThreshold);
  res.json(low);
});

module.exports = router;
