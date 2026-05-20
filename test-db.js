const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  console.log('Intentando conectar a Neon...');
  try {
    const res = await pool.query('SELECT NOW() as mensaje, current_database() as db');
    console.log('✅ CONEXIÓN EXITOSA');
    console.log('Hora en el servidor:', res.rows[0].mensaje);
    console.log('Base de datos conectada:', res.rows[0].db);
  } catch (err) {
    console.error('❌ ERROR DE CONEXIÓN:');
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

test();
