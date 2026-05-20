const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Servir archivos estáticos de forma explícita
app.use(express.static(path.join(__dirname, '.')));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Inicializar base de datos
const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        alerted BOOLEAN DEFAULT FALSE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT
      );
    `);

    await pool.query(`
      INSERT INTO users (username, password, full_name)
      VALUES ('juliana', 'fjatjuliana2026', 'Juliana')
      ON CONFLICT (username) DO NOTHING;
    `);

    console.log('Base de datos y tablas listas');
  } catch (err) {
    console.error('Error al inicializar DB:', err);
  }
};
initDB();

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta de Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`Intento de login para usuario: ${username}`);
  
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log(`Login exitoso: ${username}`);
      res.json({ success: true, user: { username: user.username, name: user.full_name } });
    } else {
      console.log(`Login fallido: ${username} - Credenciales incorrectas`);
      res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }
  } catch (err) {
    console.error('Error en /api/login:', err);
    res.status(500).json({ error: err.message });
  }
});

// Rutas de API de Tareas...

app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { id, title, description, date, time, alerted } = req.body;
  try {
    const query = `
      INSERT INTO tasks (id, title, description, date, time, alerted)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        date = EXCLUDED.date,
        time = EXCLUDED.time,
        alerted = EXCLUDED.alerted
      RETURNING *;
    `;
    const values = [id, title, description, date, time, alerted];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

module.exports = app;
