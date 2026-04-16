const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Servir archivos HTML, CSS y JS desde la carpeta raíz

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Requerido para conexiones seguras con Neon/Render
  }
});

// Inicializar base de datos
const initDB = async () => {
  try {
    // Tabla de Tareas
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

    // Tabla de Usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT
      );
    `);

    // Crear usuario por defecto si no existe (Usuario: juliana / Pass: fjatjuliana2026)
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

// Ruta de Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND password = $2',
      [username, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      res.json({ success: true, user: { username: user.username, name: user.full_name } });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }
  } catch (err) {
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
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
