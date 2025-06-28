const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('../swagger/swagger.json');

const stockRoutes = require('./routes/stocks');
const userRoutes = require('./routes/users');

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/stocks', stockRoutes);
app.use('/users', userRoutes);

const dbPath = path.join(__dirname, '../stocks.db');
let db = null;

const startServerAndDB = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.locals.db = db;
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/');
    });
  } catch (e) {
    console.error('DB Error:', e.message);
    process.exit(1);
  }
};

startServerAndDB();
module.exports = app;