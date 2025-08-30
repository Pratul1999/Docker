const express = require('express');
const redis = require('redis');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

// Serve static UI from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

const redisHost = process.env.REDIS_HOST || 'redis';
const client = redis.createClient({ url: `redis://${redisHost}:6379` });

client.on('error', (err) => console.error('Redis Client Error', err));

(async () => {
  await client.connect();
})();

// Get all notes
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await client.lRange('notes', 0, -1);
    const parsedNotes = notes.map(n => JSON.parse(n));
    res.json(parsedNotes.reverse()); // show newest first
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Add a note
app.post('/api/notes', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Note text required' });

  const noteObj = { id: Date.now(), text, date: new Date().toISOString() };
  try {
    await client.rPush('notes', JSON.stringify(noteObj));
    res.status(201).json(noteObj);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add note' });
  }
});

// Delete a note by ID
app.delete('/api/notes/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const notes = await client.lRange('notes', 0, -1);
    const filtered = notes
      .map(n => JSON.parse(n))
      .filter(n => n.id !== id)
      .map(n => JSON.stringify(n));
    // Replace list with filtered list
    await client.del('notes');
    if (filtered.length > 0) {
      await client.rPush('notes', filtered);
    }
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

app.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});
