const { json } = require('sequelize');
const Evento = require('../../models/postgresModels/Evento');
const EventoMg = require('../../models/mongoModels/Evento'); // <--- NUEVO: Importar modelo Mongo
const Movimiento_vehiculoPg = require('../../models/postgresModels/Movimiento_vehiculo');
const Movimiento_vehiculoMg = require('../../models/mongoModels/Movimiento_vehiculo');
const AsignacionPg = require('../../models/postgresModels/Asignacion_espacio');
const AsignacionMg = require('../../models/mongoModels/Asignacion_espacio'); 
const EspacioModel = require('../../models/postgresModels/Espacio_estacionamiento');
const Vehiculo = require('../../models/postgresModels/Vehiculo');
const axios = require('axios');

let ultimo_mensaje = {};
let ultimo_mensajeSalida = {};

const actualizarEstadoGlobal = (datos, movimiento) => {
    console.log(">>> Actualizando estado desde otro controlador:", datos);
    if(movimiento == 'salida'){
    ultimo_mensajeSalida = datos;
    } else if (movimiento == 'entrada'){
        ultimo_mensaje = datos;
    }
    
};

const liberar_espacio = async(req, res) => {
    const { folio } = req.body; 
    
    console.log(`>>> Solicitud de Salida para Folio: ${folio}`);

    if (!folio) {
        return res.status(400).json({ msg: "Folio requerido" });
    }

    try {
        // 1. Buscar el Evento por Folio
        const evento = await Evento.findOne({ where: { folio_evento: folio } });
        
        if (!evento) {
            return res.status(404).json({ msg: "Evento no encontrado con ese folio" });
        }

        console.log(`✅ Evento encontrado: ${evento.nombre_evento} (ID: ${evento.id_evento})`);

        // 2. Buscar la Asignación ACTIVA más ANTIGUA (FIFO) DIRECTAMENTE por id_evento
        // Aprovechamos la llave foránea id_evento en la tabla de asignaciones
        const asignacionVieja = await AsignacionPg.findOne({
            where: {
                id_evento: evento.id_evento, // Búsqueda directa y eficiente
                fecha_liberacion: null       // Que siga dentro
            },
            order: [['fecha_asignacion', 'ASC']] // El que llegó primero sale primero
        });

        if (!asignacionVieja) {
            console.warn("⚠️ No hay vehículos de este evento estacionados actualmente.");
            
            actualizarEstadoGlobal({
                status: "failed",
                dispositivo: "Escaner",
                mensaje: "No hay vehículos dentro"
            });
            
            return res.status(404).json({ msg: "No hay vehículos dentro para este evento" });
        }

        console.log(`🚗 Liberando Vehículo ID ${asignacionVieja.id_vehiculo} del Espacio ${asignacionVieja.id_espacio}`);

        // 3. PROCEDER A LIBERAR
        const fechaSalida = new Date();

        // A. Actualizar Asignación (Cerrar fecha)
        await asignacionVieja.update({
            fecha_liberacion: fechaSalida,
            observaciones: `Salida por QR (Folio: ${folio})`
        });

        // B. Liberar el Espacio Físico (Poner en true)
        if (asignacionVieja.id_espacio) {
            await EspacioModel.update(
                { estado_disponible: true },
                { where: { id_espacio: asignacionVieja.id_espacio } }
            );
        }

        // C. Registrar Movimiento de Salida
        const datosMovimiento = {
            id_vehiculo: asignacionVieja.id_vehiculo,
            id_asignacion: asignacionVieja.id_asignacion,
            tipo_operacion: "Salida",
            direccion_vehiculo: "Salida",
            fecha_hora: fechaSalida,
            observaciones: `Salida completada. Evento: ${evento.nombre_evento}`
        };
        
        registrarMovimiento(datosMovimiento); 

        // D. Avisar al ESP32 para abrir la pluma
        actualizarEstadoGlobal({
            status: "success",
            dispositivo: "Escaner", 
            mensaje: "Salida autorizada",
            tipo: "Salida"
        }, 'salida');

        return res.status(200).json({ 
            msg: "Salida autorizada y espacio liberado", 
            vehiculo: asignacionVieja.id_vehiculo 
        });

    } catch (error) {
        console.error("Errores en liberacion:", error);
        return res.status(500).json({msg:"Errores", error: error.message});
    }
};

// Helper para registrar el movimiento en ambas BD (con tolerancia a fallos)
const registrarMovimiento = async (datos) => {
    try {
        console.log("📝 Registrando movimiento para Vehículo ID:", datos.id_vehiculo);
        
        // Intentamos crear en Postgres
        const resPg = Movimiento_vehiculoPg.create(datos).catch(err => {
            console.error("⚠️ Error al crear movimiento en Postgres:", err.message);
            return null;
        });
        
        // Intentamos crear en Mongo
        const resMg = Movimiento_vehiculoMg.create(datos).catch(err => {
            console.error("⚠️ Error al crear movimiento en Mongo:", err.message);
            return null;
        });

        await Promise.all([resPg, resMg]);
        console.log("✅ Movimiento registrado (intentado en ambas bases).");
    } catch (error) {
        console.error("❌ Error fatal en registrarMovimiento:", error);
    }
}

