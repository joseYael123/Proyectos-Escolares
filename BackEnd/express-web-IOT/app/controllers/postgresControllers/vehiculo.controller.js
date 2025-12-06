const model = require('../../models/postgresModels/Vehiculo');
const Movimiento_vehiculoPg = require('../../models/postgresModels/Movimiento_vehiculo');
const Movimiento_vehiculoMg = require('../../models/mongoModels/Movimiento_vehiculo');
const AsignacionPg = require('../../models/postgresModels/Asignacion_espacio');

const gemini = require('../../../services/geminiApi');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const rutaMandar = require('../../../routes/services/esp32');
const { mandarAccion } = require('../servicesController/esp32.controller');

const { actualizarEstadoGlobal } = require('../servicesController/esp32.controller');

function safeUnlink(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error('Error borrando archivo:', filePath, err);
  }
}

// --- Helper para registrar movimiento (Igual que en esp32.controller) ---
const registrarMovimiento = async (datos) => {
    try {
        const resPg = Movimiento_vehiculoPg.create(datos).catch(err => {
            console.warn("⚠️ Error al crear movimiento en PG:", err.message);
            return null;
        });
        
        const resMg = Movimiento_vehiculoMg.create(datos).catch(err => {
            console.warn("⚠️ Error al crear movimiento en Mongo:", err.message);
            return null;
        });

        await Promise.all([resPg, resMg]);
        console.log("✅ Movimiento registrado (Cámara).");
    } catch (error) {
        console.error("❌ Error fatal registrando movimiento:", error);
    }
}

