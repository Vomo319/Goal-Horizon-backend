const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Routes
app.get('/api/goals', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM goals ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/goals', async (req, res) => {
  const { name, target_amount, deadline, notes } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO goals (name, target_amount, current_amount, deadline, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, target_amount, 0, deadline, notes]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/goals/:id', async (req, res) => {
  const { id } = req.params;
  const { current_amount } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE goals SET current_amount = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [current_amount, id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

