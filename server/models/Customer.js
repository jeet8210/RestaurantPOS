const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: String,

    phone: {
      type: String,
      index: true,
    },

    totalOrders: {
      type: Number,
      default: 0,
    },

    totalSpent: {
      type: Number,
      default: 0,
    },

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Customer', customerSchema);