const app = require('./app');
const mongoose = require('mongoose');
const sequelize = require('./db/sequelize');
const definirRelaciones = require('./app/models/relaciones_postgres');
const PORT = 5000;

definirRelaciones();
let postgresConectado = false;
let mongoConectado = false;

// Función para iniciar el servidor
function iniciarServidor() {
  // Actualizar el estado global de PostgreSQL en app.js
  if (postgresConectado) {
    app.locals.postgresDisponible = true;
  }
  
  app.listen(PORT, () => {
    console.log('\n=================================================');
    console.log(`🚀 Servidor corriendo en el puerto ${PORT}`);
    console.log('=================================================');
    
    if (postgresConectado && mongoConectado) {
      console.log('✅ Modo: COMPLETO (PostgreSQL + MongoDB)');
      console.log(`   -> API de PostgreSQL: http://localhost:${PORT}/pg`);
      console.log(`   -> API de MongoDB: http://localhost:${PORT}/mg`);
    } else if (mongoConectado && !postgresConectado) {
      console.log('⚠️  Modo: SOLO MONGODB (PostgreSQL no disponible)');
      console.log(`   -> API de MongoDB: http://localhost:${PORT}/mg`);
      console.log('   💡 Las rutas /pg redirigirán a /mg automáticamente');
    } else if (postgresConectado && !mongoConectado) {
      console.log('⚠️  Modo: SOLO POSTGRESQL (MongoDB no disponible)');
      console.log(`   -> API de PostgreSQL: http://localhost:${PORT}/pg`);
    } else {
      console.log('❌ Modo: SIN BASES DE DATOS (ambas desconectadas)');
    }
    console.log('=================================================\n');
  });
}

// 1. Intentar conectar a PostgreSQL
console.log('🔌 Intentando conectar a PostgreSQL...');
sequelize.authenticate()
  .then(() => {
    console.log('✅ PostgreSQL conectado correctamente');
    postgresConectado = true;
  })
  .catch(err => {
    console.warn('⚠️  PostgreSQL NO disponible:', err.message);
    console.warn('   Continuando solo con MongoDB...');
    postgresConectado = false;
  })
  .finally(() => {
    // 2. Intentar conectar a MongoDB (siempre, independiente de PostgreSQL)
    console.log('🔌 Intentando conectar a MongoDB...');
    return mongoose.connect("mongodb+srv://MongoPaTodos:1234@conjuntosantander.t6mbk8c.mongodb.net/conjuntoSantander?appName=conjuntoSantander")
      .then(() => {
        console.log('✅ MongoDB conectado correctamente');
        mongoConectado = true;
      })
      .catch(err => {
        console.warn('⚠️  MongoDB NO disponible:', err.message);
        mongoConectado = false;
      })
      .finally(() => {
        // 3. Iniciar servidor si al menos UNA base de datos está disponible
        if (postgresConectado || mongoConectado) {
          iniciarServidor();
        } else {
          console.error('\n❌ ERROR CRÍTICO: Ninguna base de datos está disponible');
          console.error('   No se puede iniciar el servidor sin al menos una BD activa.');
          process.exit(1);
        }
      });
  });