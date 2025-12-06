const express = require('express');
const router = express.Router();
const controller = require('../../app/controllers/mongoControllers/evento.controller');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- 1. CONFIGURACIÓN DE MULTER (Igual que en Postgres) ---
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        // Ruta absoluta para evitar problemas de sistema operativo
        const rutaDestino = path.join(process.cwd(), 'public/imagenes/mongo/evento');
        
        // Crear carpeta si no existe
        if (!fs.existsSync(rutaDestino)) {
            console.log('📁 (Mongo) Creando carpeta:', rutaDestino);
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

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});

// --- 2. VALIDACIONES (Sincronizadas con lógica de negocio) ---
// Permitimos que qr_evento sea null y aceptamos 'Denegado'

const validaciones = [
    body('nombre_evento').notEmpty().withMessage('Nombre requerido'),
    body('descripcion').notEmpty().withMessage('Descripción requerida'),
    body('categoria_evento').notEmpty().withMessage('Categoría requerida'),
    
    // QR puede venir vacío al crear o null al denegar
    body('qr_evento').optional({ nullable: true }), 
    body('qr_imagen').optional({ nullable: true }),
    
    // Agregamos 'Denegado' y 'Denegar' a la lista permitida
    body('estado').optional().isIn(['Pendiente', 'Aprobado', 'Rechazado', 'Confirmado', 'Denegado', 'Denegar']).withMessage('Estado no válido')
];

// --- 3. RUTAS ---
router.get('/', controller.listar_eventos);
router.get('/:id', controller.listar_evento_id);

// POST: Crear
router.post('/', upload.single('qr_imagen'), validaciones, controller.insert_evento);

// PUT: Actualizar (Confirmar / Denegar / Editar)
router.put('/:id', upload.single('qr_imagen'), validaciones, controller.upd_evento);

// DELETE
router.delete('/:id', controller.delete_evento);

module.exports = router;