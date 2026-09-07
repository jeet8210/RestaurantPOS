const express = require('express');
const Order = require('../models/Order');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

// KOT screen: shows orders that are not yet served
router.get('/', authRequired, async (req, res) => {
  const orders = await Order.find({ kitchenStatus: { $ne: 'served' } })
    .populate('table')
    .sort({ createdAt: 1 });
  res.json(orders);
});

router.put('/:id/status', authRequired, async (req, res) => {
  const { kitchenStatus } = req.body; // 'preparing' | 'ready' | 'served'
  const order = await Order.findByIdAndUpdate(req.params.id, { kitchenStatus }, { new: true });
  res.json(order);
});

module.exports = router;
