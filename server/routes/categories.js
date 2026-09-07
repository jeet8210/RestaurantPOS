const express = require('express');
const Category = require('../models/Category');
const { authRequired, allowRoles } = require('../middleware/auth');
const router = express.Router();

router.get('/', authRequired, async (req, res) => {
  res.json(await Category.find().sort({ name: 1 }));
});

router.post('/', authRequired, allowRoles('admin', 'manager'), async (req, res) => {
  const cat = await Category.create({ name: req.body.name });
  res.json(cat);
});

router.delete('/:id', authRequired, allowRoles('admin'), async (req, res) => {
  await Category.findByIdAndDelete(req.params.id);
  res.json({ message: 'Category deleted' });
});

module.exports = router;
