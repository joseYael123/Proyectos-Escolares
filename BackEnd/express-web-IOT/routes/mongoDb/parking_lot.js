const controller = require('../../app/controllers/mongoControllers/parking_lot.controller');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const validaciones = [
    body('nombre_lot').notEmpty().withMessage('El nombre del lote es requerido'),
    body('total_espacios').notEmpty().withMessage('El total de espacios es requerido').isInt({ min: 1 }).withMessage('Debe ser un número positivo')
];

router.get('/', controller.listar_parkings);
router.get('/:id', controller.listar_parking_id);
router.post('/', validaciones, controller.insert_parking);
router.put('/:id', validaciones, controller.upd_parking);
router.delete('/:id', controller.delete_parking);

module.exports = router;