const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Conexión con PostgreSQL mediante DATABASE_URL de Render
const databaseUrl = process.env.DATABASE_URL;

const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false
    })
  : null;

// Crear tabla de usuarios si todavía no existe
async function initializeDatabase() {
  if (!pool) {
    console.log('Modo local: PostgreSQL no configurado.');
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      email VARCHAR(180) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      rol VARCHAR(20) NOT NULL DEFAULT 'docente',
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Base de datos de Plan con IA conectada');
  console.log('Tabla usuarios verificada');

  // Crear administrador inicial únicamente cuando Render
  // proporcione las variables de entorno correspondientes.
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminNombre = process.env.ADMIN_NAME || 'Administrador';

  if (!adminEmail || !adminPassword) {
    console.log('Administrador inicial no configurado.');
    return;
  }

  if (adminPassword.length < 8) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres.');
  }

  const existente = await pool.query(
    'SELECT id, rol FROM usuarios WHERE LOWER(email) = LOWER($1)',
    [adminEmail]
  );

  if (existente.rows.length > 0) {
    console.log('El administrador inicial ya existe.');
    return;
  }

  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await pool.query(
    `
    INSERT INTO usuarios
      (nombre, email, password_hash, rol)
    VALUES
      ($1, $2, $3, 'admin')
    `,
    [adminNombre, adminEmail.toLowerCase(), passwordHash]
  );

  console.log('Administrador inicial creado correctamente.');
}

// Estado del backend
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    app: 'Plan con IA',
    message: 'Backend funcionando correctamente'
  });
});

// Estado de la conexión con PostgreSQL
app.get('/api/db-health', async (req, res) => {
  if (!pool) {
    return res.json({
      ok: true,
      database: 'PostgreSQL',
      connected: false,
      mode: 'local',
      message: 'PostgreSQL no está configurado en este equipo'
    });
  }

  try {
    const result = await pool.query('SELECT NOW() AS fecha');

    res.json({
      ok: true,
      database: 'PostgreSQL',
      connected: true,
      fecha: result.rows[0].fecha
    });
  } catch (error) {
    console.error('Error PostgreSQL:', error.message);

    res.status(500).json({
      ok: false,
      database: 'PostgreSQL',
      connected: false
    });
  }
});
async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Plan con IA backend ejecutándose en el puerto ${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el backend:');
    console.error(error);
    process.exit(1);
  }
}

startServer();