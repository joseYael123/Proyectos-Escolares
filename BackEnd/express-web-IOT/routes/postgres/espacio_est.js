const controller = require('../../app/controllers/postgresControllers/espacio_est.controller');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const validaciones = [
    body('numero_cajon').notEmpty().withMessage('El numero del cajon es obligatorio').isInt(),
    body('tipo_espacio').notEmpty().withMessage('El tipo de espacio es obligatorio').isString(),
    body('estado_disponible').isBoolean().withMessage('El estado de disponibilidad debe ser un valor booleano'),
    // Importante: Validar el ID del lote
    body('id_lot').notEmpty().withMessage('El ID del lote (Parking Lot) es obligatorio').isInt()
];
 
const validacionesPut = [
    body('numero_cajon').optional().isInt(),
    body('tipo_espacio').optional().isString(),
    body('estado_disponible').optional().isBoolean(),
    body('id_lot').optional().isInt()
];

router.get('/', controller.listar_espacios);
router.get('/:id', controller.listar_espacio_id);
router.post('/', validaciones, controller.insert_espacio);
router.put('/:id', validacionesPut, controller.upd_espacio);
router.delete('/:id', controller.delete_espacio);

module.exports = router;