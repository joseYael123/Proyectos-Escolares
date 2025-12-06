const admins = require('../../app/controllers/mongoControllers/admin.controller');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// 1. Importamos nuestro helper de Multer
const { createUpload } = require('./multer'); // Ajusta la ruta si es necesario
const upload = createUpload('admin'); // Instancia para 'admin'

// 2. Importamos middleware de autenticación
const { verifyToken, verifyAdmin, verifyAdminOrEditor } = require('../../app/middleware/auth');

// Validaciones actualizadas (apm_admin opcional)
const validacionesPOST = [
    body('nom_admin').notEmpty().withMessage('El nombre es requerido'),
    body('app_admin').notEmpty().withMessage('El apellido paterno es requerido'),
    body('apm_admin').optional(),
    body('correo').isEmail().withMessage('Debe ser un correo válido'),
    body('usuario_admin').notEmpty().withMessage('El usuario es requerido'),
    body('contra_admin').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('rol').optional().isIn(['logistica', 'super_admin']).withMessage('Rol no válido'),
    body('estado').optional().isIn(['ACTIVO', 'INACTIVO', 'SUSPENDIDO']).withMessage('Estado no válido'),
];

const validacionesPUT = [
    // En PUT, todo es opcional
    body('nom_admin').optional().notEmpty().withMessage('El nombre es requerido'),
    body('app_admin').optional().notEmpty().withMessage('El apellido paterno es requerido'),
    body('apm_admin').optional(),
    body('correo').optional().isEmail().withMessage('Debe ser un correo válido'),
    body('usuario_admin').optional().notEmpty().withMessage('El usuario es requerido'),
    body('contra_admin').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('rol').optional().isIn(['logistica', 'super_admin']).withMessage('Rol no válido'),
    body('estado').optional().isIn(['ACTIVO', 'INACTIVO', 'SUSPENDIDO']).withMessage('Estado no válido'),
];

// Rutas SIN autenticación (TEMPORAL para desarrollo)
router.get('/', admins.listar_admins);
router.get('/:id', admins.listar_admin_id);
router.post('/', upload.single('imagen'), validacionesPOST, admins.insert_admin);
router.put('/:id', upload.single('imagen'), validacionesPUT, admins.upd_admin);
router.delete('/:id', admins.delete_admin);

// RUTAS ORIGINALES CON AUTENTICACIÓN (comentadas temporalmente)
// router.get('/', verifyToken, verifyAdminOrEditor, admins.listar_admins);
// router.get('/:id', verifyToken, verifyAdminOrEditor, admins.listar_admin_id);
// router.post('/', verifyToken, verifyAdmin, upload.single('imagen'), validacionesPOST, admins.insert_admin);
// router.put('/:id', verifyToken, verifyAdmin, upload.single('imagen'), validacionesPUT, admins.upd_admin);
// router.delete('/:id', verifyToken, verifyAdmin, admins.delete_admin);

module.exports = router;