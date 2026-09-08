const express = require('express');

const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

const { authRequired, allowRoles } = require('../middleware/auth');

const router = express.Router();

// GET all active products of logged-in restaurant
router.get('/', authRequired, async (req, res) => {
  try {
    const products = await Product.find({
      active: true,
      restaurantId: req.user.restaurantId
    }).populate('category');

    res.json(products);
  } catch (error) {
    console.error('Get products error:', error.message);
    res.status(500).json({
      message: 'Server error'
    });
  }
});

// CREATE product inside logged-in restaurant
router.post(
  '/',
  authRequired,
  allowRoles('admin', 'manager'),
  async (req, res) => {
    try {
      const product = await Product.create({
        ...req.body,
        restaurantId: req.user.restaurantId
      });

      res.json(product);
    } catch (error) {
      console.error('Create product error:', error.message);
      res.status(500).json({
        message: 'Server error'
      });
    }
  }
);

// UPDATE only product belonging to logged-in restaurant
router.put(
  '/:id',
  authRequired,
  allowRoles('admin', 'manager'),
  async (req, res) => {
    try {
      const product = await Product.findOneAndUpdate(
        {
          _id: req.params.id,
          restaurantId: req.user.restaurantId
        },
        {
          $set: req.body
        },
        {
          new: true
        }
      );

      if (!product) {
        return res.status(404).json({
          message: 'Product not found'
        });
      }

      res.json(product);
    } catch (error) {
      console.error('Update product error:', error.message);
      res.status(500).json({
        message: 'Server error'
      });
    }
  }
);

// DELETE/deactivate only product belonging to logged-in restaurant
router.delete(
  '/:id',
  authRequired,
  allowRoles('admin', 'manager'),
  async (req, res) => {
    try {
      const product = await Product.findOneAndUpdate(
        {
          _id: req.params.id,
          restaurantId: req.user.restaurantId
        },
        {
          active: false
        },
        {
          new: true
        }
      );

      if (!product) {
        return res.status(404).json({
          message: 'Product not found'
        });
      }

      await AuditLog.create({
        user: req.user.id,
        userName: req.user.name,
        restaurantId: req.user.restaurantId,
        action: 'DELETE_PRODUCT',
        target: product.name,
        details: 'Item removed from menu'
      });

      res.json({
        message: 'Product removed'
      });
    } catch (error) {
      console.error('Delete product error:', error.message);
      res.status(500).json({
        message: 'Server error'
      });
    }
  }
);

module.exports = router;