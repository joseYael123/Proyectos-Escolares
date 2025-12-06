const controller = require('../../app/controllers/mongoControllers/sala.controller');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const validaciones = [
    body('nombre_sala').notEmpty().withMessage('El nombre de la sala es requerido'),
    body('descripcion').notEmpty().withMessage('La descripción es requerida'),
    body('capacidad').notEmpty().withMessage('La capacidad es requerida').isInt({ min: 1 }).withMessage('Debe ser un número positivo'),
    body('estado').optional().isIn(['activo', 'inactivo']).withMessage('Estado no válido')
];

router.get('/', controller.listar_salas);
router.get('/:id', controller.listar_sala_id);
router.post('/', validaciones, controller.insert_sala);
router.put('/:id', validaciones, controller.upd_sala);
router.delete('/:id', controller.delete_sala);

module.exports = router;