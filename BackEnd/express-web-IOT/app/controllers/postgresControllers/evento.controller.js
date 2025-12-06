const model = require('../../models/postgresModels/Evento');
const ResponsableModel = require('../../models/postgresModels/Responsable');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// Importamos AMBAS funciones
const { enviarCorreoRechazo } = require('../../../services/gmailService');

const RUTA_BASE_IMAGENES = path.join(process.cwd(), 'public/imagenes/postgres/evento');

if (!fs.existsSync(RUTA_BASE_IMAGENES)) {
    fs.mkdirSync(RUTA_BASE_IMAGENES, { recursive: true });
}

function safeUnlink(filePath) {
  try {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('🗑️ Archivo eliminado:', filePath);
    }
  } catch (err) {
    console.error('❌ Error borrando archivo:', filePath, err);
  }
}

const listar_eventos = async (req, res) => {
    try { const lista = await model.findAll(); return res.status(200).json({ msg: "Datos", Datos: lista }); } 
    catch (e) { return res.status(500).json({ error: e.message }); }
};
const listar_evento_id = async (req, res) => {
    try { const i = await model.findByPk(req.params.id); return i ? res.status(200).json({Datos: i}) : res.status(404).json({msg:"No existe"}); }
    catch (e) { return res.status(500).json({error: e.message}); }
};
const insert_evento = async (req, res) => {
    try { const i = await model.create({...req.body, qr_imagen: req.file ? `/imagenes/postgres/evento/${req.file.filename}` : null}); return res.status(201).json({Insercion: i}); }
    catch (e) { if(req.file) safeUnlink(req.file.path); return res.status(500).json({error: e.message}); }
};

const upd_evento = async (req, res) => {
  let { id } = req.params;
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }

    const evento = await model.findByPk(id);
    if (!evento) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(404).json({ msg: "No hay un evento con ese id" });
    }

    const datosNuevos = {...req.body};
    const antiguaImagenUrl = evento.qr_imagen;

    // 1. Si hay nueva imagen
    if (req.file) {
      datosNuevos.qr_imagen = `/imagenes/postgres/evento/${req.file.filename}`;
    }

    // 2. LÓGICA DE DENEGACIÓN
    const esDenegado = datosNuevos.estado === 'Denegado' || datosNuevos.estado === 'Denegar';
    
    if (esDenegado) {
        console.log(`🛑 Evento ${id} DENEGADO. Procesando limpieza y correo...`);

        // A. ENVIAR CORREO DE RECHAZO
        try {
            const responsable = await ResponsableModel.findByPk(evento.id_responsable);
            if (responsable) {
                // Enviamos el correo de rechazo (sin await para no bloquear, o con await si prefieres)
                enviarCorreoRechazo(evento, responsable); 
            }
        } catch (mailErr) {
            console.error("Error enviando correo rechazo:", mailErr);
        }

        // B. LIMPIAR DATOS
        datosNuevos.qr_imagen = null;
        datosNuevos.qr_evento = null;
        
        // Si subieron archivo por error al denegar, borrarlo inmediatamente
        if (req.file) safeUnlink(req.file.path); 
    }

    evento.set(datosNuevos);
    const saved = await evento.save();

    // 3. BORRADO DE IMAGEN ANTIGUA
    const borrarAntigua = (req.file && !esDenegado) || esDenegado;

    if (borrarAntigua && antiguaImagenUrl) {
      const nombreArchivo = path.basename(antiguaImagenUrl);
      const rutaAbsoluta = path.join(RUTA_BASE_IMAGENES, nombreArchivo);
      safeUnlink(rutaAbsoluta);
    }

    return res.status(200).json({ msg: "Evento actualizado correctamente", Upd: saved });
  } catch (error) {
    console.error("Error al actualizar evento", error);
    if (req.file) safeUnlink(req.file.path);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

const delete_evento = async (req, res) => {
    try { 
        const e = await model.findByPk(req.params.id); 
        if(!e) return res.status(404).json({msg:"No existe"});
        if(e.qr_imagen) { safeUnlink(path.join(RUTA_BASE_IMAGENES, path.basename(e.qr_imagen))); }
        await e.destroy(); return res.status(200).json({msg:"Borrado"});
    } catch(err) { return res.status(500).json({error: err.message}); }
};

module.exports = {
  listar_eventos,
  listar_evento_id,
  insert_evento,
  upd_evento,
  delete_evento
};