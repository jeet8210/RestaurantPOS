router.post('/setup-admin', async (req, res) => {
  try {
    const { name, username, password, key } = req.body;

    // TEMPORARY: reset existing admin password
    if (key && key === process.env.ADMIN_RESET_KEY) {
      const user = await User.findOne({ username: 'admin' });

      if (!user) {
        return res.status(404).json({ message: 'Admin user not found' });
      }

      user.password = await bcrypt.hash(password, 10);
      user.active = true;
      await user.save();

      return res.json({ message: 'Admin password reset successfully' });
    }

    const count = await User.countDocuments();

    if (count > 0) {
      return res.status(400).json({
        message: 'Admin already exists. Use /login.'
      });
    }
a
    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username,
      password: hashed,
      role: 'admin'
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
    res.status(500).json({ message: 'Server error' });
  }
});