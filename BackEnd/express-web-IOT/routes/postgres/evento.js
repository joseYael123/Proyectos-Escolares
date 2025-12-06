const controller = require('../../app/controllers/postgresControllers/evento.controller');
const express = require('express');
const router = express.Router();
const {body} = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // <--- IMPORTANTE: Importar FS

const validaciones = [
    body('nombre_evento').notEmpty().withMessage('Nombre del evento es requerido'),
    body('descripcion').notEmpty().withMessage('Descripcion es requerida'),
    body('categoria_evento').notEmpty().isString().withMessage('Categoria del evento es requerida'),
    body('tipo_de_admision').notEmpty().withMessage('Tipo de admision es requerido'),
    body('qr_evento').optional(),
    body('qr_imagen').optional()
];

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        // 1. Definir la ruta absoluta basada en la raíz del proyecto
        const rutaDestino = path.join(process.cwd(), 'public/imagenes/postgres/evento');
        
        // 2. SOLUCIÓN DEL ERROR ENOENT:
        // Verificar si la carpeta existe, y si no, CREARLA recursivamente.
        if (!fs.existsSync(rutaDestino)) {
            console.log('📁 Carpeta no encontrada. Creando:', rutaDestino);
            fs.mkdirSync(rutaDestino, { recursive: true });
        }

        cb(null, rutaDestino);
    },
    filename: function(req, file, cb) {   
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random()*1e9);
        const ext = path.extname(file.originalname);
        cb(null, 'qr_imagen-' + uniqueSuffix + ext); 
    }
});

function fileFilter(req, file, cb){
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
    limits: { fileSize: 2 * 1024 * 1024 }
});

router.get('/', controller.listar_eventos);
router.get('/:id', controller.listar_evento_id);
router.post('/', upload.single('qr_imagen'), validaciones, controller.insert_evento);
router.put('/:id', upload.single('qr_imagen'), validaciones, controller.upd_evento);
router.delete('/:id', controller.delete_evento);

module.exports = router;