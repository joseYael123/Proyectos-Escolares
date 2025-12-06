const controller = require('../../app/controllers/postgresControllers/movimento.controller');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const validaciones = [
    body('tipo_operacion').notEmpty().withMessage('El tipo de movimiento es obligatorio')
        .isLength({max: 20}).withMessage('El tipo de movimiento no puede exceder los 20 caracteres'),
    body('direccion_vehiculo').notEmpty().withMessage('La dirección del vehículo es obligatoria')
        .isLength({max: 10}).withMessage('La dirección del vehículo no puede exceder los 10 caracteres'),
    body('fecha_hora').notEmpty().withMessage('La fecha y hora son obligatorias')
        .isISO8601().withMessage('La fecha y hora deben ser una fecha válida en formato ISO8601')
        .toDate(),
    body('observaciones').optional().isLength({max: 255}).withMessage('Las observaciones no pueden exceder los 255 caracteres')
];

const validacionesPut = [
    body('tipo_operacion').optional().isString().withMessage('El tipo de movimiento debe ser texto'),
    body('direccion_vehiculo').optional().isString().withMessage('La dirección del vehículo debe ser texto')
        .isLength({max: 10}).withMessage('La dirección del vehículo no puede exceder los 10 caracteres'),
    // CORRECCIÓN: isString() llevaba paréntesis
    body('fecha_hora').optional().isString().withMessage('La fecha y hora deben ser texto').toDate(),
    body('observaciones').optional().isLength({max: 255}).withMessage('Las observaciones no pueden exceder los 255 caracteres')
];

router.get('/', controller.listar_movimientos);
router.get('/:id', controller.listar_movimiento_id);
router.post('/', validaciones, controller.insert_movimiento);
router.put('/:id', validacionesPut, controller.upd_movimiento);
router.delete('/:id', controller.delete_movimiento);

module.exports = router;