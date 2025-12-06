const model = require('../../models/mongoModels/Evento');
const ResponsableModel = require('../../models/mongoModels/Responsable'); 
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// 1. IMPORTACIÓN CORRECTA (enviarCorreoRechazo)
const { enviarCorreoRechazo } = require('../../../services/gmailService'); 

// ==========================================
// CONFIGURACIÓN DE RUTA ABSOLUTA
// ==========================================
// Define dónde se guardan FÍSICAMENTE los archivos
const RUTA_BASE_IMAGENES = path.join(process.cwd(), 'public/imagenes/mongo/evento');

// Asegurar que la carpeta exista
if (!fs.existsSync(RUTA_BASE_IMAGENES)) {
    fs.mkdirSync(RUTA_BASE_IMAGENES, { recursive: true });
}

// ==========================================
// HELPER DE BORRADO SEGURO
// ==========================================
function safeUnlink(inputPath) {
    if (!inputPath) return;

    let pathFinal = inputPath;

    // Si la ruta NO es absoluta (es decir, viene de la BD como "/imagenes/mongo/..."),
    // extraemos el nombre y construimos la ruta absoluta del sistema.
    if (!path.isAbsolute(inputPath)) {
        const nombreArchivo = path.basename(inputPath);
        pathFinal = path.join(RUTA_BASE_IMAGENES, nombreArchivo);
    }
    // Si YA es absoluta (viene de req.file.path de Multer), la usamos tal cual.

    try {
        if (fs.existsSync(pathFinal)) {
            fs.unlinkSync(pathFinal);
            console.log('🗑️ (Mongo) Imagen eliminada del disco:', pathFinal);
        } else {
            console.log('⚠️ El archivo a borrar no existía en disco:', pathFinal);
        }
    } catch (err) {
        console.error('❌ (Mongo) Error borrando archivo:', pathFinal, err.message);
    }
}

// ==========================================
// FUNCIONES DEL CONTROLADOR
// ==========================================

