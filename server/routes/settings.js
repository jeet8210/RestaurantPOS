const express = require('express');
const Settings = require('../models/Settings');
const { authRequired, allowRoles } = require('../middleware/auth');
const router = express.Router();

router.get('/', authRequired, async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create({});
  res.json(settings);
});

router.put('/', authRequired, allowRoles('admin'), async (req, res) => {
  let settings = await Settings.findOne();
  if (!settings) settings = await Settings.create(req.body);
  else settings = await Settings.findByIdAndUpdate(settings._id, req.body, { new: true });
  res.json(settings);
});

module.exports = router;
