const express = require('express');
const router = express.Router();

router.post('/register', async (req, res) => {
  const db = req.app.locals.db;
  const { name, availableQuantity, price } = req.body;
  const result = await db.run(
    'INSERT INTO stocks (name, available_quantity) VALUES (?, ?)',
    [name, availableQuantity]
  );
  const stockId = result.lastID;
  await db.run(
    'INSERT INTO stock_prices (stock_id, price, timestamp) VALUES (?, ?, ?)',
    [stockId, price, new Date().toISOString()]
  );
  res.send('Stock registered');
});

module.exports = router;
