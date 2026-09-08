const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ['free', 'occupied'],
      default: 'free',
    },

    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },

    mergedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Table',
      },
    ],

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Table 1 can exist in many restaurants
tableSchema.index(
  { restaurantId: 1, label: 1 },
  { unique: true }
);

module.exports = mongoose.model('Table', tableSchema);