const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
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

// Same category name can exist in different restaurants
categorySchema.index(
  { restaurantId: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model('Category', categorySchema);