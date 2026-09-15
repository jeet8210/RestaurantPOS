const express = require("express");

const Category = require("../models/Category");

const { authRequired, allowRoles } = require("../middleware/auth");

const router = express.Router();

// Get categories for logged-in restaurant only
router.get("/", authRequired, async (req, res) => {
  try {
    const categories = await Category.find({
      restaurantId: req.user.restaurantId,
    }).sort({ name: 1 });

    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error.message);
    res.status(500).json({ message: "Failed to load categories" });
  }
});

// Add category
router.post(
  "/",
  authRequired,
  allowRoles("admin", "manager"),
  async (req, res) => {
    try {
      const name = req.body.name?.trim();

      if (!name) {
        return res.status(400).json({
          message: "Category name is required",
        });
      }

      const existing = await Category.findOne({
        name,
        restaurantId: req.user.restaurantId,
      });

      if (existing) {
        return res.status(400).json({
          message: "Category already exists",
        });
      }

      const cat = await Category.create({
        name,
        restaurantId: req.user.restaurantId,
      });

      res.status(201).json(cat);
    } catch (error) {
      console.error("Add category error:", error.message);
      res.status(500).json({
        message: "Failed to add category",
      });
    }
  }
);

// Delete category
router.delete(
  "/:id",
  authRequired,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const category = await Category.findOneAndDelete({
        _id: req.params.id,
        restaurantId: req.user.restaurantId,
      });

      if (!category) {
        return res.status(404).json({
          message: "Category not found",
        });
      }

      res.json({
        message: "Category deleted",
      });
    } catch (error) {
      console.error("Delete category error:", error.message);
      res.status(500).json({
        message: "Failed to delete category",
      });
    }
  }
);

module.exports = router;