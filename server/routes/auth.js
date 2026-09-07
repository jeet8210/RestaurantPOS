const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authRequired, allowRoles } = require('../middleware/auth');

const router = express.Router();

// TEMPORARY: create/reset admin using reset key
router.post('/setup-admin', async (req, res) => {
  try {
    const { name, username, password, key } = req.body;

    // TEMPORARY ADMIN SETUP
    if (key && key === process.env.ADMIN_RESET_KEY) {
      if (!password || password.length < 8) {
        return res.status(400).json({
          message: 'Password must be at least 8 characters'
        });
      }

      let user = await User.findOne({ username: 'admin' });

      // If admin does not exist, create it
      if (!user) {
        const hashed = await bcrypt.hash(password, 10);

        user = await User.create({
          name: name || 'Admin',
          username: 'admin',
          password: hashed,
          role: 'admin',
          active: true
        });

        return res.json({
          message: 'Admin created successfully'
        });
      }

      // If admin exists, reset password
      user.password = await bcrypt.hash(password, 10);
      user.role = 'admin';
      user.active = true;

      await user.save();

      return res.json({
        message: 'Admin password reset successfully'
      });
    }

    // Normal one-time setup
    const count = await User.countDocuments();

    if (count > 0) {
      return res.status(400).json({
        message: 'Admin already exists. Use /login.'
      });
    }

    if (!name || !username || !password) {
      return res.status(400).json({
        message: 'Name, username and password are required'
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      password: hashed,
      role: 'admin',
      active: true
    });

    res.json({
      message: 'Admin created',
      user: {
        id: user._id,
        name: user.name,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Setup admin error:', error.message);

    res.status(500).json({
      message: 'Server error'
    });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({
    username,
    active: true
  });

  if (!user) {
    return res.status(400).json({
      message: 'Invalid username or password'
    });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(400).json({
      message: 'Invalid username or password'
    });
  }

  const token = jwt.sign(
    {
      id: user._id,
      name: user.name,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '12h'
    }
  );

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      username: user.username
    }
  });
});

// Admin-only: create staff accounts
router.post(
  '/staff',
  authRequired,
  allowRoles('admin'),
  async (req, res) => {
    const { name, username, password, role } = req.body;

    const exists = await User.findOne({ username });

    if (exists) {
      return res.status(400).json({
        message: 'Username already taken'
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      password: hashed,
      role
    });

    res.json({
      id: user._id,
      name: user.name,
      username: user.username,
      role: user.role
    });
  }
);

router.get(
  '/staff',
  authRequired,
  allowRoles('admin'),
  async (req, res) => {
    const users = await User.find().select('-password');
    res.json(users);
  }
);

router.delete(
  '/staff/:id',
  authRequired,
  allowRoles('admin'),
  async (req, res) => {
    await User.findByIdAndUpdate(
      req.params.id,
      { active: false }
    );

    res.json({
      message: 'Staff deactivated'
    });
  }
);

module.exports = router;