const express = require('express');
const controller = require('../../app/controllers/postgresControllers/disponibilidad.controller');
const router = express.Router();
const {query} = require('express-validator');

const validacionMes = [
    query('mes').isInt({ min: 1, max: 12 }).withMessage('El mes debe ser un número entre 1 y 12'),
    query('anio').isInt({ min: 2024, max: 2030 }).withMessage('Año inválido')
];

const validacionDia = [
    query('fecha').isISO8601().withMessage('La fecha debe estar en formato YYYY-MM-DD')
];

// Endpoint A: Resumen del mes para el calendario
router.get('/resumen-mes', validacionMes, controller.getResumenMes);

// Endpoint B: Detalle de salas y bloques para un día específico
router.get('/detalle-dia', validacionDia, controller.getDetalleDia);

module.exports = router;