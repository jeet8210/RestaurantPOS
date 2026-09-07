const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  restaurantName: { type: String, default: 'My Restaurant' },
  tagline: String,
  address: String,
  phone: String,
  gstin: String,
  fssai: String,
  upiId: String,
  logoUrl: String,
  defaultGst: { type: Number, default: 5 },
  lastBillNo: { type: Number, default: 100 },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
