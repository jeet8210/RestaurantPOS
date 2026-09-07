const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authRequired, allowRoles } = require('../middleware/auth');

const router = express.Router();

// One-time setup: create the first admin if no users exist
router.post('/setup-admin', async (req, res) => {
  const count = await User.countDocuments();
  if (count > 0) return res.status(400).json({ message: 'Admin already exists. Use /login.' });
  const { name, username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, username, password: hashed, role: 'admin' });
  res.json({ message: 'Admin created', user: { id: user._id, name: user.name, username: user.username } });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, active: true });
  if (!user) return res.status(400).json({ message: 'Invalid username or password' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: 'Invalid username or password' });
  const token = jwt.sign({ id: user._id, name: user.name, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, user: { id: user._id, name: user.name, role: user.role, username: user.username } });
});

// Admin-only: create staff accounts (cashier / manager)
router.post('/staff', authRequired, allowRoles('admin'), async (req, res) => {
  const { name, username, password, role } = req.body;
  const exists = await User.findOne({ username });
  if (exists) return res.status(400).json({ message: 'Username already taken' });
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, username, password: hashed, role });
  res.json({ id: user._id, name: user.name, username: user.username, role: user.role });
});

router.get('/staff', authRequired, allowRoles('admin'), async (req, res) => {
  const users = await User.find().select('-password');
  res.json(users);
});

router.delete('/staff/:id', authRequired, allowRoles('admin'), async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { active: false });
  res.json({ message: 'Staff deactivated' });
});

module.exports = router;
