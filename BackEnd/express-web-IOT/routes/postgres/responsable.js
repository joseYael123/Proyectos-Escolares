const responsables = require('../../app/controllers/postgresControllers/responsable.controller');
const express = require('express');
const router = express.Router();
const {body} = require('express-validator');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, path.join(__dirname, '../../public/imagenes/postgres/responsable'));
    },
    filename: function(req,file,cb) {   
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()*1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
})
 function fileFilter(req,file,cb){
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
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }}
)

const validaciones = [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    body('apellido_paterno').notEmpty().withMessage('El apellido paterno es obligatorio'),
    body('apellido_materno').notEmpty().withMessage('El apellido materno es obligatorio'),
    body('telefono').isInt().withMessage('El teléfono debe ser un número de teléfono válido'),
    body('correo_electronico').isEmail().withMessage('El correo electrónico debe ser una dirección de correo válida'),
    body('link_social').optional(),
    body('qr_responsable').optional(),
    body('qr_imagen').optional()
];

//get-all responsables
router.get('/', responsables.listar_responsables);
//get-id responsables
router.get('/:id', responsables.listar_responsable_id);
//post responsables
router.post('/', upload.single('qr_imagen'), validaciones,responsables.insert_responsable);
//update responsables
router.put('/:id', upload.single('qr_imagen'), validaciones,responsables.upd_responsable);
//delete responsables
router.delete('/:id', responsables.delete_responsable);


module.exports = router;
