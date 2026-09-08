const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    unit: {
      type: String,
      default: 'kg',
    },

    quantity: {
      type: Number,
      default: 0,
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
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

module.exports = mongoose.model('Inventory', inventorySchema);