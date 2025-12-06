const controller = require('../../app/controllers/mongoControllers/asignacion.controller');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const validaciones = [
    body('id_vehiculo').notEmpty().withMessage('id_vehiculo es requerido').isNumeric(),
    body('id_espacio').notEmpty().withMessage('id_espacio es requerido').isNumeric(),
    body('fecha_asignacion').notEmpty().withMessage('La fecha de asignación es requerida').isISO8601().toDate(),
    body('fecha_liberacion').notEmpty().withMessage('La fecha de liberación es requerida').isISO8601().toDate(),
    body('observaciones').notEmpty().withMessage('Las observaciones son requeridas')
];

router.get('/', controller.listar_asignaciones);
router.get('/:id', controller.listar_asignacion_id);
router.post('/', validaciones, controller.insert_asignacion);
router.put('/:id', validaciones, controller.upd_asignacion);
router.delete('/:id', controller.delete_asignacion);

module.exports = router;