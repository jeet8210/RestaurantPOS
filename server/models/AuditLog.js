const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  action: String,      // e.g. 'DELETE_PRODUCT', 'EDIT_PRICE'
  target: String,       // e.g. product name
  details: String,
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
