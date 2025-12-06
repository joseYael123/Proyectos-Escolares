const controller = require('../../app/controllers/postgresControllers/vehiculo.controller');
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
// const sharp = require('sharp'); // Eliminado

const { body, validationResult } = require('express-validator');

// --- Configuración Común ---
const DEST = path.join(process.cwd(), 'public/imagenes/postgres/vehiculo');
if (!fs.existsSync(DEST)) {
  fs.mkdirSync(DEST, { recursive: true });
}

// --- PARSER DE IMAGEN BINARIA CRUDA (CRÍTICO) ---
// Leerá el cuerpo binario de la ESP32-CAM en req.body
const rawImageParser = express.raw({
    type: 'image/jpeg', // Aceptamos el formato de la cámara
    limit: '3mb' 
});

// --- Middleware para guardar el buffer crudo (sustituye a processRawImage) ---
function saveRawImage(req, res, next) {
    // Verificar si la imagen llegó en el cuerpo crudo
    if (!req.body || req.body.length === 0) {
        return res.status(400).send("No se recibió cuerpo de imagen (Esperando image/jpeg).");
    }

    // Generar nombre de archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const newFilename = `placa_imagen-${uniqueSuffix}.jpg`;
    const outputPath = path.join(DEST, newFilename);

    try {
        // Guardar el Buffer directamente en disco (sin rotación)
        fs.writeFileSync(outputPath, req.body);

        // Simular req.file para el controlador
        req.file = {
            path: outputPath,
            filename: newFilename,
            destination: DEST,
            size: req.body.length,
            mimetype: 'image/jpeg'
        };

        console.log(`Imagen CRUDA guardada en disco: ${newFilename}`);
        next(); 

    } catch (err) {
        console.error('Error al guardar imagen binaria:', err);
        return res.status(500).json({ msg: 'Error al guardar la imagen en el servidor' });
    }
}

// --- Validaciones (igual) ---
const validacionesCrear = [
  body('placas').notEmpty().isString().withMessage('Las placas deben ser una cadena de texto'),
  body('modelo').notEmpty().isString().withMessage('El modelo debe ser una cadena de texto'),
  body('color').notEmpty().isString().withMessage('El color debe ser una cadena de texto')
];

const validacionesActualizar = [
  body('placas').optional(),
  body('modelo').optional(),
  body('color').optional()
]

function validarResultados(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const out = errors.array().map(err => ({
      type: 'field',
      msg: err.msg,
      path: err.param,
      location: err.location
    }));
    return res.status(400).json({ errors: out });
  }
  next();
}

// --- Rutas ---
router.get('/', controller.listar_vehiculos);
router.get('/:id', controller.listar_vehiculo_id);

// POST /placa: Recibe la imagen BINARIA CRUDA del ESP32, la guarda y pasa a controller
router.post(
    '/placa',
    rawImageParser, // 1. Lee el cuerpo como BUFFER BINARIO
    saveRawImage, // 2. Guarda el buffer en disco y crea req.file
    validarResultados,
    controller.insertAndUpd
);

// POST /web: Guardado estándar (usando multer normal, que no se usa aquí)
router.post(
    '/web',
    // ... middleware de multer
    validacionesCrear,
    validarResultados,
    controller.insert_vehiculo
);

// PUT: Actualización web
router.put(
    '/:id',
    // ... middleware de multer
    validacionesActualizar,
    validarResultados,
    controller.upd_vehiculo
);

router.delete('/:id', controller.delete_vehiculo);

module.exports = router;