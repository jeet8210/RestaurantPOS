const express = require("express");

const Order = require("../models/Order");

const { authRequired } = require("../middleware/auth");

const router = express.Router();

// KOT screen: shows only this restaurant's orders
// that are not yet served
router.get("/", authRequired, async (req, res) => {
  try {
    const orders = await Order.find({
      restaurantId: req.user.restaurantId,
      kitchenStatus: { $ne: "served" },
    })
      .populate("table")
      .sort({ createdAt: 1 });

    res.json(orders);
  } catch (error) {
    console.error("Get kitchen orders error:", error.message);
    res.status(500).json({ message: "Failed to load kitchen orders" });
  }
});

// Update kitchen status only for this restaurant's order
router.put("/:id/status", authRequired, async (req, res) => {
  try {
    const { kitchenStatus } = req.body;

    const allowedStatuses = ["preparing", "ready", "served"];

    if (!allowedStatuses.includes(kitchenStatus)) {
      return res.status(400).json({
        message: "Invalid kitchen status",
      });
    }

    const order = await Order.findOneAndUpdate(
      {
        _id: req.params.id,
        restaurantId: req.user.restaurantId,
      },
      {
        kitchenStatus,
      },
      {
        new: true,
        runValidators: true,
      }
    ).populate("table");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json(order);
  } catch (error) {
    console.error("Update kitchen status error:", error.message);
    res.status(500).json({
      message: "Failed to update kitchen status",
    });
  }
});

module.exports = router;