const listar_vehiculos = async (req, res) => {
  try {
    const lista = await model.findAll();
    return res.status(200).json({ msg: "Datos de vehiculos", Datos: lista });
  } catch (error) {
    console.error("Error al traer vehiculos", error);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

const listar_vehiculo_id = async (req, res) => {
  let { id } = req.params;
  try {
    const item = await model.findByPk(id);
    if (!item) return res.status(404).json({ msg: "Vehiculo no encontrado por ese id" });
    return res.status(200).json({ msg: "Datos del vehiculo por id", Datos: item });
  } catch (error) {
    console.error("Error al traer vehiculo por id", error);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

const insert_vehiculo = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }

    const placa_imagen = req.file ? `/imagenes/postgres/vehiculo/${req.file.filename}` : "";
    const payload = { ...req.body, placa_imagen };

    const insertado = await model.create(payload);
    return res.status(201).json({ msg: "Datos insertados correctamente", Insercion: insertado });
  } catch (error) {
    console.error("Error al insertar vehiculo", error);
    if (req.file) safeUnlink(req.file.path);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

const insertAndUpd = async(req, res) => {
    if(!req.file){
      console.error("No hay un archivo guardado papuuu");
      return res.status(400).json({msg: "Sin imagen"});
    }

    const rutaImagen = req.file.path;
    const rutaRelativa = `/imagenes/postgres/vehiculo/${req.file.filename}`;

    try {
      // 1. Lectura de placa con Gemini
      const textoPlaca = await gemini.mandarPlaca(rutaImagen);

      if (!textoPlaca || textoPlaca.length < 3) {
            fs.unlinkSync(rutaImagen); 
            
            actualizarEstadoGlobal({
                status: "failed",
                dispositivo: "Camara",
                mensaje: "Placa no legible"
            });
            
            return res.status(400).send("No se pudo leer texto en la imagen.");
      }      
      
      // Limpieza de placa (quitar guiones, espacios, etc.)
      const placaLimpia = textoPlaca.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();

      // 2. Buscar vehículo en BD
      const vehiculo = await model.findOne({ where: { placas: placaLimpia } });

      if(vehiculo){
        console.log(`✅ Vehículo encontrado: ${vehiculo.placas}`);
        
        // 3. BUSCAR ASIGNACIÓN ACTIVA (Permiso de entrada)
        const asignacion = await AsignacionPg.findOne({
            where: {
                id_vehiculo: vehiculo.id_vehiculo,
                fecha_liberacion: null // Debe estar activa
            }
        });

        if (asignacion) {
            // --- CASO ÉXITO TOTAL: Vehículo existe + Tiene asignación ---
            
            // A. Actualizar foto del vehículo
            const respu = await vehiculo.update({ placa_imagen: rutaRelativa });
            
            // B. Registrar Movimiento (Entrada)
            const datosMovimiento = {
                id_vehiculo: vehiculo.id_vehiculo,
                id_asignacion: asignacion.id_asignacion,
                tipo_operacion: "Entrada",
                direccion_vehiculo: "Entrada",
                fecha_hora: new Date(),
                observaciones: `Acceso vía Cámara. Placa: ${placaLimpia}`
            };
            
            // No bloqueamos con await para responder rápido al ESP32, o usamos await si prefieres seguridad
            registrarMovimiento(datosMovimiento); 

            // C. Avisar al ESP32 (Abrir Pluma)
            actualizarEstadoGlobal({
                status: "success",
                dispositivo: "Camara",
                placa_encontrada: true,
                placa: placaLimpia
            }, 'entrada');

            return res.status(200).json({
                msg: "Acceso concedido y movimiento registrado", 
                mensaje: respu
            });

        } else {
            // --- CASO DENEGADO: Vehículo existe pero NO tiene asignación hoy ---
            fs.unlinkSync(rutaImagen); // Borramos la foto porque no entró
            
            console.warn(`⚠️ Vehículo ${placaLimpia} reconocido pero SIN asignación activa.`);

            actualizarEstadoGlobal({
                status: "failed",
                dispositivo: "Camara",
                mensaje: "Vehículo sin asignación activa"
            });

            return res.status(403).json({msg: "Vehículo reconocido pero sin permiso de acceso (asignación)."});
        }

      } else {
        // --- CASO FALLO: Vehículo no existe en BD ---
        fs.unlinkSync(rutaImagen);
        
        actualizarEstadoGlobal({
            status: "failed",
            dispositivo: "Camara",
            mensaje: "Placa no registrada"
        });

        return res.status(404).json({msg: "Placa no encontrada en base de datos"});
      } 

    } catch(error){
      if (fs.existsSync(rutaImagen)) fs.unlinkSync(rutaImagen);
      console.error("Errores pe causa", error);
      
      actualizarEstadoGlobal({
          status: "failed",
          dispositivo: "Camara",
          mensaje: "Error interno"
      });

      return res.status(500).json({msg:"Errores", errores: error.message});
    }
}

const upd_vehiculo = async (req, res) => {
  let { id } = req.params;
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }

    const vehiculo = await model.findByPk(id);
    if (!vehiculo) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(404).json({ msg: "No hay un vehiculo con ese id" });
    }

    const antiguaImagen = vehiculo.imagen;
    if (req.file) req.body.imagen = `/imagenes/postgres/vehiculo/${req.file.filename}`;

    vehiculo.set(req.body);
    const saved = await vehiculo.save();

    if (req.file && antiguaImagen) {
      const viejoPath = path.join(__dirname, '../../public/imagenes/postgres/vehiculo/', antiguaImagen);
      safeUnlink(viejoPath);
    }

    return res.status(200).json({ msg: "Vehiculo actualizado correctamente", Upd: saved });
  } catch (error) {
    console.error("Error al actualizar vehiculo", error);
    if (req.file) safeUnlink(req.file.path);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

const delete_vehiculo = async (req, res) => {
  let { id } = req.params;
  try {
    const vehiculo = await model.findByPk(id);
    if (!vehiculo) return res.status(404).json({ msg: "No hay un vehiculo con ese id" });

    const imagenRuta = vehiculo.imagen;
    await vehiculo.destroy();

    if (imagenRuta) {
      const fullpath = path.join(__dirname, '../../public/imagenes/postgres/vehiculo/', imagenRuta);
      safeUnlink(fullpath);
    }

    return res.status(200).json({ msg: "Vehiculo borrado correctamente" });
  } catch (error) {
    console.error("Error al borrar vehiculo", error);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

module.exports = {
  listar_vehiculos,
  listar_vehiculo_id,
  insert_vehiculo,
  upd_vehiculo,
  delete_vehiculo,
  insertAndUpd
};