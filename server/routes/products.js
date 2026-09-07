const express = require('express');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');
const { authRequired, allowRoles } = require('../middleware/auth');
const router = express.Router();

router.get('/', authRequired, async (req, res) => {
  res.json(await Product.find({ active: true }).populate('category'));
});

router.post('/', authRequired, allowRoles('admin', 'manager'), async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
});

router.put('/:id', authRequired, allowRoles('admin', 'manager'), async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(product);
});

router.delete('/:id', authRequired, allowRoles('admin', 'manager'), async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { active: false });
  await AuditLog.create({
    user: req.user.id, userName: req.user.name,
    action: 'DELETE_PRODUCT', target: product ? product.name : req.params.id,
    details: 'Item removed from menu',
  });
  res.json({ message: 'Product removed' });
});

module.exports = router;
