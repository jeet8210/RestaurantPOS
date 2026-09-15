const express = require("express");

const Table = require("../models/Table");

const { authRequired, allowRoles } = require("../middleware/auth");

const router = express.Router();

// Get only this restaurant's tables
router.get("/", authRequired, async (req, res) => {
  try {
    const tables = await Table.find({
      restaurantId: req.user.restaurantId,
    }).sort({ label: 1 });

    res.json(tables);
  } catch (error) {
    console.error("Get tables error:", error.message);
    res.status(500).json({ message: "Failed to load tables" });
  }
});

// Create table for the logged-in restaurant
router.post(
  "/",
  authRequired,
  allowRoles("admin", "manager"),
  async (req, res) => {
    try {
      const label = req.body.label?.trim();

      if (!label) {
        return res.status(400).json({ message: "Table label is required" });
      }

      const existing = await Table.findOne({
        label,
        restaurantId: req.user.restaurantId,
      });

      if (existing) {
        return res.status(400).json({ message: "Table already exists" });
      }

      const table = await Table.create({
        label,
        restaurantId: req.user.restaurantId,
      });

      res.status(201).json(table);
    } catch (error) {
      console.error("Add table error:", error.message);
      res.status(500).json({ message: "Failed to add table" });
    }
  }
);

// Update only this restaurant's table status
router.put("/:id/status", authRequired, async (req, res) => {
  try {
    const table = await Table.findOneAndUpdate(
      {
        _id: req.params.id,
        restaurantId: req.user.restaurantId,
      },
      {
        status: req.body.status,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!table) {
      return res.status(404).json({ message: "Table not found" });
    }

    res.json(table);
  } catch (error) {
    console.error("Update table status error:", error.message);
    res.status(500).json({ message: "Failed to update table status" });
  }
});

// Delete only this restaurant's table
router.delete(
  "/:id",
  authRequired,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const table = await Table.findOneAndDelete({
        _id: req.params.id,
        restaurantId: req.user.restaurantId,
      });

      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }

      res.json({ message: "Table deleted" });
    } catch (error) {
      console.error("Delete table error:", error.message);
      res.status(500).json({ message: "Failed to delete table" });
    }
  }
);

module.exports = router;