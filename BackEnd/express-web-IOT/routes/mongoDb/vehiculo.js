const controller = require('../../app/controllers/mongoControllers/vehiculo.controller');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const sharp = require('sharp');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

// --- CONFIGURACIÓN GENERAL ---
const DEST_FOLDER = path.join(__dirname, '../../../public/imagenes/mongo/vehiculo');

// Aseguramos que la carpeta exista
if (!fs.existsSync(DEST_FOLDER)) {
    fs.mkdirSync(DEST_FOLDER, { recursive: true });
}

// --- 1. MULTER PARA WEB (Solo Texto) ---
// Usamos .none() para la ruta web porque el formulario de confirmación
// solo envía texto (placa y tipo), no sube fotos.
const uploadNone = multer().none();

// --- 1.1 MULTER PARA UPDATE (Con Archivo) ---
// Por si en el futuro quieres editar y subir foto manualmente
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, DEST_FOLDER),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});
const uploadFile = multer({ 
    storage: diskStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const permitido = /\.(jpg|jpeg|png|gif|webp)$/i;
        if (permitido.test(file.originalname)) cb(null, true);
        else cb(new Error('Solo formato imagen'), false);
    }
});


// --- 2. PARSER PARA IOT (Imagen Cruda) ---
const rawImageParser = express.raw({
    type: 'image/jpeg', 
    limit: '5mb' 
});

// --- 3. MIDDLEWARE PROCESADOR IOT ---
async function processRawImage(req, res, next) {
    if (!req.body || req.body.length === 0) {
        console.error("processRawImage: No se recibió body.");
        return res.status(400).json({ msg: "No se recibió imagen binaria." });
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const newFilename = `placa_iot-${uniqueSuffix}.jpg`;
    const outputPath = path.join(DEST_FOLDER, newFilename);

    try {
        await sharp(req.body).rotate(90).toFile(outputPath);
        
        // Simulamos el objeto req.file para que el controlador no note la diferencia
        req.file = {
            path: outputPath,
            filename: newFilename,
            destination: DEST_FOLDER
        };
        console.log(`Imagen IOT (Mongo) procesada: ${newFilename}`);
        next();
    } catch (err) {
        console.error('Error Sharp Mongo:', err);
        return res.status(500).json({ msg: 'Error al procesar imagen IOT' });
    }
}

// --- VALIDACIONES WEB ---
const validacionesPOST = [
    body('placas').notEmpty().withMessage('Las placas son requeridas'),
    body('modelo').notEmpty().withMessage('El modelo es requerido'), 
    body('color').notEmpty().withMessage('El color es requerido'),
    body('placa_imagen').optional()
];

// --- RUTAS ---

router.get('/', controller.listar_vehiculos);
router.get('/:id', controller.listar_vehiculo_id);
router.delete('/:id', controller.delete_vehiculo);

// Ruta Web (Usa uploadNone para aceptar el FormData sin archivos)
router.post('/web', validacionesPOST, controller.insert_vehiculo);

// Ruta IOT (ESP32)
router.post('/placa', 
    rawImageParser, 
    processRawImage, 
    controller.updYinsert 
);

// Ruta Update (Permite subir archivo si es necesario)
router.put('/:id', uploadFile.single('placa_imagen'), controller.upd_vehiculo);

module.exports = router;