const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },

    name: String,

    price: Number,

    gst: Number,

    qty: Number,
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ['Cash', 'UPI', 'Card'],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    reference: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    billNo: {
      type: Number,
      required: true,
    },

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },

    items: [orderItemSchema],

    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      default: null,
    },

    orderType: {
      type: String,
      enum: ['Dine In', 'Takeaway', 'Delivery'],
      default: 'Dine In',
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
    },

    waiter: String,

    pax: Number,

    subtotal: Number,

    discount: {
      type: Number,
      default: 0,
    },

    discountType: {
      type: String,
      enum: ['amount', 'percent'],
      default: 'amount',
    },

    serviceCharge: {
      type: Number,
      default: 0,
    },

    gstMode: {
      type: String,
      enum: ['inclusive', 'exclusive'],
      default: 'exclusive',
    },

    cgst: Number,

    sgst: Number,

    grandTotal: Number,

    payments: [paymentSchema],

    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Split'],
      default: 'Cash',
    },

    status: {
      type: String,
      enum: ['open', 'paid', 'cancelled'],
      default: 'paid',
    },

    heldLabel: String,

    kitchenStatus: {
      type: String,
      enum: ['preparing', 'ready', 'served'],
      default: 'preparing',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Bill number is unique only inside its restaurant
orderSchema.index(
  { restaurantId: 1, billNo: 1 },
  { unique: true }
);

module.exports = mongoose.model('Order', orderSchema);