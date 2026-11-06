const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

require('dotenv').config();

const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopping_list';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Schema ----------
const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    quantity: { type: Number, default: 1, min: 1 },
    category: { type: String, trim: true, default: 'General', maxlength: 60 },
    purchased: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Item = mongoose.model('Item', itemSchema);

// ---------- Helpers ----------
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ---------- Routes ----------

// Health check (also reports DB connection state)
app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Retrieve all items (optional ?category= and ?purchased=true|false filters)
app.get('/api/items', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.purchased === 'true') filter.purchased = true;
    if (req.query.purchased === 'false') filter.purchased = false;
    const items = await Item.find(filter).sort({ purchased: 1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Retrieve one item
app.get('/api/items/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add an item
app.post('/api/items', async (req, res) => {
  try {
    const { name, quantity, category } = req.body;
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required' });
    const item = await Item.create({ name, quantity, category: category || undefined });
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update an item (name, quantity, category, purchased)
app.put('/api/items/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const allowed = ['name', 'quantity', 'category', 'purchased'];
    const update = {};
    for (const key of allowed) if (key in req.body) update[key] = req.body[key];
    const item = await Item.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete an item
app.delete('/api/items/:id', async (req, res) => {
  if (!isValidId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear all purchased items
app.delete('/api/items', async (req, res) => {
  try {
    const result = await Item.deleteMany({ purchased: true });
    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Start ----------
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Shopping list running at http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    console.error('Check MONGODB_URI in your .env file and that MongoDB is running.');
    process.exit(1);
  });
