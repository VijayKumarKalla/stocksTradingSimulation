const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const cron = require('node-cron');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger.json');

const stockRoutes = require('./routes/stocks.js');
const userRoutes = require('./routes/users.js');
const analyticsRoutes = require('./routes/analytics.js');
const { updateStockPrices } = require('./services/priceUpdater');

const app = express();
app.use(express.json());

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/stocks', stockRoutes);
app.use('/users', userRoutes);
app.use('/analytics', analyticsRoutes);

const dbPath = path.join(__dirname, 'stocks.db');
const startServer = async () => {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  app.locals.db = db;

  cron.schedule('*/5 * * * *', () => updateStockPrices(db));

  app.listen(3000, () => console.log('Server running at http://localhost:3000/api-docs'));
};

startServer();
module.exports = app;
