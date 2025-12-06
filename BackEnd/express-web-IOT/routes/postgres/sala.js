const controller = require('../../app/controllers/postgresControllers/sala.controller');
const express = require('express');
const router = express.Router();
const {body} = require('express-validator');

const validaciones = [
    body('nombre_sala').notEmpty().withMessage('El nombre de la sala es obligatorio'),
    body('descripcion').notEmpty().withMessage('La descripción es obligatoria'),
    body('capacidad').isInt({ min: 1 }).withMessage('La capacidad debe ser un entero positivo'),
    body('estado').isIn(['activo', 'inactivo']).withMessage('El estado debe ser "activo" o "inactivo"'),
];


router.get('/', controller.listar_salas);
router.get('/:id', controller.listar_sala_id);
router.post('/', validaciones, controller.insert_sala);
router.put('/:id', validaciones, controller.upd_sala);
router.delete('/:id', controller.delete_sala);

module.exports = router;
