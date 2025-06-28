const express = require('express');
const router = express.Router();

// User profit/loss report
router.get('/users/report', async (req, res) => {
  const db = req.app.locals.db;
  const users = await db.all('SELECT id, name, balance, loan_taken FROM users');
  const report = [];

  for (const user of users) {
    const stocks = await db.all(`
      SELECT us.stock_id, us.quantity, sp.price FROM user_stocks us
      JOIN (
        SELECT stock_id, MAX(timestamp) as latest FROM stock_prices GROUP BY stock_id
      ) latest ON us.stock_id = latest.stock_id
      JOIN stock_prices sp ON sp.stock_id = latest.stock_id AND sp.timestamp = latest.latest
      WHERE us.user_id = ?`, [user.id]);

    const stockValue = stocks.reduce((sum, s) => sum + s.quantity * s.price, 0);
    const netWorth = user.balance + stockValue - user.loan_taken;

    report.push({
      userId: user.id,
      name: user.name,
      balance: user.balance,
      loan: user.loan_taken,
      stockValue,
      netWorth
    });
  }

  res.json(report);
});

module.exports = router;
