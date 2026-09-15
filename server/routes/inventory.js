const express = require("express");

const Inventory = require("../models/Inventory");

const { authRequired, allowRoles } = require("../middleware/auth");

const router = express.Router();

// Get only this restaurant's inventory
router.get("/", authRequired, async (req, res) => {
  try {
    const items = await Inventory.find({
      restaurantId: req.user.restaurantId,
    }).sort({ name: 1 });

    res.json(items);
  } catch (error) {
    console.error("Get inventory error:", error.message);
    res.status(500).json({ message: "Failed to load inventory" });
  }
});

// Create inventory item for the logged-in restaurant
router.post(
  "/",
  authRequired,
  allowRoles("admin", "manager"),
  async (req, res) => {
    try {
      const { name, unit, quantity, lowStockThreshold } = req.body;

      if (!name?.trim()) {
        return res.status(400).json({ message: "Item name is required" });
      }

      const item = await Inventory.create({
        name: name.trim(),
        unit: unit || "kg",
        quantity: quantity ?? 0,
        lowStockThreshold: lowStockThreshold ?? 5,
        restaurantId: req.user.restaurantId,
      });

      res.status(201).json(item);
    } catch (error) {
      console.error("Add inventory error:", error.message);
      res.status(500).json({ message: "Failed to add inventory item" });
    }
  }
);

// Update only this restaurant's inventory item
router.put(
  "/:id",
  authRequired,
  allowRoles("admin", "manager"),
  async (req, res) => {
    try {
      const { name, unit, quantity, lowStockThreshold } = req.body;

      const item = await Inventory.findOneAndUpdate(
        {
          _id: req.params.id,
          restaurantId: req.user.restaurantId,
        },
        {
          name,
          unit,
          quantity,
          lowStockThreshold,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }

      res.json(item);
    } catch (error) {
      console.error("Update inventory error:", error.message);
      res.status(500).json({ message: "Failed to update inventory item" });
    }
  }
);

// Delete only this restaurant's inventory item
router.delete(
  "/:id",
  authRequired,
  allowRoles("admin", "manager"),
  async (req, res) => {
    try {
      const item = await Inventory.findOneAndDelete({
        _id: req.params.id,
        restaurantId: req.user.restaurantId,
      });

      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }

      res.json({ message: "Inventory item deleted" });
    } catch (error) {
      console.error("Delete inventory error:", error.message);
      res.status(500).json({ message: "Failed to delete inventory item" });
    }
  }
);

// Items at or below their low-stock threshold
router.get("/alerts/low-stock", authRequired, async (req, res) => {
  try {
    const items = await Inventory.find({
      restaurantId: req.user.restaurantId,
    }).sort({ name: 1 });

    const low = items.filter(
      (item) => item.quantity <= item.lowStockThreshold
    );

    res.json(low);
  } catch (error) {
    console.error("Low stock alerts error:", error.message);
    res.status(500).json({ message: "Failed to load low-stock alerts" });
  }
});

module.exports = router;