const listar_eventos = async (req, res) => {
    try {
        const lista = await model.find();
        return res.status(200).json({ msg: "Datos de eventos", Datos: lista });
    } catch (error) {
        console.error("Error al traer eventos", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const listar_evento_id = async (req, res) => {
    let { id } = req.params;
    try {
        const item = await model.findOne({ id_evento: id });
        if (!item) return res.status(404).json({ msg: "Evento no encontrado" });
        return res.status(200).json({ msg: "Datos del evento", Datos: item });
    } catch (error) {
        console.error("Error al traer evento", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const insert_evento = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        if (req.file) safeUnlink(req.file.path);
        return res.status(400).json({ errors: errores.array() });
    }

    try {
        const imagenRoute = req.file ? `/imagenes/mongo/evento/${req.file.filename}` : null;
        
        const payload = {
            ...req.body,
            qr_imagen: imagenRoute
        };

        const insertado = await model.create(payload);
        return res.status(201).json({ msg: "Evento creado correctamente", Insercion: insertado });
    } catch (error) {
        if (req.file) safeUnlink(req.file.path);
        console.error("Error al insertar evento", error);
        return res.status(500).json({ msg: "Error interno", error: error.message });
    }
}

const upd_evento = async (req, res) => {
    let { id } = req.params;

    // Validación de errores
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        if (req.file) safeUnlink(req.file.path);
        return res.status(400).json({ errors: errores.array() });
    }

    try {
        const eventoActual = await model.findOne({ id_evento: id });
        
        if (!eventoActual) {
            if (req.file) safeUnlink(req.file.path);
            return res.status(404).json({ msg: "No hay un evento con ese id" });
        }
        
        const antiguaImagen = eventoActual.qr_imagen;
        const datosActualizar = { ...req.body };

        // ----------------------------------------------------
        // 1. DETECTAR SI SE ESTÁ DENEGANDO
        // ----------------------------------------------------
        // Normalizamos comprobando varios strings posibles
        const esDenegado = ['Denegado', 'Denegar', 'Rechazado'].includes(datosActualizar.estado);

        // ----------------------------------------------------
        // 2. GESTIÓN DE LA IMAGEN NUEVA (req.file)
        // ----------------------------------------------------
        if (req.file) {
            if (esDenegado) {
                // CASO CRÍTICO: Se subió imagen, pero el estado es Denegado.
                // ACCIÓN: Borrar la imagen nueva INMEDIATAMENTE.
                console.log(`⚠️ Imagen subida en evento Denegado. Eliminando nueva: ${req.file.filename}`);
                safeUnlink(req.file.path); // Usamos .path que es la absoluta de Multer
                
                datosActualizar.qr_imagen = null;
            } else {
                // CASO NORMAL: Guardar la ruta relativa para la BD
                datosActualizar.qr_imagen = `/imagenes/mongo/evento/${req.file.filename}`;
            }
        }

        // Si es denegado, limpiamos cualquier referencia a QR en la BD
        if (esDenegado) {
            datosActualizar.qr_imagen = null;
            datosActualizar.qr_evento = null; 
        }

        // ----------------------------------------------------
        // 3. ACTUALIZAR EN BASE DE DATOS
        // ----------------------------------------------------
        const actualizado = await model.findOneAndUpdate(
            { id_evento: id },
            datosActualizar,
            { new: true }
        );

        // ----------------------------------------------------
        // 4. BORRADO DE IMAGEN ANTIGUA (Limpieza)
        // ----------------------------------------------------
        // Borramos la antigua si:
        // A) Se subió una nueva válida (reemplazo).
        // B) O el evento fue denegado (limpieza total).
        
        const seReemplazoImagen = (req.file && !esDenegado);
        const seDebeBorrarAntigua = seReemplazoImagen || esDenegado;

        if (seDebeBorrarAntigua && antiguaImagen) {
            console.log("🔄 Eliminando imagen antigua de la BD...");
            safeUnlink(antiguaImagen);
        }

        // ----------------------------------------------------
        // 5. ENVÍO DE CORREO DE RECHAZO
        // ----------------------------------------------------
        if (esDenegado) {
            // Ejecutamos en bloque try/catch independiente para no bloquear la respuesta HTTP
            (async () => {
                try {
                    const responsable = await ResponsableModel.findOne({ id_responsable: eventoActual.id_responsable });
                    
                    if (responsable && responsable.correo_electronico) {
                        console.log(`📧 Enviando correo de RECHAZO a: ${responsable.correo_electronico}`);
                        
                        await enviarCorreoRechazo(
                            responsable.correo_electronico, 
                            eventoActual.nombre_evento, 
                            datosActualizar.motivo_rechazo || "Motivos administrativos (Sin especificar)"
                        );
                    } else {
                        console.warn("⚠️ No se encontró correo del responsable para notificar rechazo.");
                    }
                } catch (mailError) {
                    console.error("❌ Error enviando correo de rechazo:", mailError.message);
                }
            })();
        }

        return res.status(200).json({ msg: "Evento actualizado correctamente", Upd: actualizado });

    } catch (error) {
        // En caso de error fatal, limpiar si quedó algo subido
        if (req.file) safeUnlink(req.file.path);
        console.error("Error al actualizar evento", error);
        return res.status(500).json({ msg: "Error interno", error: error.message });
    }
}

const delete_evento = async (req, res) => {
    let { id } = req.params;
    try {
        const borrado = await model.findOneAndDelete({ id_evento: id });
        if (!borrado) {
            return res.status(404).json({ msg: "No hay un evento con ese id" });
        }

        if (borrado.qr_imagen) {
            safeUnlink(borrado.qr_imagen);
        }

        return res.status(200).json({ msg: "Evento borrado correctamente", Deleted: borrado });
    } catch (error) {
        console.error("Error al borrar evento", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

module.exports = {
    listar_eventos, 
    listar_evento_id, 
    insert_evento, 
    upd_evento, 
    delete_evento
};