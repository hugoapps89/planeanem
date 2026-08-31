const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function pregunta(texto) {
  return new Promise(resolve => {
    rl.question(texto, respuesta => {
      resolve(respuesta.trim());
    });
  });
}

async function crearAdministrador() {
  try {
    console.log('');
    console.log('====================================');
    console.log('   CREAR ADMINISTRADOR - PLAN CON IA');
    console.log('====================================');
    console.log('');

    const nombre = await pregunta('Nombre del administrador: ');
    const email = await pregunta('Correo electrónico: ');
    const password = await pregunta('Contraseña: ');

    if (!nombre || !email || !password) {
      console.log('');
      console.log('Error: todos los campos son obligatorios.');
      return;
    }

    if (password.length < 8) {
      console.log('');
      console.log('Error: la contraseña debe tener al menos 8 caracteres.');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const resultado = await pool.query(
      `
      INSERT INTO usuarios
        (nombre, email, password_hash, rol)
      VALUES
        ($1, $2, $3, 'admin')
      RETURNING id, nombre, email, rol, creado_en
      `,
      [nombre, email.toLowerCase(), passwordHash]
    );

    console.log('');
    console.log('====================================');
    console.log(' ADMINISTRADOR CREADO CORRECTAMENTE');
    console.log('====================================');
    console.log('');
    console.log(resultado.rows[0]);
    console.log('');

  } catch (error) {
    if (error.code === '23505') {
      console.log('');
      console.log('Error: ese correo ya está registrado.');
    } else {
      console.error('');
      console.error('Error al crear administrador:');
      console.error(error.message);
    }
  } finally {
    await pool.end();
    rl.close();
  }
}

crearAdministrador();