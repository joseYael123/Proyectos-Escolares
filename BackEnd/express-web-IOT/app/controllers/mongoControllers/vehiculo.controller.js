const model = require('../../models/mongoModels/Vehiculo');
const { validationResult } = require('express-validator');
const Movimiento_vehiculoMg = require('../../models/mongoModels/Movimiento_vehiculo');
const Movimiento_vehiculoPg = require('../../models/postgresModels/Movimiento_vehiculo');
// Asegúrate de que la ruta al servicio sea correcta
const gemini = require('../../../services/geminiApi'); 
const fs = require('fs');
const path = require('path');

// --- Helper para borrar imágenes ---
function borrarImagen(rutaArchivo) {
    // Ajusta los '..' según la estructura de tu proyecto para llegar a 'public'
    const fullPath = path.join(__dirname, '../../../public', rutaArchivo);
    try {
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Imagen borrada: ${fullPath}`);
        }
    } catch (err) {
        console.error('Error borrando archivo:', fullPath, err);
    }
}

// --- Helper: Registrar Movimiento (Mongo Obligatorio, Postgres Opcional) ---
const registrarMovimientoResiliente = async (datos) => {
    // 1. SIEMPRE registrar en Mongo (Es la base de este controlador)
    try {
        await Movimiento_vehiculoMg.create(datos);
        console.log("✅ Movimiento registrado en MongoDB.");
    } catch (err) {
        console.error("❌ Error crítico: No se pudo registrar movimiento en Mongo:", err.message);
        // Aquí no detenemos el flujo porque queremos que abra la pluma, 
        // pero es un error grave si falla la DB principal.
    }

    // 2. INTENTAR registrar en Postgres (Si falla, se omite)
    try {
        // Clonamos datos o ajustamos si los nombres de campos difieren entre SQL y NoSQL
        await Movimiento_vehiculoPg.create(datos);
        console.log("✅ Sincronización exitosa con Postgres.");
    } catch (err) {
        // NO lanzamos error, solo avisamos en consola. El usuario no se entera.
        console.warn(`⚠️ Postgres no disponible. Se omitió el registro en PG. Error: ${err.message}`);
    }
}

const listar_vehiculos = async (req, res) => {
    try {
        const lista = await model.find();
        return res.status(200).json({ msg: "Datos de vehiculos", Datos: lista });
    } catch (error) {
        console.error("Error al traer vehiculos", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const listar_vehiculo_id = async (req, res) => {
    let { id } = req.params;
    try {
        const item = await model.findOne({ id_vehiculo: id });
        if (!item) {
            return res.status(404).json({ msg: "Vehiculo no encontrado por ese id" });
        }
        return res.status(200).json({ msg: "Datos del vehiculo por id", Datos: item });
    } catch (error) {
        console.error("Error al traer vehiculo por id", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const insert_vehiculo = async (req, res) => {
    // Validaciones de express-validator
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        if (req.file) borrarImagen(req.file.path); // Limpieza si falla validación
        return res.status(400).json({ errors: errores.array() });
    }

    try {
        // Generar ruta relativa para guardar en BD
        // Si viene de /web (multer) o /placa (mocked file), req.file existe
        const imagenRoute = req.file ? `/imagenes/mongo/vehiculo/${req.file.filename}` : null;
    
        const payload = {
            ...req.body,
            placa_imagen: imagenRoute
        };

        const insertado = await model.create(payload);
        return res.status(201).json({ msg: "Vehículo insertado correctamente", Insercion: insertado });
    } catch (error) {
        if (req.file) {
            // Nota: req.file.path suele ser ruta absoluta, borrarImagen espera relativa a public? 
            // No, mi helper borrarImagen toma "rutaArchivo" y le pega __dirname/../../public.
            // PERO req.file.path de Multer es absoluta. 
            // Ajuste rápido: borrar directamente usando fs.unlink con ruta absoluta.
            try { fs.unlinkSync(req.file.path); } catch(e){}
        }
        console.error("Error al insertar vehiculo", error);
        return res.status(500).json({ msg: "Error interno", error: error.message });
    }
}

const updYinsert = async (req, res) => {
    // 1. Validación de archivo
    if (!req.file) {
        return res.status(400).json({ msg: "Sin imagen" });
    }

    const rutaAbsoluta = req.file.path; 
    const rutaRelativa = `/imagenes/mongo/vehiculo/${req.file.filename}`;

    try {
        // 2. Procesar con Gemini
        console.log(">>> [Mongo Controller] Procesando imagen...");
        const textoPlaca = await gemini.mandarPlaca(rutaAbsoluta);

        if (!textoPlaca || textoPlaca.length < 3 || textoPlaca === 'null') {
            safeUnlink(rutaAbsoluta);
            actualizarEstadoGlobal({ status: "failed", dispositivo: "Camara", mensaje: "Placa no legible" });
            return res.status(400).json({ msg: "No se detectó una placa válida." });
        }

        const placaLimpia = textoPlaca.replace(/[^a-zA-Z0-9]/g, '').trim().toUpperCase();
        console.log(`>>> Placa detectada: ${placaLimpia}`);

        // 3. Buscar en MongoDB (Fuente de verdad actual)
        const vehiculo = await model.findOne({ 
            placas: { $regex: new RegExp(`^${placaLimpia}$`, 'i') } 
        });

        if (vehiculo) {
            // 4. Verificar Asignación en MongoDB
            const asignacion = await AsignacionModel.findOne({
                id_vehiculo: vehiculo.id_vehiculo,
                fecha_liberacion: null 
            });

            if (asignacion) {
                // --- ACCESO CONCEDIDO ---

                // A. Actualizar imagen en MONGO (Obligatorio)
                if (vehiculo.placa_imagen) {
                    safeUnlink(path.join(__dirname, '../../../public', vehiculo.placa_imagen));
                }
                const vehiculoActualizado = await model.findOneAndUpdate(
                    { _id: vehiculo._id },
                    { placa_imagen: rutaRelativa },
                    { new: true }
                );

                // B. INTENTAR Actualizar imagen en POSTGRES (Opcional - "Fire and Forget")
                // No usamos await bloqueante o usamos un try/catch específico
                (async () => {
                    try {
                        const vehiculoPg = await VehiculoPg.findOne({ where: { placas: placaLimpia } });
                        if (vehiculoPg) {
                            await vehiculoPg.update({ placa_imagen: rutaRelativa });
                            console.log("✅ Imagen actualizada en Postgres también.");
                        }
                    } catch (pgError) {
                        console.warn("⚠️ No se pudo actualizar la imagen en Postgres (Omite operación).");
                    }
                })();

                // C. Registrar Movimiento (Usando el helper resiliente)
                const datosMovimiento = {
                    id_vehiculo: vehiculo.id_vehiculo,
                    id_asignacion: asignacion.id_asignacion,
                    tipo_operacion: "Entrada",
                    direccion_vehiculo: "Entrada",
                    fecha_hora: new Date(),
                    observaciones: `Acceso concedido (Mongo). Placa: ${placaLimpia}`
                };
                
                // No usamos await aquí para responder rápido al front/esp32
                registrarMovimientoResiliente(datosMovimiento);

                // D. Comandar ESP32
                actualizarEstadoGlobal({
                    status: "success",
                    dispositivo: "Camara",
                    placa_encontrada: true,
                    placa: placaLimpia
                });

                return res.status(200).json({ 
                    msg: "Acceso concedido", 
                    vehiculo: vehiculoActualizado 
                });

            } else {
                // --- DENEGADO: Sin asignación ---
                safeUnlink(rutaAbsoluta);
                actualizarEstadoGlobal({ status: "failed", dispositivo: "Camara", mensaje: "Sin asignación activa" });
                return res.status(403).json({ msg: "Vehículo sin permiso de acceso." });
            }
        } else {
            // --- ERROR: No existe vehículo ---
            safeUnlink(rutaAbsoluta);
            actualizarEstadoGlobal({ status: "failed", dispositivo: "Camara", mensaje: "Placa no registrada" });
            return res.status(404).json({ msg: "Placa no encontrada en BD." });
        }

    } catch (error) {
        safeUnlink(rutaAbsoluta);
        console.error("Error crítico insertAndUpd:", error);
        actualizarEstadoGlobal({ status: "failed", dispositivo: "Camara", mensaje: "Error interno" });
        return res.status(500).json({ msg: "Error interno", error: error.message });
    }
}

const upd_vehiculo = async (req, res) => {
    let { id } = req.params;
    
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        if (req.file) try { fs.unlinkSync(req.file.path); } catch(e){}
        return res.status(400).json({ errors: errores.array() });
    }

    try {
        const vehiculoActual = await model.findOne({ id_vehiculo: id });
        if (!vehiculoActual) {
            if (req.file) try { fs.unlinkSync(req.file.path); } catch(e){}
            return res.status(404).json({ msg: "No hay un vehiculo con ese id" });
        }
        
        const imagenAntigua = vehiculoActual.placa_imagen;
        const datosActualizar = { ...req.body };

        if (req.file) {
            datosActualizar.placa_imagen = `/imagenes/mongo/vehiculo/${req.file.filename}`;
        }

        const actualizado = await model.findOneAndUpdate(
            { id_vehiculo: id },
            datosActualizar,
            { new: true }
        );

        // Borrar imagen antigua si se reemplazó correctamente
        if (req.file && imagenAntigua) {
            borrarImagen(imagenAntigua);
        }

        return res.status(200).json({ msg: "Vehiculo actualizado correctamente", Upd: actualizado });
    } catch (error) {
        if (req.file) try { fs.unlinkSync(req.file.path); } catch(e){}
        console.error("Error al actualizar vehiculo", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const delete_vehiculo = async (req, res) => {
    let { id } = req.params;
    try {
        const borrado = await model.findOneAndDelete({ id_vehiculo: id });
        if (!borrado) {
            return res.status(404).json({ msg: "No hay un vehiculo con ese id" });
        }

        if (borrado.placa_imagen) {
            borrarImagen(borrado.placa_imagen);
        }

        return res.status(200).json({ msg: "Vehiculo borrado correctamente", Deleted: borrado });
    } catch (error) {
        console.error("Error al borrar vehiculo", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

module.exports = {
    listar_vehiculos, 
    listar_vehiculo_id, 
    insert_vehiculo, 
    upd_vehiculo, 
    delete_vehiculo, 
    updYinsert
}