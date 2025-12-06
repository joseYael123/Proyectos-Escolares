const controller = require('../../app/controllers/mongoControllers/guardia.controller');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// 1. Importamos y creamos instancia de Multer
const { createUpload } = require('./multer'); // Ajusta la ruta
const upload = createUpload('guardia'); // Subcarpeta 'guardia'

// 2. Validaciones basadas en guardiaSchema
const validacionesPOST = [
    body('nom_guardia').notEmpty().withMessage('El nombre es requerido'),
    body('app_guardia').notEmpty().withMessage('El apellido paterno es requerido'),
    body('apm_guardia').notEmpty().withMessage('El apellido materno es requerido'),
    body('numero_guardia').notEmpty().withMessage('El número de guardia es requerido'),
    body('contra_guardia').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('estado').optional().isIn(['Activo', 'Inactivo']).withMessage('Estado no válido'),
];

const validacionesPUT = [
    body('nom_guardia').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('app_guardia').optional().notEmpty().withMessage('El apellido paterno no puede estar vacío'),
    body('apm_guardia').optional().notEmpty().withMessage('El apellido materno no puede estar vacío'),
    body('numero_guardia').optional().notEmpty().withMessage('El número de guardia no puede estar vacío'),
    body('contra_guardia').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('estado').optional().isIn(['Activo', 'Inactivo']).withMessage('Estado no válido'),
];

// 3. Aplicamos
router.get('/', controller.listar_guardias);
router.get('/:id', controller.listar_guardia_id);
router.post('/', upload.single('imagen'), validacionesPOST, controller.insert_guardia);
router.put('/:id', upload.single('imagen'), validacionesPUT, controller.upd_guardia);
router.delete('/:id', controller.delete_guardia);

module.exports = router;