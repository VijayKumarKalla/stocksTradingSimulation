const updateStockPrices = async (db) => {
  const stocks = await db.all('SELECT id FROM stocks');
  for (const stock of stocks) {
    const price = Math.floor(Math.random() * 100) + 1;
    await db.run('INSERT INTO stock_prices (stock_id, price, timestamp) VALUES (?, ?, ?)', [stock.id, price, new Date().toISOString()]);
  }
  console.log('Stock prices updated');
};

module.exports = { updateStockPrices };