const controller = require('../../app/controllers/postgresControllers/parking_lot.controller');
const express = require('express');
const router = express.Router();
const {body} = require('express-validator');

const validaciones = [
    body('nombre_lot').notEmpty().withMessage('El nombre del lote es obligatorio'),
    body('total_espacios').isInt({gt: 0}).withMessage('El total de espacios debe ser un número entero mayor que 0')
];

router.get('/', controller.listar_parkings);
router.get('/:id', controller.listar_parking_id);
router.post('/', validaciones, controller.insert_parking);
router.put('/:id', validaciones, controller.upd_parking);
router.delete('/:id', controller.delete_parking);

module.exports = router;
