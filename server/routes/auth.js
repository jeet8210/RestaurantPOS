const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Restaurant = require("../models/Restaurant");
const { authRequired, allowRoles } = require("../middleware/auth");

const router = express.Router();

// TEMPORARY: create/reset admin using reset key
// TEMPORARY: create/reset admin using reset key
router.post("/setup-admin", async (req, res) => {
  try {
    const { name, username, password, key } = req.body;

    // TEMPORARY ADMIN SETUP
    if (key && key === process.env.ADMIN_RESET_KEY) {
      if (!password || password.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters",
        });
      }

      let user = await User.findOne({ username: "admin" });

      // If admin does not exist, create admin + restaurant
      if (!user) {
        const hashed = await bcrypt.hash(password, 10);

        const restaurant = await Restaurant.create({
          name: name || "My Restaurant",
          active: true,
        });

        user = await User.create({
          name: name || "Admin",
          username: "admin",
          password: hashed,
          role: "admin",
          restaurantId: restaurant._id,
          active: true,
        });

        restaurant.owner = user._id;
        await restaurant.save();

        return res.json({
          message: "Admin and restaurant created successfully",
        });
      }

      // Existing admin already has restaurant
      if (!user.restaurantId) {
        const restaurant = await Restaurant.create({
          name: name || "My Restaurant",
          active: true,
        });

        user.restaurantId = restaurant._id;
        restaurant.owner = user._id;

        await restaurant.save();
      }

      // Reset password
      user.password = await bcrypt.hash(password, 10);
      user.role = "admin";
      user.active = true;

      await user.save();

      return res.json({
        message: "Admin password reset successfully",
      });
    }

    // Normal one-time setup
    const count = await User.countDocuments();

    if (count > 0) {
      return res.status(400).json({
        message: "Admin already exists. Use /login.",
      });
    }

    if (!name || !username || !password) {
      return res.status(400).json({
        message: "Name, username and password are required",
      });
    }

    const existingUsername = await User.findOne({ username });

    if (existingUsername) {
      return res.status(400).json({
        message: "Username already taken",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Create restaurant first
    const restaurant = await Restaurant.create({
      name: "My Restaurant",
      active: true,
    });

    // Create admin inside that restaurant
    const user = await User.create({
      name,
      username,
      password: hashed,
      role: "admin",
      restaurantId: restaurant._id,
      active: true,
    });

    // Connect restaurant owner
    restaurant.owner = user._id;
    await restaurant.save();

    res.json({
      message: "Admin created",
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        restaurantId: user.restaurantId,
      },
    });
  } catch (error) {
    console.error("Setup admin error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({
    username,
    active: true,
  });

  if (!user) {
    return res.status(400).json({
      message: "Invalid username or password",
    });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(400).json({
      message: "Invalid username or password",
    });
  }

  const token = jwt.sign(
    {
      id: user._id,
      name: user.name,
      role: user.role,
      username: user.username,
      restaurantId: user.restaurantId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "12h",
    },
  );

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      username: user.username,
      restaurantId: user.restaurantId,
    },
  });
});

// Admin-only: create staff accounts
router.post("/staff", authRequired, allowRoles("admin"), async (req, res) => {
  const { name, username, password, role } = req.body;

  const exists = await User.findOne({ username });

  if (exists) {
    return res.status(400).json({
      message: "Username already taken",
    });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    username,
    password: hashed,
    role,
  });

  res.json({
    id: user._id,
    name: user.name,
    username: user.username,
    role: user.role,
  });
});

router.get("/staff", authRequired, allowRoles("admin"), async (req, res) => {
  const users = await User.find({
    restaurantId: req.user.restaurantId,
  }).select("-password");

  res.json(users);
});

router.delete(
  "/staff/:id",
  authRequired,
  allowRoles("admin"),
  async (req, res) => {
    const user = await User.findOneAndUpdate(
      {
        _id: req.params.id,
        restaurantId: req.user.restaurantId,
      },
      {
        active: false,
      },
      {
        new: true,
      },
    );

    if (!user) {
      return res.status(404).json({
        message: "Staff member not found",
      });
    }

    res.json({
      message: "Staff deactivated",
    });
  },
);

// PUBLIC: Create a new restaurant + admin account
router.post("/signup", async (req, res) => {
  try {
    const { restaurantName, name, username, password } = req.body;

    // Validate required fields
    if (!restaurantName || !name || !username || !password) {
      return res.status(400).json({
        message:
          "Restaurant name, admin name, username and password are required",
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    // Clean username
    const cleanUsername = username.trim().toLowerCase();

    // Check username globally
    const existingUser = await User.findOne({
      username: cleanUsername,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username already taken",
      });
    }

    // Create restaurant
    const restaurant = await Restaurant.create({
      name: restaurantName.trim(),
      active: true,
    });

    try {
      // Hash password
      const hashed = await bcrypt.hash(password, 10);

      // Create Admin
      const user = await User.create({
        name: name.trim(),
        username: cleanUsername,
        password: hashed,
        role: "admin",
        restaurantId: restaurant._id,
        active: true,
      });

      // Set restaurant owner
      restaurant.owner = user._id;
      await restaurant.save();

      return res.status(201).json({
        message: "Restaurant and admin account created successfully",
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          role: user.role,
          restaurantId: user.restaurantId,
        },
      });
    } catch (userError) {
      // If user creation fails, remove restaurant
      await Restaurant.findByIdAndDelete(restaurant._id);
      throw userError;
    }
  } catch (error) {
    console.error("Signup error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
});

module.exports = router;
