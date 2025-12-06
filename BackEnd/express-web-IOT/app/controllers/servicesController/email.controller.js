const { enviarCorreoConfirmacion } = require('../../../services/gmailService');

// Importación condicional de modelos para evitar errores si uno no está configurado
const EventoModel = require('../../models/postgresModels/Evento');
const ResponsableModel = require('../../models/postgresModels/Responsable');
const EventoMongo = require('../../models/mongoModels/Evento'); 
const ResponsableMongo = require('../../models/mongoModels/Responsable');

const path = require('path');
const fs = require('fs');

// DEFINIMOS LAS RUTAS BASE
const RUTA_IMG_POSTGRES = path.join(process.cwd(), 'public/imagenes/postgres/evento');
const RUTA_IMG_MONGO = path.join(process.cwd(), 'public/imagenes/mongo/evento');

const enviarCorreo = async (req, res) => {
    const { id_evento } = req.body;

    console.log(`>>> [Email] Solicitud de envío para evento ID: ${id_evento}`);

    if (!id_evento) {
        return res.status(400).json({ msg: "Falta el id_evento" });
    }

    let evento = null;
    let responsable = null;
    let origenDatos = 'Postgres'; 
    let rutaBaseActual = RUTA_IMG_POSTGRES; 

    // ---------------------------------------------------------
    // 1. BUSCAR EN POSTGRESQL
    // ---------------------------------------------------------
    try {
        evento = await EventoModel.findByPk(id_evento);
    } catch (pgError) {
        console.warn(">>> [Email] Error conexión Postgres:", pgError.message);
        evento = null; // Forzamos nulidad para ir al fallback
    }

    // ---------------------------------------------------------
    // 2. FALLBACK: SI NO ESTÁ EN PG (O FALLÓ), BUSCAR EN MONGO
    // ---------------------------------------------------------
    if (!evento) {
        console.log(">>> [Email] No encontrado en PG. Buscando en MongoDB...");
        
        try {
            // Cambiamos contexto a Mongo
            origenDatos = 'MongoDB';
            rutaBaseActual = RUTA_IMG_MONGO; 

            // Buscar Evento en Mongo
            // Nota: Asegúrate que el campo en Mongo sea 'id_evento' (numérico)
            evento = await EventoMongo.findOne({ id_evento: id_evento });

            if (evento) {
                // Si encontramos evento, buscamos responsable en Mongo
                responsable = await ResponsableMongo.findOne({ id_responsable: evento.id_responsable });
            }

        } catch (mongoError) {
            console.error(">>> [Email] ❌ Error crítico: Fallo también en Mongo.", mongoError);
            return res.status(500).json({ msg: "Error buscando evento en bases de datos" });
        }
    } else {
        // Si se encontró en PG, buscamos responsable en PG
        try {
            responsable = await ResponsableModel.findByPk(evento.id_responsable);
        } catch (e) {
            console.error("Error buscando responsable PG:", e);
        }
    }

    // ---------------------------------------------------------
    // 3. VALIDACIONES FINALES
    // ---------------------------------------------------------
    if (!evento) {
        return res.status(404).json({ msg: "Evento no encontrado en ninguna base de datos." });
    }
    
    if (!responsable) {
        return res.status(404).json({ msg: `El evento existe (${origenDatos}), pero no tiene responsable asociado.` });
    }
    
    if (!evento.qr_imagen) {
        return res.status(400).json({ msg: `El evento (${origenDatos}) no tiene QR generado.` });
    }

    // ---------------------------------------------------------
    // 4. VALIDACIÓN DE ARCHIVO FÍSICO
    // ---------------------------------------------------------
    const nombreArchivo = path.basename(evento.qr_imagen);
    const rutaFisica = path.join(rutaBaseActual, nombreArchivo);
    
    console.log(`>>> [Email] Fuente: ${origenDatos}`);
    console.log(`>>> [Email] Ruta esperada: ${rutaFisica}`);
    
    // Esperamos un poco por si el sistema de archivos es lento (Race condition)
    if (!fs.existsSync(rutaFisica)) {
        // Pequeño reintento de 500ms (Hack para sistemas lentos)
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!fs.existsSync(rutaFisica)) {
            console.error(`>>> [Email] ❌ Archivo no encontrado en disco.`);
            return res.status(500).json({ 
                msg: `Error: La imagen del QR no existe en la carpeta de ${origenDatos}.`,
                path: rutaFisica 
            });
        }
    }

    // ---------------------------------------------------------
    // 5. ENVIAR
    // ---------------------------------------------------------
    try {
        const enviado = await enviarCorreoConfirmacion(evento, responsable, rutaFisica);

        if (enviado) {
            return res.status(200).json({ msg: `Correo enviado exitosamente (Fuente: ${origenDatos})` });
        } else {
            return res.status(500).json({ msg: "El servicio de correo falló al enviar." });
        }
    } catch (mailError) {
        console.error(">>> [Email] Error en nodemailer:", mailError);
        return res.status(500).json({ msg: "Error interno al enviar correo", error: mailError.message });
    }
};

module.exports = {
    enviarCorreo
};