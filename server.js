
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('points.db');

// Create points table if it doesn't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    x INTEGER,
    y INTEGER,
    description TEXT
  )`);
});

// Add new point
app.post('/points', (req, res) => {
  const { type, x, y, description } = req.body;
  const sql = 'INSERT INTO points (type, x, y, description) VALUES (?, ?, ?, ?)';
  db.run(sql, [type, x, y, description], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID });
  });
});

// Get all points
app.get('/points', (req, res) => {
  db.all('SELECT * FROM points', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get points by type
app.get('/points/:type', (req, res) => {
  const { type } = req.params;
  db.all('SELECT * FROM points WHERE type = ?', [type], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.listen(5000, '0.0.0.0', () => {
  console.log('Server running on port 5000');
});
