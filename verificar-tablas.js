const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (res.rows.length === 0) {
      console.log('No se encontraron tablas en la base de datos.');
    } else {
      console.log('Tablas detectadas en tu base de datos:');
      res.rows.forEach(row => console.log('- ' + row.table_name));
      
      // Verificar columnas de la tabla users si existe
      if (res.rows.some(r => r.table_name === 'users')) {
        const cols = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
        console.log('\nColumnas en la tabla "users":');
        cols.rows.forEach(c => console.log('  • ' + c.column_name));
      }
    }
  } catch (err) {
    console.error('Error al conectar:', err.message);
  } finally {
    await pool.end();
  }
}

checkTables();
