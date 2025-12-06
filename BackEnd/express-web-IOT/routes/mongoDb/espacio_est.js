const controller = require('../../app/controllers/mongoControllers/espacio_est.controllers');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const validaciones = [
    body('id_lot').notEmpty().withMessage('id_lot es requerido').isNumeric(),
    body('numero_cajon').notEmpty().withMessage('El número de cajón es requerido'),
    body('tipo_espacio').notEmpty().withMessage('El tipo de espacio es requerido'),
    body('estado_disponible').notEmpty().withMessage('El estado es requerido').isBoolean().withMessage('Debe ser true o false')
];

router.get('/', controller.listar_espacios);
router.get('/:id', controller.listar_espacio_id);
router.post('/', validaciones, controller.insert_espacio);
router.put('/:id', validaciones, controller.upd_espacio);
router.delete('/:id', controller.delete_espacio);

module.exports = router;