const mandarAccion = async (req, res) => {
    const acciones = req.body;
    
    try {
        // ==========================================
        // CASO 1: ESCÁNER (QR) -> EVENTO -> ASIGNACIÓN -> VEHÍCULO
        // ==========================================
        if (acciones.dispositivo == "Escaner") {
            let qr = acciones.codigo;
            const datosDelQR = acciones.codigo; // Objeto original para sacar fechas si existen

            // Normalizar QR a string para búsqueda exacta en BD
            if (typeof qr === 'object') {
                qr = JSON.stringify(qr);
            }

            console.log(`🔍 Buscando QR en BD Eventos...`);
            
            // 1. Buscar el Evento por el código QR literal (Postgres)
            let respuestaBase = await Evento.findOne({ where: { qr_evento: qr } });
            let origenEvento = "Postgres";

            // 1.1 FALLBACK: Si no está en PG, buscar en Mongo
            if (!respuestaBase) {
                console.log("⚠️ QR no encontrado en Postgres, intentando Mongo...");
                try {
                    // En Mongoose la sintaxis es directa { campo: valor }
                    respuestaBase = await EventoMg.findOne({ qr_evento: qr });
                    if (respuestaBase) origenEvento = "Mongo";
                } catch (errMg) {
                    console.error("❌ Error buscando evento en Mongo:", errMg.message);
                }
            }
            
            if (respuestaBase) {
                console.log(`✅ Evento encontrado en ${origenEvento}:`, respuestaBase.nombre_evento);
                const idEven = respuestaBase.id_evento;
                let asignacionEncontrada = null;
                let origenAsignacion = "";

                // 2. Buscar ASIGNACIÓN ACTIVA (Postgres Primero)
                // Activa = fecha_liberacion es null
                try {
                    asignacionEncontrada = await AsignacionPg.findOne({
                        where: {
                            id_evento: idEven,
                            fecha_liberacion: null 
                        }
                    });
                    if (asignacionEncontrada) origenAsignacion = "Postgres";
                } catch (errPg) {
                    console.warn("⚠️ Fallo lectura Asignación PG, intentando Mongo...");
                }

                // 3. Fallback a Mongo si no se encontró en PG
                if (!asignacionEncontrada) {
                    console.log("🔍 Buscando asignación en Mongo (Fallback)...");
                    try {
                        // Sintaxis Mongoose: { campo: valor, campo2: valor }
                        asignacionEncontrada = await AsignacionMg.findOne({
                            id_evento: idEven,
                            fecha_liberacion: null // Ojo: En mongo a veces es null o undefined
                        });
                        if (asignacionEncontrada) origenAsignacion = "Mongo";
                    } catch (errMg) {
                        console.error("❌ Error buscando asignación en Mongo:", errMg.message);
                    }
                }

                // 4. Validar si encontramos vehículo
                if (asignacionEncontrada) {
                    console.log(`✅ Asignación activa encontrada en ${origenAsignacion}. Vehículo ID: ${asignacionEncontrada.id_vehiculo}`);

                    // Actualizar variable global para el ESP32
                    actualizarEstadoGlobal({
                        status: "success",
                        dispositivo: "Escaner",
                        periodo_start: datosDelQR.inicio || "",
                        periodo_end: datosDelQR.fin || "",
                        folio: datosDelQR.folio || respuestaBase.folio_evento
                    }, 'entrada');

                    // 5. REGISTRAR EL MOVIMIENTO (Entrada)
                    // Aquí ya tenemos el id_vehiculo gracias a la asignación
                    const datosMovimiento = {
                        id_vehiculo: asignacionEncontrada.id_vehiculo,
                        tipo_operacion: "Entrada", // O "Acceso"
                        direccion_vehiculo: "Entrada",
                        fecha_hora: new Date(),
                        observaciones: `Acceso vía QR. Evento: ${respuestaBase.nombre_evento}`
                    };

                    // No usamos await para no bloquear la respuesta al ESP32 (velocidad)
                    registrarMovimiento(datosMovimiento);

                    return res.status(200).json({ mensaje: "Codigo encontrado y acceso concedido" });

                } else {
                    // QR válido de evento, pero el vehículo ya salió o no tiene asignación
                    console.warn("⚠️ Evento válido, pero SIN asignación activa (vehículo no asignado o ya salió).");
                    
                    ultimo_mensaje = {
                        status: "failed",
                        dispositivo: "Escaner",
                        mensaje: "Sin asignación activa"
                    };
                    
                    return res.status(403).json({ mensaje: "Evento sin vehiculo activo asignado" });
                }

            } else {
                console.warn("❌ QR no existe en ninguna BD.");
                ultimo_mensaje = {
                    status: "failed",
                    dispositivo: "Escaner",
                    mensaje: "Codigo qr no encontrado"
                };
                return res.status(404).json({ mensaje: "Codigo qr no encontrado" });
            }
        }    
        
        // ==========================================
        // CASO 2: CÁMARA
        // ==========================================
        if (acciones.dispositivo === "Camara") {
            if (acciones.status === "success") {
                actualizarEstadoGlobal({
                    status: "success",
                    dispositivo: "Camara",
                    placa_encontrada: true
                }, 'entrada');
                // Nota: El registro de movimiento de cámara suele hacerse en el controlador de vehiculo
                // cuando Gemini confirma, así que aquí solo pasamos el mensaje.
            } else {
                ultimo_mensaje = {
                    status: "failed",
                    dispositivo: "Camara",
                    mensaje: "La placa no se encontro o fallo la api"
                };
            }
            return res.status(200).json({ msg: "Procesado cámara" });
        }
        
        return res.status(400).json({ msg: "Dispositivo desconocido" });

    } catch (error) {
        console.error("Errores generales en mandarAccion:", error);
        return res.status(500).json({ msg: "Errores", error: error.message });
    }
};

