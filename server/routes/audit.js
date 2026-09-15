const express = require("express");

const AuditLog = require("../models/AuditLog");

const { authRequired, allowRoles } = require("../middleware/auth");

const router = express.Router();

// Get only this restaurant's audit logs
router.get("/", authRequired, allowRoles("admin"), async (req, res) => {
  try {
    const logs = await AuditLog.find({
      restaurantId: req.user.restaurantId,
    })
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(logs);
  } catch (error) {
    console.error("Get audit logs error:", error.message);
    res.status(500).json({
      message: "Failed to load audit logs",
    });
  }
});

module.exports = router;