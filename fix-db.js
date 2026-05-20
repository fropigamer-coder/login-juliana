const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixDatabase() {
  console.log('Iniciando corrección de base de datos...');
  try {
    // 1. Borrar tablas existentes para evitar conflictos de estructura
    console.log('Limpiando tablas antiguas...');
    await pool.query('DROP TABLE IF EXISTS tasks CASCADE;');
    await pool.query('DROP TABLE IF EXISTS users CASCADE;');

    // 2. Crear tabla de Usuarios con la estructura correcta
    console.log('Creando tabla de usuarios...');
    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT
      );
    `);

    // 3. Crear tabla de Tareas
    console.log('Creando tabla de tareas...');
    await pool.query(`
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        alerted BOOLEAN DEFAULT FALSE
      );
    `);

    // 4. Insertar usuario por defecto
    console.log('Insertando usuario juliana...');
    await pool.query(`
      INSERT INTO users (username, password, full_name)
      VALUES ('juliana', 'fjatjuliana2026', 'Juliana');
    `);

    console.log('✅ BASE DE DATOS CORREGIDA EXITOSAMENTE');
  } catch (err) {
    console.error('❌ ERROR al corregir la base de datos:', err.message);
  } finally {
    await pool.end();
  }
}

fixDatabase();
