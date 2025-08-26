const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();

const inventoryRoutes = require('./routes/inventory/table');
const registerRoutes = require('./routes/register');
const addRoutes = require('./routes/inventory/add');
const updateRoutes = require('./routes/inventory/update');
const itemsRoutes = require('./routes/inventory/items');
const dashboardRoutes = require('./routes/dashboard/dashboard');
const loginRoutes = require('./routes/login/login');
const orderRoutes = require('./routes/orders/order');

app.use(cors());
app.use(express.json());
app.use('/api/register', registerRoutes);
app.use('/api/login', loginRoutes);

app.use('/api/inventory', inventoryRoutes);
app.use('/api/inventory', addRoutes);
app.use('/api/inventory', updateRoutes);
app.use('/api/inventory', itemsRoutes);

app.use('/api/dashboard', dashboardRoutes);

app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
