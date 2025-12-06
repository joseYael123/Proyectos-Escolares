const responsables = require('../../app/controllers/mongoControllers/responsable.controller');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// 1. Importamos y creamos instancia de Multer
// (Asegúrate de que la ruta a utils/multerConfig es correcta)
const { createUpload } = require('./multer');
const upload = createUpload('responsable'); // Subcarpeta 'responsable'

// 2. Validaciones basadas en 'responsableSchema'
const validacionesPOST = [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('apellido_paterno').notEmpty().withMessage('El apellido paterno es requerido'),
    body('apellido_materno').notEmpty().withMessage('El apellido materno es requerido'),
    body('telefono').notEmpty().withMessage('El teléfono es requerido'),
    body('correo_electronico').isEmail().withMessage('Debe ser un correo válido'),
    body('link_social').optional(),
    body('qr_responsable').optional(),
    body('qr_imagen').optional()
];

const validacionesPUT = [
    body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('apellido_paterno').optional().notEmpty().withMessage('El apellido paterno no puede estar vacío'),
    body('apellido_materno').optional().notEmpty().withMessage('El apellido materno no puede estar vacío'),
    body('telefono').optional().notEmpty().withMessage('El teléfono no puede estar vacío'),
    body('correo_electronico').optional().isEmail().withMessage('Debe ser un correo válido'),
    body('link_social').optional(),
    body('qr_responsable').optional()
    // La imagen es opcional en PUT, por eso no se valida 'req.file'
];

// 3. Aplicamos validaciones y Multer
router.get('/', responsables.listar_responsables);
router.get('/:id', responsables.listar_responsable_id);
// Corregido: POST va a '/' y usa upload.single('qr_imagen')
router.post('/', upload.single('qr_imagen'), validacionesPOST, responsables.insert_responsable);
router.put('/:id', upload.single('qr_imagen'), validacionesPUT, responsables.upd_responsable);
router.delete('/:id', responsables.delete_responsable);

module.exports = router;