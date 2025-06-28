const express = require('express');
const router = express.Router();

// Give loan to user
router.post('/loan', async (req, res) => {
  const db = req.app.locals.db;
  const { userId, amount } = req.body;

  if (amount > 100000) {
    return res.status(400).send({ error: 'Loan limit is ₹100000' });
  }

  try {
    await db.run(
      'UPDATE users SET balance = balance + ?, loan_taken = loan_taken + ? WHERE id = ?',
      [amount, amount, userId]
    );
    res.send({ message: 'Loan granted' });
  } catch (error) {
    res.status(500).send({ error: 'Loan processing failed' });
  }
});

// Buy stocks
router.post('/buy', async (req, res) => {
  const db = req.app.locals.db;
  const { userId, stockId, quantity } = req.body;

  try {
    const stock = await db.get('SELECT * FROM stocks WHERE id = ?', [stockId]);
    const latestPrice = await db.get(`
      SELECT price FROM stock_prices
      WHERE stock_id = ?
      ORDER BY timestamp DESC LIMIT 1
    `, [stockId]);

    if (!stock || stock.available_quantity < quantity) {
      return res.status(400).send({ error: 'Insufficient stock available' });
    }

    const cost = latestPrice.price * quantity;
    const user = await db.get('SELECT balance FROM users WHERE id = ?', [userId]);

    if (user.balance < cost) {
      return res.status(400).send({ error: 'Insufficient balance' });
    }

    await db.run('BEGIN');
    await db.run('UPDATE users SET balance = balance - ? WHERE id = ?', [cost, userId]);
    await db.run('UPDATE stocks SET available_quantity = available_quantity - ? WHERE id = ?', [quantity, stockId]);
    await db.run(`
      INSERT INTO transactions (user_id, stock_id, type, quantity, price, timestamp)
      VALUES (?, ?, 'BUY', ?, ?, ?)`,
      [userId, stockId, quantity, latestPrice.price, new Date().toISOString()]
    );
    await db.run(`
      INSERT INTO user_stocks (user_id, stock_id, quantity)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id, stock_id)
      DO UPDATE SET quantity = quantity + ?`,
      [userId, stockId, quantity, quantity]
    );
    await db.run('COMMIT');

    res.send({ message: 'Stock purchased' });
  } catch (error) {
    await db.run('ROLLBACK');
    res.status(500).send({ error: 'Purchase failed' });
  }
});

module.exports = router;
