const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Restaurant = require("../models/Restaurant");

const { authRequired, allowRoles } = require("../middleware/auth");

const router = express.Router();

// ======================================================
// TEMPORARY: Create / Reset Admin
// ======================================================
router.post("/setup-admin", async (req, res) => {
  try {
    const { name, username, password, key } = req.body;

    // --------------------------------------------------
    // ADMIN RESET USING SECRET KEY
    // --------------------------------------------------
    if (key && key === process.env.ADMIN_RESET_KEY) {
      if (!password || password.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters",
        });
      }

      const cleanUsername = (username || "admin").trim().toLowerCase();

      let user = await User.findOne({
        username: cleanUsername,
      });

      // ------------------------------------------------
      // Admin does not exist -> create restaurant + admin
      // ------------------------------------------------
      if (!user) {
        const hashed = await bcrypt.hash(password, 10);

        const restaurant = await Restaurant.create({
          name: name?.trim() || "My Restaurant",
          active: true,
        });

        user = await User.create({
          name: name?.trim() || "Admin",
          username: cleanUsername,
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

      // ------------------------------------------------
      // Existing user has no restaurant -> create one
      // ------------------------------------------------
      if (!user.restaurantId) {
        const restaurant = await Restaurant.create({
          name: name?.trim() || "My Restaurant",
          active: true,
        });

        user.restaurantId = restaurant._id;

        restaurant.owner = user._id;

        await restaurant.save();
      }

      // ------------------------------------------------
      // Reset admin
      // ------------------------------------------------
      user.password = await bcrypt.hash(password, 10);
      user.role = "admin";
      user.active = true;

      await user.save();

      return res.json({
        message: "Admin password reset successfully",
      });
    }

    // ==================================================
    // NORMAL ONE-TIME ADMIN SETUP
    // ==================================================
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

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const cleanUsername = username.trim().toLowerCase();

    const existingUsername = await User.findOne({
      username: cleanUsername,
    });

    if (existingUsername) {
      return res.status(400).json({
        message: "Username already taken",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Create restaurant
    const restaurant = await Restaurant.create({
      name: "My Restaurant",
      active: true,
    });

    // Create admin inside restaurant
    const user = await User.create({
      name: name.trim(),
      username: cleanUsername,
      password: hashed,
      role: "admin",
      restaurantId: restaurant._id,
      active: true,
    });

    // Connect restaurant owner
    restaurant.owner = user._id;
    await restaurant.save();

    res.status(201).json({
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

// ======================================================
// LOGIN
// ======================================================
router.post("/login", async (req, res) => {
  try {
    const username = req.body.username?.trim().toLowerCase();
    const { password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required",
      });
    }

    const user = await User.findOne({
      username,
      active: true,
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid username or password",
      });
    }

    // Important: old users without restaurantId cannot
    // access the multi-tenant application.
    if (!user.restaurantId) {
      return res.status(403).json({
        message:
          "This account is not linked to a restaurant. Please contact the administrator.",
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
      }
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
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
});

// ======================================================
// ADMIN: CREATE STAFF
// ======================================================
router.post(
  "/staff",
  authRequired,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { name, username, password, role } = req.body;

      if (!name || !username || !password || !role) {
        return res.status(400).json({
          message: "Name, username, password and role are required",
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          message: "Password must be at least 8 characters",
        });
      }

      // Only allowed staff roles
      if (!["manager", "cashier"].includes(role)) {
        return res.status(400).json({
          message: "Staff role must be manager or cashier",
        });
      }

      const cleanUsername = username.trim().toLowerCase();

      // Username is globally unique in the current system
      const exists = await User.findOne({
        username: cleanUsername,
      });

      if (exists) {
        return res.status(400).json({
          message: "Username already taken",
        });
      }

      const hashed = await bcrypt.hash(password, 10);

      // IMPORTANT:
      // Staff gets the SAME restaurantId as the logged-in admin
      const user = await User.create({
        name: name.trim(),
        username: cleanUsername,
        password: hashed,
        role,
        restaurantId: req.user.restaurantId,
        active: true,
      });

      res.status(201).json({
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        restaurantId: user.restaurantId,
      });
    } catch (error) {
      console.error("Create staff error:", error.message);

      res.status(500).json({
        message: "Failed to create staff account",
      });
    }
  }
);

// ======================================================
// ADMIN: GET STAFF
// ======================================================
router.get(
  "/staff",
  authRequired,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const users = await User.find({
        restaurantId: req.user.restaurantId,
      })
        .select("-password")
        .sort({ createdAt: -1 });

      res.json(users);
    } catch (error) {
      console.error("Get staff error:", error.message);

      res.status(500).json({
        message: "Failed to load staff",
      });
    }
  }
);

// ======================================================
// ADMIN: DEACTIVATE STAFF
// ======================================================
router.delete(
  "/staff/:id",
  authRequired,
  allowRoles("admin"),
  async (req, res) => {
    try {
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
        }
      );

      if (!user) {
        return res.status(404).json({
          message: "Staff member not found",
        });
      }

      res.json({
        message: "Staff deactivated",
      });
    } catch (error) {
      console.error("Delete staff error:", error.message);

      res.status(500).json({
        message: "Failed to deactivate staff",
      });
    }
  }
);

// ======================================================
// PUBLIC: RESTAURANT SIGNUP
// ======================================================
router.post("/signup", async (req, res) => {
  try {
    const {
      restaurantName,
      name,
      username,
      password,
    } = req.body;

    // --------------------------------------------------
    // Validate
    // --------------------------------------------------
    if (!restaurantName || !name || !username || !password) {
      return res.status(400).json({
        message:
          "Restaurant name, admin name, username and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const cleanRestaurantName = restaurantName.trim();
    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanRestaurantName || !cleanName || !cleanUsername) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // --------------------------------------------------
    // Username must currently be globally unique
    // --------------------------------------------------
    const existingUser = await User.findOne({
      username: cleanUsername,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Username already taken",
      });
    }

    // --------------------------------------------------
    // Create restaurant
    // --------------------------------------------------
    const restaurant = await Restaurant.create({
      name: cleanRestaurantName,
      active: true,
    });

    try {
      const hashed = await bcrypt.hash(password, 10);

      // ------------------------------------------------
      // Create restaurant admin
      // ------------------------------------------------
      const user = await User.create({
        name: cleanName,
        username: cleanUsername,
        password: hashed,
        role: "admin",
        restaurantId: restaurant._id,
        active: true,
      });

      // ------------------------------------------------
      // Set restaurant owner
      // ------------------------------------------------
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