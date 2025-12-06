const controller = require('../../app/controllers/mongoControllers/movimiento.controller');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const validaciones = [
    body('id_vehiculo').notEmpty().withMessage('id_vehiculo es requerido').isNumeric(),
    body('id_evento').notEmpty().withMessage('id_evento es requerido').isNumeric(),
    body('tipo_operacion').notEmpty().withMessage('El tipo de operación es requerido'),
    body('direccion_vehiculo').notEmpty().withMessage('La dirección es requerida'),
    body('fecha_hora').notEmpty().withMessage('La fecha y hora son requeridas').isISO8601().toDate(),
    body('observaciones').optional().isString()
];

router.get('/', controller.listar_movimientos);
router.get('/:id', controller.listar_movimiento_id);
router.post('/', validaciones, controller.insert_movimiento);
router.put('/:id', validaciones, controller.upd_movimiento);
router.delete('/:id', controller.delete_movimiento);

module.exports = router;