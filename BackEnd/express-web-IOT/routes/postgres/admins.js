const admins = require('../../app/controllers/postgresControllers/admin.controller');
const express = require('express');
const router = express.Router();
const {body} = require('express-validator');
const multer = require('multer');
const path = require('path');

// Importamos middleware de autenticación
const { verifyToken, verifyAdmin, verifyAdminOrEditor } = require('../../app/middleware/auth');

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, path.join(__dirname, '../../public/imagenes/postgres/admin'));
    },
    filename: function(req,file,cb) {   
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()*1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
})
 function filtro(req,file,cb){
    const permitido = /jpg|jpeg|png|gif|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if(permitido.test(ext)){
        cb(null, true)
       } else {
         cb(new Error(`Solo se permiten imagenes con el formato ${permitido}`));
       }
    }
 
const upload = multer({
    storage,
    fileFilter: filtro,
    limits: { fileSize: 2 * 1024 * 1024 }
});

// Validaciones para POST (apm_admin es opcional)
const validacionesPOST = [
    body('nom_admin').notEmpty().withMessage('El nombre es requerido'),
    body('app_admin').notEmpty().withMessage('El apellido paterno es requerido'),
    body('apm_admin').optional(),
    body('correo').isEmail().withMessage('El correo no es válido'),
    body('usuario_admin').notEmpty().withMessage('El usuario es requerido'),
    body('contra_admin').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
];

// Validaciones para PUT (todos opcionales)
const validacionesPUT = [
    body('nom_admin').optional().notEmpty().withMessage('El nombre es requerido'),
    body('app_admin').optional().notEmpty().withMessage('El apellido paterno es requerido'),
    body('apm_admin').optional().notEmpty().withMessage('El apellido materno es requerido'),
    body('correo').optional().isEmail().withMessage('El correo no es válido'),
    body('usuario_admin').optional().notEmpty().withMessage('El usuario es requerido'),
    body('contra_admin').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
];




// Rutas SIN autenticación (TEMPORAL para desarrollo)
// GET - Listar todos los admins
router.get('/', admins.listar_admins);

// GET - Listar admin por ID
router.get('/:id', admins.listar_admins_id);

// POST - Crear nuevo admin
router.post('/', upload.single('imagen'), validacionesPOST, admins.insert_admins);

// PUT - Actualizar admin
router.put('/:id', upload.single('imagen'), validacionesPUT, admins.upd_admin);

// DELETE - Eliminar admin
router.delete('/:id', admins.delete_admin);

// RUTAS ORIGINALES CON AUTENTICACIÓN (comentadas temporalmente)
// router.get('/', verifyToken, verifyAdminOrEditor, admins.listar_admins);
// router.get('/:id', verifyToken, verifyAdminOrEditor, admins.listar_admins_id);
// router.post('/', verifyToken, verifyAdmin, upload.single('imagen'), validacionesPOST, admins.insert_admins);
// router.put('/:id', verifyToken, verifyAdmin, upload.single('imagen'), validacionesPUT, admins.upd_admin);
// router.delete('/:id', verifyToken, verifyAdmin, admins.delete_admin);

module.exports = router;


