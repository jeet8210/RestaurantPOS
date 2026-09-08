require('dotenv').config();

const mongoose = require('mongoose');

const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Table = require('../models/Table');
const Inventory = require('../models/Inventory');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected');
    console.log('Starting multi-tenant migration...');

    // --------------------------------------------------
    // 1. Find existing users
    // --------------------------------------------------

    const users = await User.find().sort({ createdAt: 1 });

    if (users.length === 0) {
      console.log('No existing users found.');
      console.log('Nothing to migrate.');
      process.exit(0);
    }

    // --------------------------------------------------
    // 2. Find existing restaurant
    // --------------------------------------------------

    let restaurant = await Restaurant.findOne();

    // If no restaurant exists, create one
    if (!restaurant) {
      const adminUser = users.find(
        (user) => user.role === 'admin'
      );

      restaurant = await Restaurant.create({
        name: 'My Restaurant',
        owner: adminUser ? adminUser._id : null,
        active: true
      });

      console.log(
        `Created default restaurant: ${restaurant._id}`
      );
    } else {
      console.log(
        `Using existing restaurant: ${restaurant._id}`
      );
    }

    // --------------------------------------------------
    // 3. Assign restaurant to existing users
    // --------------------------------------------------

    const userResult = await User.updateMany(
      {
        restaurantId: { $exists: false }
      },
      {
        $set: {
          restaurantId: restaurant._id
        }
      }
    );

    console.log(
      `Users migrated: ${userResult.modifiedCount}`
    );

    // --------------------------------------------------
    // 4. Make sure restaurant has owner
    // --------------------------------------------------

    if (!restaurant.owner) {
      const admin = await User.findOne({
        role: 'admin',
        restaurantId: restaurant._id
      });

      if (admin) {
        restaurant.owner = admin._id;
        await restaurant.save();
      }
    }

    // --------------------------------------------------
    // 5. Categories
    // --------------------------------------------------

    const categoryResult = await Category.updateMany(
      {
        restaurantId: { $exists: false }
      },
      {
        $set: {
          restaurantId: restaurant._id
        }
      }
    );

    console.log(
      `Categories migrated: ${categoryResult.modifiedCount}`
    );

    // --------------------------------------------------
    // 6. Products
    // --------------------------------------------------

    const productResult = await Product.updateMany(
      {
        restaurantId: { $exists: false }
      },
      {
        $set: {
          restaurantId: restaurant._id
        }
      }
    );

    console.log(
      `Products migrated: ${productResult.modifiedCount}`
    );

    // --------------------------------------------------
    // 7. Customers
    // --------------------------------------------------

    const customerResult = await Customer.updateMany(
      {
        restaurantId: { $exists: false }
      },
      {
        $set: {
          restaurantId: restaurant._id
        }
      }
    );

    console.log(
      `Customers migrated: ${customerResult.modifiedCount}`
    );

    // --------------------------------------------------
    // 8. Tables
    // --------------------------------------------------

    const tableResult = await Table.updateMany(
      {
        restaurantId: { $exists: false }
      },
      {
        $set: {
          restaurantId: restaurant._id
        }
      }
    );

    console.log(
      `Tables migrated: ${tableResult.modifiedCount}`
    );

    // --------------------------------------------------
    // 9. Inventory
    // --------------------------------------------------

    const inventoryResult = await Inventory.updateMany(
      {
        restaurantId: { $exists: false }
      },
      {
        $set: {
          restaurantId: restaurant._id
        }
      }
    );

    console.log(
      `Inventory migrated: ${inventoryResult.modifiedCount}`
    );

    // --------------------------------------------------
    // 10. Orders
    // --------------------------------------------------

    const orderResult = await Order.updateMany(
      {
        restaurantId: { $exists: false }
      },
      {
        $set: {
          restaurantId: restaurant._id
        }
      }
    );

    console.log(
      `Orders migrated: ${orderResult.modifiedCount}`
    );

    // --------------------------------------------------
    // 11. Settings
    // --------------------------------------------------

    const settingsResult = await Settings.updateMany(
      {
        restaurantId: { $exists: false }
      },
      {
        $set: {
          restaurantId: restaurant._id
        }
      }
    );

    console.log(
      `Settings migrated: ${settingsResult.modifiedCount}`
    );

    // --------------------------------------------------
    // 12. Audit Logs
    // --------------------------------------------------

    const auditResult = await AuditLog.updateMany(
      {
        restaurantId: { $exists: false }
      },
      {
        $set: {
          restaurantId: restaurant._id
        }
      }
    );

    console.log(
      `Audit logs migrated: ${auditResult.modifiedCount}`
    );

    // --------------------------------------------------
    // Finished
    // --------------------------------------------------

    console.log('');
    console.log('======================================');
    console.log('MULTI-TENANT MIGRATION COMPLETED');
    console.log('======================================');
    console.log('');
    console.log(`Restaurant ID: ${restaurant._id}`);
    console.log(`Restaurant Name: ${restaurant.name}`);
    console.log('');

    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('Migration failed:', error.message);
    console.error('');
    process.exit(1);
  }
}

migrate();