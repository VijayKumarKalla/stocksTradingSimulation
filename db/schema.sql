-- Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  balance REAL DEFAULT 0,
  loan_taken REAL DEFAULT 0
);

-- Stocks
CREATE TABLE IF NOT EXISTS stocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  available_quantity INTEGER DEFAULT 0
);

-- Stock Prices
CREATE TABLE IF NOT EXISTS stock_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_id INTEGER,
  price REAL,
  timestamp TEXT,
  FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- User Stocks
CREATE TABLE IF NOT EXISTS user_stocks (
  user_id INTEGER,
  stock_id INTEGER,
  quantity INTEGER,
  PRIMARY KEY (user_id, stock_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  stock_id INTEGER,
  type TEXT,
  quantity INTEGER,
  price REAL,
  timestamp TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (stock_id) REFERENCES stocks(id)
);

-- Dummy Users
INSERT INTO users (name, balance, loan_taken) VALUES 
  ('Alice', 50000, 10000),
  ('Bob', 30000, 0),
  ('Charlie', 45000, 5000),
  ('Diana', 80000, 20000);

-- Dummy Stocks
INSERT INTO stocks (name, available_quantity) VALUES 
  ('AlphaTech', 1000),
  ('BetaEnergy', 800),
  ('GammaHealth', 600),
  ('DeltaFinance', 1200);

-- Dummy Stock Prices
INSERT INTO stock_prices (stock_id, price, timestamp) VALUES
  (1, 50, '2025-06-28T09:00:00Z'),
  (1, 52, '2025-06-28T10:00:00Z'),
  (2, 30, '2025-06-28T09:00:00Z'),
  (2, 29, '2025-06-28T10:00:00Z'),
  (3, 70, '2025-06-28T09:00:00Z'),
  (4, 40, '2025-06-28T09:00:00Z');

-- Dummy User Stocks
INSERT INTO user_stocks (user_id, stock_id, quantity) VALUES 
  (1, 1, 50),  -- Alice owns 50 AlphaTech
  (1, 3, 10),  -- Alice owns 10 GammaHealth
  (2, 2, 20),  -- Bob owns 20 BetaEnergy
  (3, 4, 15),  -- Charlie owns 15 DeltaFinance
  (4, 1, 25);  -- Diana owns 25 AlphaTech

-- Dummy Transactions
INSERT INTO transactions (user_id, stock_id, type, quantity, price, timestamp) VALUES 
  (1, 1, 'BUY', 50, 50, '2025-06-28T09:10:00Z'),
  (1, 3, 'BUY', 10, 70, '2025-06-28T09:20:00Z'),
  (2, 2, 'BUY', 20, 30, '2025-06-28T09:15:00Z'),
  (3, 4, 'BUY', 15, 40, '2025-06-28T09:30:00Z'),
  (4, 1, 'BUY', 25, 52, '2025-06-28T10:05:00Z');
