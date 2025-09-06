const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const inventoryRoutes = require('./routes/inventory/inventory');
const registerRoutes = require('./routes/register');
const dashboardRoutes = require('./routes/dashboard/dashboard');
const loginRoutes = require('./routes/login/login');
const orderRoutes = require('./routes/orders/order');
const salesRoutes = require('./routes/sales/sales');

app.use(cors());
app.use(express.json());
app.use('/api/register', registerRoutes);

app.use('/api/login', loginRoutes);

app.use('/api/inventory', inventoryRoutes);

app.use('/api/dashboard', dashboardRoutes);

app.use('/api/orders', orderRoutes);

app.use('/api/sales', salesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
