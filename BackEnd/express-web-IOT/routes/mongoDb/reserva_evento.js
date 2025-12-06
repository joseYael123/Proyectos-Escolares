const controller = require('../../app/controllers/mongoControllers/reserva.controller');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Expresión regular para formato HH:MM:SS
const timeIntervalRegex = /^\d{2}:\d{2}:\d{2}$/;

const validaciones = [
    body('id_evento').notEmpty().withMessage('id_evento es requerido').isNumeric(),
    body('id_sala').notEmpty().withMessage('id_sala es requerida').isNumeric(),
    body('periodo_start').notEmpty().withMessage('El inicio es requerido').isISO8601().toDate(),
    body('periodo_end').notEmpty().withMessage('El fin es requerido').isISO8601().toDate(),
    body('cant_vehiculos').notEmpty().withMessage('La cantidad de vehículos es requerida').isInt({ min: 0 }),
    body('duracion_montaje').notEmpty().withMessage('La duración de montaje es requerida').matches(timeIntervalRegex).withMessage('Debe tener formato HH:MM:SS'),
    body('duracion_desmontaje').notEmpty().withMessage('La duración de desmontaje es requerida').matches(timeIntervalRegex).withMessage('Debe tener formato HH:MM:SS')
];

// --- RUTAS ESPECÍFICAS PRIMERO ---

// 1. Búsqueda por fecha (GET)
// Agregamos el prefijo '/fecha/' para que no choque con el ID
// URL Ejemplo: GET http://localhost:5000/mg/reserva/fecha/2025-11-30
router.get('/fecha/:fecha', controller.buscar_eventos_fecha);

// --- RUTAS GENERALES DESPUÉS ---

router.get('/', controller.listar_reservas);

// 2. Búsqueda por ID (GET)
// Esta ruta captura cualquier cosa que no coincida con las de arriba (como '/fecha/...')
router.get('/:id', controller.listar_reserva_id);

router.post('/', validaciones, controller.insert_reserva);
router.put('/:id', validaciones, controller.upd_reserva);
router.delete('/:id', controller.delete_reserva);

module.exports = router;