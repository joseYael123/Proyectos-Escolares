const express = require('express');
const router = express.Router();

// Importar todas las rutas de postgres
const authRoutes = require('./auth');
const adminRoutes = require('./admins'); // Asumo que el tuyo se llama así
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
const disponibilidadRoutes = require('../../routes/postgres/disponibilidad');
// Usar las rutas
router.use('/auth', authRoutes);
router.use('/admins', adminRoutes);
router.use('/asignaciones', asignacionEspacioRoutes);
router.use('/espacios', espacioEstaRoutes);
router.use('/eventos', eventoRoutes);
router.use('/guardias', guardiaRoutes);
router.use('/parkings', parkingRoutes);
router.use('/reservas', reservaEventoRoutes);
router.use('/disponibilidad', disponibilidadRoutes);
router.use('/responsables', responsableRoutes);
router.use('/salas', salaRoutes);
router.use('/vehiculos', vehiculoRoutes);
router.use('/movimientos', movimientoVehiculoRoutes);

module.exports = router;
