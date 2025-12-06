const express = require('express');
const postgreRoutes = require('./routes/postgres/index');
const mongoRoutes = require('./routes/mongoDb/index');
const captcha = require('./services/captcha');
const email = require('./routes/services/email');
const esp32 = require('./routes/services/esp32');
const path = require('path');
const cors = require('cors');
const sequelize = require('./db/sequelize');
const mongoose = require('mongoose');
const app = express();

// Verificar estado de PostgreSQL periódicamente
async function verificarPostgres() {
  try {
    await sequelize.authenticate();
    return true;
  } catch (err) {
    return false;
  }
}

app.use((req, res, next) => {
  console.log('>>> incoming', req.method, req.originalUrl);
  console.log('content-type:', req.headers['content-type']);
  next();
});
app.use(cors());
app.use(express.json());
const rutaImagenes = path.join(process.cwd(), 'public/imagenes');
app.use('/imagenes', express.static(rutaImagenes));

app.use('/', captcha);

// Middleware de failover: Si PostgreSQL no está disponible, redirigir a MongoDB
app.use('/pg', async (req, res, next) => {
  const pgDisponible = await verificarPostgres();
  
  if (pgDisponible) {
    // Si PostgreSQL está disponible, usar sus rutas
    return postgreRoutes(req, res, next);
  } else {
    // Si PostgreSQL no está disponible, verificar MongoDB
    if (mongoose.connection.readyState === 1) {
      console.warn('⚠️  PostgreSQL no disponible, redirigiendo a MongoDB para:', req.originalUrl);
      // Redirigir a las rutas de MongoDB manteniendo la misma ruta
      return mongoRoutes(req, res, next);
    } else {
      // Si ninguna BD está disponible
      return res.status(503).json({
        msg: 'Error',
        error: 'No hay bases de datos disponibles en este momento'
      });
    }
  }
});

app.use('/mg', mongoRoutes);

app.use('/email', email);

app.use('/esp32', esp32);

module.exports = app;
