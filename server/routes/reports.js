const express = require("express");

const Order = require("../models/Order");

const { authRequired, allowRoles } = require("../middleware/auth");

const router = express.Router();

// Simple daily summary:
// total sales, order count, item-wise breakdown
router.get(
  "/summary",
  authRequired,
  allowRoles("admin", "manager"),
  async (req, res) => {
    try {
      const { from, to } = req.query;

      const filter = {
        restaurantId: req.user.restaurantId,
        status: "paid",
      };

      if (from || to) {
        filter.createdAt = {};

        if (from) {
          filter.createdAt.$gte = new Date(from);
        }

        if (to) {
          filter.createdAt.$lte = new Date(to);
        }
      }

      const orders = await Order.find(filter);

      const totalSales = orders.reduce(
        (sum, order) => sum + order.grandTotal,
        0
      );

      const totalOrders = orders.length;

      const itemMap = {};

      orders.forEach((order) => {
        order.items.forEach((item) => {
          if (!itemMap[item.name]) {
            itemMap[item.name] = {
              name: item.name,
              qty: 0,
              amount: 0,
            };
          }

          itemMap[item.name].qty += item.qty;
          itemMap[item.name].amount += item.qty * item.price;
        });
      });

      res.json({
        totalSales,
        totalOrders,
        avgBill: totalOrders ? totalSales / totalOrders : 0,
        itemWise: Object.values(itemMap).sort(
          (a, b) => b.amount - a.amount
        ),
      });
    } catch (error) {
      console.error("Reports summary error:", error.message);
      res.status(500).json({
        message: "Failed to load sales summary",
      });
    }
  }
);

// Dashboard:
// today's sales, orders, revenue, popular items
router.get("/dashboard", authRequired, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const orders = await Order.find({
      restaurantId: req.user.restaurantId,
      status: "paid",
      createdAt: { $gte: startOfDay },
    });

    const todaySales = orders.reduce(
      (sum, order) => sum + order.grandTotal,
      0
    );

    const totalOrders = orders.length;

    const itemMap = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (!itemMap[item.name]) {
          itemMap[item.name] = {
            name: item.name,
            qty: 0,
          };
        }

        itemMap[item.name].qty += item.qty;
      });
    });

    const popularItems = Object.values(itemMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    res.json({
      todaySales,
      totalOrders,
      popularItems,
    });
  } catch (error) {
    console.error("Dashboard report error:", error.message);
    res.status(500).json({
      message: "Failed to load dashboard data",
    });
  }
});

// GST report:
// CGST/SGST collected in a date range
router.get(
  "/gst",
  authRequired,
  allowRoles("admin", "manager"),
  async (req, res) => {
    try {
      const { from, to } = req.query;

      const filter = {
        restaurantId: req.user.restaurantId,
        status: "paid",
      };

      if (from || to) {
        filter.createdAt = {};

        if (from) {
          filter.createdAt.$gte = new Date(from);
        }

        if (to) {
          filter.createdAt.$lte = new Date(to);
        }
      }

      const orders = await Order.find(filter);

      const totalCgst = orders.reduce(
        (sum, order) => sum + (order.cgst || 0),
        0
      );

      const totalSgst = orders.reduce(
        (sum, order) => sum + (order.sgst || 0),
        0
      );

      res.json({
        totalCgst,
        totalSgst,
        totalGst: totalCgst + totalSgst,
        billCount: orders.length,
      });
    } catch (error) {
      console.error("GST report error:", error.message);
      res.status(500).json({
        message: "Failed to load GST report",
      });
    }
  }
);

module.exports = router;