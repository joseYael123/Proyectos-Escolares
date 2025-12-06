const express = require('express');
const router = express.Router();

// Importar todas las rutas de mongo
const authRoutes = require('./auth');
const adminRoutes = require('./admins');
const asignacionEspacioRoutes = require('./asignacion');
const espacioEstaRoutes = require('./espacio_est');
const eventoRoutes = require('./evento');
const guardiaRoutes = require('./guardia');
const parkingRoutes = require('./parking_lot');
const reservaEventoRoutes = require('./reserva_evento');
const responsableRoutes = require('./responsable');
const salaRoutes = require('./sala');
const vehiculoRoutes = require('./vehiculo');
const movimientoVehiculoRoutes = require('./movimiento');
const disponibilidad = require('./disponibilidad');

// Usar las rutas
router.use('/auth', authRoutes);
router.use('/admins', adminRoutes);
router.use('/asignaciones', asignacionEspacioRoutes);
router.use('/espacios', espacioEstaRoutes);
router.use('/eventos', eventoRoutes);
router.use('/guardias', guardiaRoutes);
router.use('/parkings', parkingRoutes);
router.use('/reservas', reservaEventoRoutes);
router.use('/responsables', responsableRoutes);
router.use('/salas', salaRoutes);
router.use('/vehiculos', vehiculoRoutes);
router.use('/movimientos', movimientoVehiculoRoutes);
router.use('/disponibilidad', disponibilidad);
module.exports = router;
