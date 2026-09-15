const express = require("express");

const Customer = require("../models/Customer");
const Order = require("../models/Order");

const { authRequired } = require("../middleware/auth");

const router = express.Router();

// Get customers of logged-in restaurant only
router.get("/", authRequired, async (req, res) => {
  try {
    const customers = await Customer.find({
      restaurantId: req.user.restaurantId,
    }).sort({ createdAt: -1 });

    res.json(customers);
  } catch (error) {
    console.error("Get customers error:", error.message);

    res.status(500).json({
      message: "Failed to load customers",
    });
  }
});

// Find or create customer for logged-in restaurant
router.post("/find-or-create", authRequired, async (req, res) => {
  try {
    const { phone, name } = req.body;

    if (!phone) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }

    const restaurantId = req.user.restaurantId;

    let customer = await Customer.findOne({
      phone,
      restaurantId,
    });

    if (!customer) {
      customer = await Customer.create({
        phone,
        name: name || "",
        restaurantId,
      });
    } else if (name && customer.name !== name) {
      customer.name = name;
      await customer.save();
    }

    res.json(customer);
  } catch (error) {
    console.error("Find/create customer error:", error.message);

    res.status(500).json({
      message: "Failed to find or create customer",
    });
  }
});

// Customer visit/order history
router.get("/:id/history", authRequired, async (req, res) => {
  try {
    // First make sure customer belongs to current restaurant
    const customer = await Customer.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    // Only orders from the same restaurant
    const orders = await Order.find({
      customer: req.params.id,
      restaurantId: req.user.restaurantId,
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Customer history error:", error.message);

    res.status(500).json({
      message: "Failed to load customer history",
    });
  }
});

module.exports = router;