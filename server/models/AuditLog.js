const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    userName: String,

    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },

    action: String,

    target: String,

    details: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);