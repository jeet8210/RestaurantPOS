const express = require("express");

const Settings = require("../models/Settings");

const { authRequired, allowRoles } = require("../middleware/auth");

const router = express.Router();

// Get settings for logged-in restaurant
router.get("/", authRequired, async (req, res) => {
  try {
    let settings = await Settings.findOne({
      restaurantId: req.user.restaurantId,
    });

    if (!settings) {
      settings = await Settings.create({
        restaurantId: req.user.restaurantId,
      });
    }

    res.json(settings);
  } catch (error) {
    console.error("Get settings error:", error.message);
    res.status(500).json({
      message: "Unable to load settings",
    });
  }
});

// Update settings for logged-in restaurant
router.put(
  "/",
  authRequired,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const {
        restaurantName,
        tagline,
        address,
        phone,
        gstin,
        fssai,
        upiId,
        logoUrl,
        defaultGst,
      } = req.body;

      let settings = await Settings.findOne({
        restaurantId: req.user.restaurantId,
      });

      if (!settings) {
        settings = await Settings.create({
          restaurantId: req.user.restaurantId,
          restaurantName,
          tagline,
          address,
          phone,
          gstin,
          fssai,
          upiId,
          logoUrl,
          defaultGst,
        });
      } else {
        settings = await Settings.findOneAndUpdate(
          {
            _id: settings._id,
            restaurantId: req.user.restaurantId,
          },
          {
            restaurantName,
            tagline,
            address,
            phone,
            gstin,
            fssai,
            upiId,
            logoUrl,
            defaultGst,
          },
          {
            new: true,
            runValidators: true,
          }
        );
      }

      res.json(settings);
    } catch (error) {
      console.error("Update settings error:", error.message);
      res.status(500).json({
        message: "Unable to save settings",
      });
    }
  }
);

module.exports = router;