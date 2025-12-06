const multer = require('multer');
const path = require('path');

/**
 * Filtro de archivos para aceptar solo imágenes.
 */
const fileFilter = (req, file, cb) => {
    const permitido = /jpg|jpeg|png|gif|webp/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (permitido.test(ext)) {
        cb(null, true);
    } else {
        // Rechaza el archivo
        cb(new Error(`Solo se permiten imagenes con formato: ${permitido}`), false);
    }
};

/**
 * Crea una configuración de almacenamiento para Multer.
 * @param {string} subfolder - La subcarpeta donde se guardarán las imágenes (ej. 'admin', 'vehiculos')
 */
const getStorage = (subfolder) => {
    return multer.diskStorage({
        destination: function(req, file, cb) {
            // --- Placeholder para tu ruta de destino ---
            // Reemplaza esto con tu lógica de path.join()
            // Ejemplo: const destinationPath = path.join(__dirname, `../../public/imagenes/mongo/${subfolder}`);
            const destinationPath = path.join(__dirname, `../../public/imagenes/mongo/${subfolder}`);
            cb(null, destinationPath);
        },
        filename: function(req, file, cb) {
            // Genera un nombre de archivo único
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const ext = path.extname(file.originalname);
            cb(null, file.fieldname + '-' + uniqueSuffix + ext);
        }
    });
};

/**
 * Crea una instancia de Multer configurada.
 * @param {string} subfolder - La subcarpeta de destino.
 */
const createUpload = (subfolder) => {
    return multer({
        storage: getStorage(subfolder),
        fileFilter: fileFilter,
        limits: { fileSize: 2 * 1024 * 1024 } // Límite de 2MB
    });
};

module.exports = { createUpload };