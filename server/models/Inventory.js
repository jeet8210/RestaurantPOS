const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },      // e.g. Rice, Oil, Batter, Coconut
  unit: { type: String, default: 'kg' },        // kg, litre, pcs
  quantity: { type: Number, default: 0 },
  lowStockThreshold: { type: Number, default: 5 },
}, { timestamps: true });

module.exports = mongoose.model('Inventory', inventorySchema);
