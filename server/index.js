require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const tableRoutes = require('./routes/tables');
const customerRoutes = require('./routes/customers');
const settingsRoutes = require('./routes/settings');
const orderRoutes = require('./routes/orders');
const reportRoutes = require('./routes/reports');
const auditRoutes = require('./routes/audit');
const inventoryRoutes = require('./routes/inventory');
const kitchenRoutes = require('./routes/kitchen');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/kitchen', kitchenRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`RestaurantPOS server running on port ${PORT}`));
