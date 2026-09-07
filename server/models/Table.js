const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  label: { type: String, required: true, unique: true }, // e.g. "Table 1"
  status: { type: String, enum: ['free', 'occupied'], default: 'free' },
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  mergedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Table' }],
}, { timestamps: true });

module.exports = mongoose.model('Table', tableSchema);
