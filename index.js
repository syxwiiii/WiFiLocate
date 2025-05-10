
const express = require('express');
const Database = require("@replit/database");
const db = new Database();
const app = express();

app.use(express.json());
app.use(express.static('public'));

// Get points for a user
app.get('/points/:userId', async (req, res) => {
  try {
    const points = await db.get(`points_${req.params.userId}`) || 0;
    res.json({ points });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get points' });
  }
});

// Sync points from local storage to server
app.post('/sync/:userId', async (req, res) => {
  try {
    const { points } = req.body;
    await db.set(`points_${req.params.userId}`, points);
    res.json({ success: true, points });
  } catch (error) {
    res.status(500).json({ error: 'Failed to sync points' });
  }
});

// Get all users' points
app.get('/points', async (req, res) => {
  try {
    const keys = await db.list('points_');
    const points = await Promise.all(
      keys.map(async (key) => ({
        userId: key.replace('points_', ''),
        points: await db.get(key)
      }))
    );
    res.json(points);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get all points' });
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on port 3000');
});