const obtenerUltimaAccionEntrada = (req, res) => {
    try {
        if (!ultimo_mensaje || Object.keys(ultimo_mensaje).length === 0) {
            // Respuesta por defecto para polling (sin cambios)
            return res.status(200).json({
                status: "Esperando...",
                mensaje: "Estamos esperando alguna accion"
            });
        }

        let mensajeEnviado = { ...ultimo_mensaje };
        ultimo_mensaje = {}; // Limpiar tras enviar

        return res.status(200).json(mensajeEnviado);
    } catch (error) {
        console.error("Errores causa", error);
        return res.status(500).json({ msg: "Errores", error: error.message });
    }
};

const obtenerUltimaActualizacionSalida = (req,res) =>{
        try {
        if (!ultimo_mensajeSalida || Object.keys(ultimo_mensajeSalida).length === 0) {
            // Respuesta por defecto para polling (sin cambios)
            return res.status(200).json({
                status: "Esperando...",
                mensaje: "Estamos esperando alguna accion"
            });
        }

        let mensajeEnviadoSalida = { ...ultimo_mensajeSalida };
        ultimo_mensajeSalida = {}; // Limpiar tras enviar

        return res.status(200).json(mensajeEnviadoSalida);
    } catch (error) {
        console.error("Errores causa", error);
        return res.status(500).json({ msg: "Errores", error: error.message });
    }
}

const ESP32_IP_ENTRADA = 'http://192.168.100.35'; // Ajusta esta IP
const ESP32_IP_SALIDA  = 'http://192.168.100.21'; // Ajusta esta IP

const moverServoNgrok = async (req, res) => {
    const { comando, direccion } = req.body;

    if (!comando || !direccion) {
        return res.status(400).json({ success: false, message: "Faltan parámetros." });
    }

    let angulo = 0;
    let targetIP = "";

    // 1. Lógica de Ángulos y Selección de IP
    if (direccion === "Entrada") {
        targetIP = ESP32_IP_ENTRADA;
        // Ángulos específicos de ENTRADA
        if (comando.includes("Arriba")) angulo = 55;
        else if (comando.includes("Abajo")) angulo = 140;
    } 
    else if (direccion === "Salida") {
        targetIP = ESP32_IP_SALIDA;
        // Ángulos específicos de SALIDA
        if (comando.includes("Arriba")) angulo = 90;
        else if (comando.includes("Abajo")) angulo = 180;
    }

    if (targetIP === "" || angulo === 0) {
        return res.status(400).json({ success: false, message: "Dirección o comando inválido" });
    }

    console.log(`[Manual] ${direccion}: ${comando} -> Enviando ${angulo}° a ${targetIP}`);

    try {
        // Enviamos el ángulo calculado. El ESP32 solo obedece el número.
        const respuestaESP = await axios.get(`${targetIP}/esp32/servo`, {
            params: { val: angulo }, 
            timeout: 5000 
        });

        return res.status(200).json({
            success: true,
            message: `Acción en ${direccion} ejecutada.`,
            esp_response: respuestaESP.data
        });

    } catch (error) {
        console.error("Error contactando al ESP32:", error.message);
        return res.status(500).json({ success: false, message: "Error de conexión con el ESP32" });
    }
}


// Función placeholder para rutas si la necesitas

module.exports = {
    mandarAccion,
    obtenerUltimaAccionEntrada,
    actualizarEstadoGlobal,
    liberar_espacio,
    obtenerUltimaActualizacionSalida,
    moverServoNgrok
};