const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'stocks.db');
const schemaPath = path.join(__dirname, 'db', 'schema.sql');

const schema = fs.readFileSync(schemaPath, 'utf-8');
const db = new sqlite3.Database(dbPath);

db.exec(schema, (err) => {
  if (err) {
    console.error('Error creating DB:', err.message);
  } else {
    console.log('Database initialized successfully!');
  }
  db.close();
});
