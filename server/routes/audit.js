const express = require('express');
const AuditLog = require('../models/AuditLog');
const { authRequired, allowRoles } = require('../middleware/auth');
const router = express.Router();

router.get('/', authRequired, allowRoles('admin'), async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
  res.json(logs);
});

module.exports = router;
