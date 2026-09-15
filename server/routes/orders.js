const express = require("express");

const Order = require("../models/Order");
const Settings = require("../models/Settings");
const Customer = require("../models/Customer");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

/*
  CREATE BILL
  Every order belongs to the logged-in restaurant.
*/
router.post("/", authRequired, async (req, res) => {
  try {
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

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Bill must contain at least one item",
      });
    }

    const restaurantId = req.user.restaurantId;

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

    /*
      Bill number is maintained separately
      for every restaurant.
    */
    if (!isHold) {
      const settings = await Settings.findOneAndUpdate(
        {
          restaurantId,
        },
        {
          $inc: { lastBillNo: 1 },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      billNo = settings.lastBillNo;
    } else {
      // Temporary number for held bills
      billNo = Date.now();
    }

    /*
      Customer also belongs to the logged-in restaurant.
    */
    let customer = null;

    if (customerPhone && !isHold) {
      customer = await Customer.findOneAndUpdate(
        {
          phone: customerPhone,
          restaurantId,
        },
        {
          $inc: {
            totalOrders: 1,
            totalSpent: grandTotal,
          },
          $set: {
            name: customerName || "",
          },
          $setOnInsert: {
            phone: customerPhone,
            restaurantId,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    const paymentList = (payments || [])
      .filter((p) => Number(p.amount) > 0)
      .map((p) => ({
        mode: p.mode,
        amount: Number(p.amount),
        reference: p.reference || "",
      }));

    const paymentMode =
      paymentList.length > 1
        ? "Split"
        : paymentList[0]?.mode || "Cash";

    /*
      IMPORTANT:
      restaurantId is taken ONLY from JWT.
      User cannot choose another restaurantId.
    */
    const order = await Order.create({
      restaurantId,

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
  } catch (error) {
    console.error("Create order error:", error);

    res.status(500).json({
      message: "Failed to create bill",
    });
  }
});


/*
  GET HELD BILLS
  Only logged-in restaurant's held bills.
*/
router.get("/held/list", authRequired, async (req, res) => {
  try {
    const held = await Order.find({
      restaurantId: req.user.restaurantId,
      status: "open",
    }).sort({ createdAt: -1 });

    res.json(held);
  } catch (error) {
    console.error("Get held bills error:", error);

    res.status(500).json({
      message: "Failed to load held bills",
    });
  }
});


/*
  RESUME HELD BILL
*/
router.put("/:id/resume", authRequired, async (req, res) => {
  try {
    const { payments, customerPhone, customerName } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
      status: "open",
    });

    if (!order) {
      return res.status(400).json({
        message: "Held bill not found",
      });
    }

    const settings = await Settings.findOneAndUpdate(
      {
        restaurantId: req.user.restaurantId,
      },
      {
        $inc: { lastBillNo: 1 },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    const paymentList = (payments || [])
      .filter((p) => Number(p.amount) > 0)
      .map((p) => ({
        mode: p.mode,
        amount: Number(p.amount),
        reference: p.reference || "",
      }));

    const paymentMode =
      paymentList.length > 1
        ? "Split"
        : paymentList[0]?.mode || "Cash";

    let customer = null;

    if (customerPhone) {
      customer = await Customer.findOneAndUpdate(
        {
          phone: customerPhone,
          restaurantId: req.user.restaurantId,
        },
        {
          $inc: {
            totalOrders: 1,
            totalSpent: order.grandTotal,
          },
          $set: {
            name: customerName || "",
          },
          $setOnInsert: {
            phone: customerPhone,
            restaurantId: req.user.restaurantId,
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    }

    order.billNo = settings.lastBillNo;
    order.status = "paid";
    order.payments = paymentList;
    order.paymentMode = paymentMode;

    if (customer) {
      order.customer = customer._id;
    }

    await order.save();

    res.json(order);
  } catch (error) {
    console.error("Resume bill error:", error);

    res.status(500).json({
      message: "Failed to resume bill",
    });
  }
});


/*
  UPDATE EXISTING PAID BILL
  Used by "Add More Items".
*/
router.put("/:id/update-items", authRequired, async (req, res) => {
  try {
    const { items, payments } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Bill must contain at least one item",
      });
    }

    /*
      VERY IMPORTANT:
      Find bill using BOTH id AND restaurantId.
    */
    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });

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

    let grossAmount = 0;
    let taxTotal = 0;

    const lineItems = items.map((item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      const gst = Number(item.gst) || 0;

      const lineAmount = price * qty;

      grossAmount += lineAmount;

      if (order.gstMode === "inclusive" && gst > 0) {
        const taxableValue = lineAmount / (1 + gst / 100);
        taxTotal += lineAmount - taxableValue;
      } else {
        taxTotal += lineAmount * (gst / 100);
      }

      return {
        product: item.productId || item.product || null,
        name: item.name,
        price,
        gst,
        qty,
      };
    });

    const subtotal =
      order.gstMode === "inclusive"
        ? grossAmount - taxTotal
        : grossAmount;

    const discountAmt = Number(order.discount) || 0;
    const serviceChargeAmt = Number(order.serviceCharge) || 0;

    const cgst = taxTotal / 2;
    const sgst = taxTotal / 2;

    const grandTotal =
      grossAmount +
      (order.gstMode === "exclusive" ? taxTotal : 0) -
      discountAmt +
      serviceChargeAmt;

    order.items = lineItems;
    order.subtotal = subtotal;
    order.cgst = cgst;
    order.sgst = sgst;
    order.grandTotal = grandTotal;

    const paymentList = (payments || [])
      .filter((p) => Number(p.amount) > 0)
      .map((p) => ({
        mode: p.mode,
        amount: Number(p.amount),
        reference: p.reference || "",
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


/*
  REPRINT BILL
  Only current restaurant can reprint its own bill.
*/
router.get("/reprint/:billNo", authRequired, async (req, res) => {
  try {
    const order = await Order.findOne({
      restaurantId: req.user.restaurantId,
      billNo: Number(req.params.billNo),
      status: "paid",
    });

    if (!order) {
      return res.status(404).json({
        message: "Bill not found",
      });
    }

    res.json(order);
  } catch (error) {
    console.error("Reprint error:", error);

    res.status(500).json({
      message: "Failed to reprint bill",
    });
  }
});


/*
  LIST PAID ORDERS
  Only current restaurant's orders.
*/
router.get("/", authRequired, async (req, res) => {
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

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(500);

    res.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);

    res.status(500).json({
      message: "Failed to load orders",
    });
  }
});


/*
  GET SINGLE ORDER
  Only current restaurant can access it.
*/
router.get("/:id", authRequired, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: req.user.restaurantId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order error:", error);

    res.status(500).json({
      message: "Failed to load order",
    });
  }
});


module.exports = router;