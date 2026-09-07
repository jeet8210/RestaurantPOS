const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Settings = require("../models/Settings");
const Customer = require("../models/Customer");
const { authRequired } = require("../middleware/auth");
const router = express.Router();

// Create a bill: computes GST, assigns sequential bill number, updates customer stats
// hold: true  -> saves as an open "held" bill (no payment yet, customer stats not updated)
router.post("/", authRequired, async (req, res) => {
  const {
    items,
    table,
    orderType,
    customerPhone,
    customerName,
    waiter,
    pax,
    payments,
    discount,
    discountType,
    gstMode,
    serviceCharge,
    hold,
    heldLabel,
  } = req.body;

  let grossAmount = 0;
  let taxTotal = 0;
  let subtotal = 0;

  const lineItems = items.map((i) => {
    const lineAmt = Number(i.price) * Number(i.qty);
    const gstRate = Number(i.gst || 0);

    grossAmount += lineAmt;

    if (gstMode === "inclusive" && gstRate > 0) {
      const taxableValue = lineAmt / (1 + gstRate / 100);

      taxTotal += lineAmt - taxableValue;
    } else {
      taxTotal += lineAmt * (gstRate / 100);
    }

    return {
      product: i.productId,
      name: i.name,
      price: Number(i.price),
      gst: gstRate,
      qty: Number(i.qty),
    };
  });

  if (gstMode === "inclusive") {
    subtotal = grossAmount - taxTotal;
  } else {
    subtotal = grossAmount;
  }

  const discountValue = Number(discount) || 0;

  const discountAmt =
    discountType === "percent"
      ? (grossAmount * discountValue) / 100
      : discountValue;

  const serviceChargeAmt = Number(serviceCharge) || 0;

  const cgst = taxTotal / 2;
  const sgst = taxTotal / 2;

  const grandTotal =
    grossAmount +
    (gstMode === "exclusive" ? taxTotal : 0) -
    discountAmt +
    serviceChargeAmt;

  const isHold = !!hold;
  let billNo;
  if (!isHold) {
    const settings = await Settings.findOneAndUpdate(
      {},
      { $inc: { lastBillNo: 1 } },
      { upsert: true, new: true },
    );
    billNo = settings.lastBillNo;
  } else {
    // held bills still need a unique placeholder number; use a temp negative-safe counter via timestamp
    billNo = Date.now();
  }

  let customer = null;
  if (customerPhone && !isHold) {
    customer = await Customer.findOneAndUpdate(
      { phone: customerPhone },
      {
        $inc: { totalOrders: 1, totalSpent: grandTotal },
        $setOnInsert: { name: customerName, phone: customerPhone },
      },
      { upsert: true, new: true },
    );
  }

  const paymentList = (payments || []).filter((p) => p.amount > 0);
  const paymentMode =
    paymentList.length > 1 ? "Split" : paymentList[0]?.mode || "Cash";

  const order = await Order.create({
    billNo,
    items: lineItems,
    table: table || null,
    orderType,
    customer: customer ? customer._id : null,
    waiter,
    pax,
    subtotal,
    discount: discountAmt,
    serviceCharge: serviceChargeAmt,
    cgst,
    sgst,
    grandTotal,
    gstMode: gstMode || "exclusive",
    discountType: discountType || "amount",
    payments: paymentList,
    paymentMode,
    status: isHold ? "open" : "paid",
    heldLabel: heldLabel || "",
    createdBy: req.user.id,
  });

  res.json(order);
});

// List currently held (on-hold) bills
router.get("/held/list", authRequired, async (req, res) => {
  const held = await Order.find({ status: "open" }).sort({ createdAt: -1 });
  res.json(held);
});

// Finalize a held bill: assign a real bill number, mark paid, record payments
router.put("/:id/resume", authRequired, async (req, res) => {
  const { payments, customerPhone, customerName } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order || order.status !== "open")
    return res.status(400).json({ message: "Held bill not found" });

  const settings = await Settings.findOneAndUpdate(
    {},
    { $inc: { lastBillNo: 1 } },
    { upsert: true, new: true },
  );
  const paymentList = (payments || []).filter((p) => p.amount > 0);
  const paymentMode =
    paymentList.length > 1 ? "Split" : paymentList[0]?.mode || "Cash";

  let customer = null;
  if (customerPhone) {
    customer = await Customer.findOneAndUpdate(
      { phone: customerPhone },
      {
        $inc: { totalOrders: 1, totalSpent: order.grandTotal },
        $setOnInsert: { name: customerName, phone: customerPhone },
      },
      { upsert: true, new: true },
    );
  }

  order.billNo = settings.lastBillNo;
  order.status = "paid";
  order.payments = paymentList;
  order.paymentMode = paymentMode;
  if (customer) order.customer = customer._id;
  await order.save();
  res.json(order);
});

// Update an already paid bill by adding/removing items
router.put("/:id/update-items", authRequired, async (req, res) => {
  try {
    const { items, payments } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Bill must contain at least one item",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    if (order.status !== "paid") {
      return res.status(400).json({
        message: "Only paid bills can be updated",
      });
    }

    let subtotal = 0;
    let taxTotal = 0;

    const lineItems = items.map((item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      const gst = Number(item.gst) || 0;

      const lineAmount = price * qty;

      subtotal += lineAmount;
      taxTotal += lineAmount * (gst / 100);

      return {
        product: item.productId || item.product || null,
        name: item.name,
        price,
        gst,
        qty,
      };
    });

    const discountAmt = Number(order.discount) || 0;
    const serviceChargeAmt = Number(order.serviceCharge) || 0;

    const cgst = taxTotal / 2;
    const sgst = taxTotal / 2;

    const grandTotal = subtotal + taxTotal - discountAmt + serviceChargeAmt;

    order.items = lineItems;
    order.subtotal = subtotal;
    order.cgst = cgst;
    order.sgst = sgst;
    order.grandTotal = grandTotal;

    // Update payment amount after adding/removing items
    const paymentList = (payments || [])
      .filter((p) => Number(p.amount) > 0)
      .map((p) => ({
        mode: p.mode,
        amount: Number(p.amount),
      }));

    order.payments = paymentList;

    order.paymentMode =
      paymentList.length > 1
        ? "Split"
        : paymentList[0]?.mode || order.paymentMode || "Cash";

    await order.save();

    res.json(order);
  } catch (error) {
    console.error("Update bill error:", error);

    res.status(500).json({
      message: "Failed to update bill",
    });
  }
});

// Reprint: look up a finalized bill by its printed bill number
router.get("/reprint/:billNo", authRequired, async (req, res) => {
  const order = await Order.findOne({
    billNo: Number(req.params.billNo),
    status: "paid",
  });
  if (!order) return res.status(404).json({ message: "Bill not found" });
  res.json(order);
});

router.get("/", authRequired, async (req, res) => {
  const { from, to } = req.query;
  const filter = { status: "paid" };
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(500);
  res.json(orders);
});

router.get("/:id", authRequired, async (req, res) => {
  const order = await Order.findById(req.params.id);
  res.json(order);
});

module.exports = router;
