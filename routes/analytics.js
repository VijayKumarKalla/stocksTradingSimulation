const express = require('express');
const router = express.Router();

router.get('/stocks/top', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const stocks = await db.all('SELECT id, name FROM stocks');
    const report = [];

    for (const stock of stocks) {
      const prices = await db.all('SELECT price FROM stock_prices WHERE stock_id = ?', [stock.id]);
      const avgPrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length || 0;
      report.push({ stockId: stock.id, name: stock.name, averagePrice: avgPrice });
    }

    report.sort((a, b) => b.averagePrice - a.averagePrice);
    res.json(report);
  } catch (err) {
    next(err); // Let Express handle internal error properly
  }
});



// routes/analytics.js

router.get('/users/report', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const users = await db.all('SELECT * FROM users');
    const report = [];

    for (const user of users) {
      const stocks = await db.all(`
        SELECT us.quantity, sp.price
        FROM user_stocks us
        JOIN (
          SELECT stock_id, MAX(timestamp) AS latest
          FROM stock_prices
          GROUP BY stock_id
        ) latest ON us.stock_id = latest.stock_id
        JOIN stock_prices sp ON sp.stock_id = latest.stock_id AND sp.timestamp = latest.latest
        WHERE us.user_id = ?`, [user.id]);

      const stockValue = stocks.reduce((acc, s) => acc + s.quantity * s.price, 0);
      const netWorth = user.balance + stockValue - user.loan_taken;
      report.push({ userId: user.id, name: user.name, balance: user.balance, loan: user.loan_taken, stockValue, netWorth });
    }

    res.json(report);
  } catch (err) {
    next(err);
  }
});


module.exports = router;
