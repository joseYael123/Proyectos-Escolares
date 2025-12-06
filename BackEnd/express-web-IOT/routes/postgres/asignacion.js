const controller = require('../../app/controllers/postgresControllers/asignacion.controller');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const validaciones = [
    // IDs obligatorios para relacionar
    body('id_evento').notEmpty().withMessage('El ID del evento es requerido').isInt(),
    body('id_espacio').notEmpty().withMessage('El ID del espacio es requerido').isInt(),
    // id_vehiculo es opcional al inicio si aún no se tiene el dato específico
    body('id_vehiculo').optional().isInt(),

    // Fechas
    body('fecha_asignacion').notEmpty().withMessage('Fecha de asignacion es requerida').isString(),
    
    // Opcionales al crear
    body('fecha_liberacion').optional({ nullable: true }).isString().withMessage('Fecha de liberacion debe ser texto'),
    body('observaciones').optional({ nullable: true }).isString()
];

const validacionesPut = [
    body('id_evento').optional().isInt(),
    body('id_espacio').optional().isInt(),
    body('id_vehiculo').optional().isInt(),
    body('fecha_asignacion').optional().isString(),
    body('fecha_liberacion').optional({ nullable: true }).isString(),
    body('observaciones').optional({ nullable: true }).isString(),
];

router.get('/', controller.listar_asignaciones);
router.get('/:id', controller.listar_asignacion_id);
router.post('/', validaciones, controller.insert_asignacion);
router.put('/:id', validacionesPut, controller.upd_asignacion);
router.delete('/:id', controller.delete_asignacion);

module.exports = router;