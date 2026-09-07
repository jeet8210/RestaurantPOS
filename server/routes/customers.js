const express = require('express');
const Customer = require('../models/Customer');
const { authRequired } = require('../middleware/auth');
const router = express.Router();

router.get('/', authRequired, async (req, res) => {
  res.json(await Customer.find().sort({ createdAt: -1 }));
});

router.post('/find-or-create', authRequired, async (req, res) => {
  const { phone, name } = req.body;
  let customer = await Customer.findOne({ phone });
  if (!customer) customer = await Customer.create({ phone, name });
  res.json(customer);
});

// Visit history for a customer
router.get('/:id/history', authRequired, async (req, res) => {
  const Order = require('../models/Order');
  const orders = await Order.find({ customer: req.params.id }).sort({ createdAt: -1 });
  res.json(orders);
});

module.exports = router;
