const express = require('express');
const router = express.Router();

// Loan API
router.post('/loan', async (req, res) => {
  const db = req.app.locals.db;
  const { userId, amount } = req.body;
  if (amount > 100000) return res.status(400).json({ error: 'Loan limit is ₹100000' });

  try {
    await db.run(
      `UPDATE users SET balance = balance + ${amount}, loan_taken = loan_taken + ${amount} WHERE id = ${userId}`
    
    );
    res.json({ message: 'Loan granted' });
  } catch {
    res.status(500).json({ error: 'Loan processing failed' });
  }
});

// Buy API
router.post('/buy', async (req, res) => {
  const db = req.app.locals.db;
  const { userId, stockId, quantity } = req.body;

  try {
    const stock = await db.get('SELECT * FROM stocks WHERE id = ?', [stockId]);
    if (!stock || stock.available_quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock available' });
    }

    const price = await db.get('SELECT price FROM stock_prices WHERE stock_id = ? ORDER BY timestamp DESC LIMIT 1', [stockId]);
    const cost = quantity * price.price;

    const user = await db.get('SELECT balance FROM users WHERE id = ?', [userId]);
    if (user.balance < cost) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    await db.run('BEGIN');
    await db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [cost, userId]);
    await db.run('UPDATE stocks SET available_quantity = available_quantity - ? WHERE id = ?', [quantity, stockId]);
    await db.run(
      'INSERT INTO transactions (user_id, stock_id, type, quantity, price, timestamp) VALUES (?, ?, "BUY", ?, ?, ?)',
      [userId, stockId, quantity, price.price, new Date().toISOString()]
    );
    await db.run(`
      INSERT INTO user_stocks (user_id, stock_id, quantity)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, stock_id)
      DO UPDATE SET quantity = quantity + ?`,
      [userId, stockId, quantity, quantity]
    );
    await db.run('COMMIT');
    res.json({ message: 'Stock purchased' });
  } catch (err) {
    await db.run('ROLLBACK');
    res.status(500).json({ error: 'Purchase failed' });
  }
});

// Sell API
router.post('/sell', async (req, res) => {
  const db = req.app.locals.db;
  const { userId, stockId, quantity } = req.body;

  try {
    const holding = await db.get('SELECT quantity FROM user_stocks WHERE user_id = ? AND stock_id = ?', [userId, stockId]);
    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({ error: 'Not enough stock to sell' });
    }

    const price = await db.get('SELECT price FROM stock_prices WHERE stock_id = ? ORDER BY timestamp DESC LIMIT 1', [stockId]);
    const amountEarned = quantity * price.price;

    await db.run('BEGIN');
    await db.run('UPDATE users SET balance = balance + ? WHERE id = ?', [amountEarned, userId]);
    await db.run('UPDATE stocks SET available_quantity = available_quantity + ? WHERE id = ?', [quantity, stockId]);
    await db.run('UPDATE user_stocks SET quantity = quantity - ? WHERE user_id = ? AND stock_id = ?', [quantity, userId, stockId]);
    await db.run('INSERT INTO transactions (user_id, stock_id, type, quantity, price, timestamp) VALUES (?, ?, "SELL", ?, ?, ?)', [userId, stockId, quantity, price.price, new Date().toISOString()]);
    await db.run('COMMIT');
    res.json({ message: 'Stock sold' });
  } catch {
    await db.run('ROLLBACK');
    res.status(500).json({ error: 'Sell failed' });
  }
});

// Top users
router.get('/top', async (req, res) => {
  const db = req.app.locals.db;
  const users = await db.all('SELECT * FROM users');
  const enriched = [];

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
    enriched.push({ ...user, stockValue, netWorth });
  }

  enriched.sort((a, b) => b.netWorth - a.netWorth);
  res.json(enriched);
});

// User report
router.get('/report', async (req, res) => {
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
});

module.exports = router;
