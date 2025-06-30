const express = require('express');
const router = express.Router();

router.post('/register', async (req, res) => {
  const db = req.app.locals.db;
  const { name, availableQuantity, price } = req.body;

  try {
    const result = await db.run(
      'INSERT INTO stocks (name, available_quantity) VALUES (?, ?)',
      [name, availableQuantity]
    );
    await db.run(
      'INSERT INTO stock_prices (stock_id, price, timestamp) VALUES (?, ?, ?)',
      [result.lastID, price, new Date().toISOString()]
    );
    res.json({ message: 'Stock registered' });
  } catch {
    res.status(500).json({ error: 'Failed to register stock' });
  }
});

router.get('/report', async (req, res) => {
  const db = req.app.locals.db;
  const stocks = await db.all('SELECT * FROM stocks');
  const report = [];

  for (const stock of stocks) {
    const prices = await db.all('SELECT price FROM stock_prices WHERE stock_id = ?', [stock.id]);
    const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length || 0;
    report.push({ stock: stock.name, averagePrice: avgPrice.toFixed(2), available: stock.available_quantity });
  }

  res.json(report);
});

router.get('/history', async (req, res) => {
  const db = req.app.locals.db;
  const history = await db.all('SELECT * FROM stock_prices ORDER BY timestamp DESC');
  res.json(history);
});

module.exports = router;
