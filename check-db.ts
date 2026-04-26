import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error("❌ Error: TURSO_DATABASE_URL y TURSO_AUTH_TOKEN deben estar definidos en el archivo .env");
  process.exit(1);
}

const client = createClient({
  url: url,
  authToken: authToken,
});

async function check() {
  try {
    const result = await client.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    console.log('✅ Tablas encontradas en la base de datos:');
    if (result.rows.length === 0) {
      console.log('   (No hay tablas aún)');
    } else {
      result.rows.forEach(row => {
        console.log(`   - ${row.name}`);
      });
    }
  } catch (error) {
    console.error('❌ Error al conectar con Turso:', error);
  }
}

check();
