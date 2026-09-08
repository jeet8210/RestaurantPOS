const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },

  price: {
    type: Number,
    required: true
  }, // pre-tax rate

  gst: {
    type: Number,
    default: 5
  }, // GST %

  // Which restaurant owns this product
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
    index: true
  },

  active: {
    type: Boolean,
    default: true
  },

}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);