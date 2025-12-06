/**
 * Script para hashear contraseñas de administradores en PostgreSQL
 * Ejecutar solo si las contraseñas están en texto plano
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

// Crear conexión directa a PostgreSQL usando las variables correctas
const sequelize = new Sequelize(
  process.env.DB_NAME_PG || 'conjuntoSantander',
  process.env.DB_USER_PG || 'postgres',
  process.env.DB_PASSWORD_PG || '7568',
  {
    host: process.env.DB_HOST_PG || 'localhost',
    port: process.env.DB_PORT_PG || 5432,
    dialect: 'postgres',
    logging: false
  }
);

// Definir modelo Admin directamente
const Admin = sequelize.define("admin", {
  admin_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuario_admin: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contra_admin: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rol: {
    type: DataTypes.STRING,
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nom_admin: {
    type: DataTypes.STRING
  }
}, {
  tableName: 'admin',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat'
});

async function hashearPasswordsPostgres() {
  try {
    console.log('🔌 Conectando a PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL\n');

    // Obtener todos los admins
    const admins = await Admin.findAll();
    
    console.log(`📊 Total de administradores encontrados: ${admins.length}\n`);

    for (const admin of admins) {
      console.log(`--- Usuario: ${admin.usuario_admin} ---`);
      console.log(`Rol: ${admin.rol}`);
      console.log(`Estado: ${admin.estado}`);
      
      // Verificar si la contraseña ya está hasheada
      const yaHasheada = admin.contra_admin.startsWith('$2a$') || 
                         admin.contra_admin.startsWith('$2b$');
      
      if (yaHasheada) {
        console.log('✓ Contraseña ya está hasheada\n');
        continue;
      }
      
      console.log('⚠️  Contraseña en texto plano detectada');
      console.log(`Contraseña actual: ${admin.contra_admin}`);
      
      // Hashear la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(admin.contra_admin, salt);
      
      // Actualizar en la base de datos
      await Admin.update(
        { contra_admin: hashedPassword },
        { where: { admin_id: admin.admin_id } }
      );
      
      console.log('✅ Contraseña hasheada correctamente');
      console.log(`Nuevo hash: ${hashedPassword.substring(0, 30)}...\n`);
    }

    console.log('\n✅ Proceso completado exitosamente');
    console.log('Ahora puedes iniciar sesión con PostgreSQL');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log('\n🔌 Conexión cerrada');
  }
}

// Ejecutar el script
hashearPasswordsPostgres()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
