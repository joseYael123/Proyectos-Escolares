const controller = require('../../app/controllers/postgresControllers/guardia.controller');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de Multer con creación automática de carpeta
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        const rutaDestino = path.join(process.cwd(), 'app/public/imagenes/postgres/guardia');
        if (!fs.existsSync(rutaDestino)) {
            fs.mkdirSync(rutaDestino, { recursive: true });
        }
        cb(null, rutaDestino);
    },
    filename: function(req, file, cb) {   
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()*1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

function fileFilter(req, file, cb){
    const permitido = /jpg|jpeg|png|gif|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if(permitido.test(ext)){
        cb(null, true);
    } else {
        cb(new Error(`Solo se permiten imagenes con el formato ${permitido}`));
    }
}
 
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});

const validaciones = [
    body('nom_guardia').notEmpty().withMessage('El nombre del guardia es obligatorio'),
    body('app_guardia').notEmpty().withMessage('El apellido paterno del guardia es obligatorio'),   
    body('apm_guardia').notEmpty().withMessage('El apellido materno del guardia es obligatorio'),
    body('numero_guardia').notEmpty().withMessage('El número del guardia es obligatorio'),
    body('contra_guardia').notEmpty().withMessage('La contraseña del guardia es obligatoria')
];

const validacionesPut = [
    body('nom_guardia').optional(),
    body('app_guardia').optional(),
    body('apm_guardia').optional(),
    body('numero_guardia').optional(),
    body('contra_guardia').optional(),
    body('imagen').optional()
];

router.get('/', controller.listar_guardias);
router.get('/:id', controller.listar_guardia_id);
router.post('/', upload.single('imagen'), validaciones, controller.insert_guardia);
router.put('/:id', upload.single('imagen'), validacionesPut, controller.upd_guardia);
router.delete('/:id', controller.delete_guardia);

module.exports = router;