const express = require('express');
const Order = require('../models/Order');
const { authRequired, allowRoles } = require('../middleware/auth');
const router = express.Router();

// Simple daily summary: total sales, order count, item-wise breakdown
router.get('/summary', authRequired, allowRoles('admin', 'manager'), async (req, res) => {
  const { from, to } = req.query;
  const filter = { status: 'paid' };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  const orders = await Order.find(filter);
  const totalSales = orders.reduce((s, o) => s + o.grandTotal, 0);
  const totalOrders = orders.length;

  const itemMap = {};
  orders.forEach(o => o.items.forEach(i => {
    if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, qty: 0, amount: 0 };
    itemMap[i.name].qty += i.qty;
    itemMap[i.name].amount += i.qty * i.price;
  }));

  res.json({
    totalSales, totalOrders,
    avgBill: totalOrders ? totalSales / totalOrders : 0,
    itemWise: Object.values(itemMap).sort((a, b) => b.amount - a.amount),
  });
});

// Dashboard: today's sales, orders, revenue, popular items
router.get('/dashboard', authRequired, async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const orders = await Order.find({ status: 'paid', createdAt: { $gte: startOfDay } });

  const todaySales = orders.reduce((s, o) => s + o.grandTotal, 0);
  const totalOrders = orders.length;

  const itemMap = {};
  orders.forEach(o => o.items.forEach(i => {
    if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, qty: 0 };
    itemMap[i.name].qty += i.qty;
  }));
  const popularItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  res.json({ todaySales, totalOrders, popularItems });
});

// GST report: CGST/SGST collected in a date range
router.get('/gst', authRequired, allowRoles('admin', 'manager'), async (req, res) => {
  const { from, to } = req.query;
  const filter = { status: 'paid' };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  const orders = await Order.find(filter);
  const totalCgst = orders.reduce((s, o) => s + (o.cgst || 0), 0);
  const totalSgst = orders.reduce((s, o) => s + (o.sgst || 0), 0);
  res.json({ totalCgst, totalSgst, totalGst: totalCgst + totalSgst, billCount: orders.length });
});

module.exports = router;
