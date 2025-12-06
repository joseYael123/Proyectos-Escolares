const model = require('../../models/mongoModels/Reserva_evento');
const { validationResult } = require('express-validator');
const moment = require('moment');
const Evento = require('../../models/mongoModels/Evento');
// --- Helpers ---

function stringToMinutes(timeString) {
    if (!timeString) return 120; // Default 2 horas
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return (hours * 60) + minutes + (seconds / 60);
}

const checkOverlap = async (id_sala, start, end, montaje, desmontaje, excludeId = null) => {
    // 1. Calcular tiempos absolutos de la NUEVA solicitud
    const montMin = stringToMinutes(montaje);
    const desmontMin = stringToMinutes(desmontaje);
    const newAbsStart = moment(start).subtract(montMin, 'minutes');
    const newAbsEnd = moment(end).add(desmontMin, 'minutes');

    // 2. Buscar candidatos que solapen en tiempo Y que pertenezcan a eventos ACEPTADOS
    // Esto requiere un "lookup" manual o traer los datos y filtrar en JS.
    // Haremos la estrategia de filtrar en JS para no complicar la query.
    
    const candidatos = await model.find({
        id_sala: id_sala,
        periodo_start: { $lt: newAbsEnd.toDate() },
        periodo_end: { $gt: newAbsStart.toDate() },
        ...(excludeId && { id_reserva: { $ne: excludeId } })
    });

    for (const r of candidatos) {
        // 3. BUSCAR EL ESTADO DEL EVENTO PADRE
        const eventoPadre = await Evento.findOne({ id_evento: r.id_evento });
        
        // Si el evento padre NO está Aceptado/Aprobado, lo ignoramos (es otra solicitud pendiente)
        if (!eventoPadre || (eventoPadre.estado !== 'Aceptado' && eventoPadre.estado !== 'Aprobado')) {
            continue; // Saltamos al siguiente, no es conflicto real todavía
        }

        // Si el evento SÍ está aceptado, verificamos colisión fina
        const rMont = stringToMinutes(r.duracion_montaje);
        const rDesmont = stringToMinutes(r.duracion_desmontaje);
        const rAbsStart = moment(r.periodo_start).subtract(rMont, 'minutes');
        const rAbsEnd = moment(r.periodo_end).add(rDesmont, 'minutes');

        if (newAbsStart.isBefore(rAbsEnd) && newAbsEnd.isAfter(rAbsStart)) {
            return r; // Conflicto real con un evento ya confirmado
        }
    }
    
    return null; // No hay conflictos con eventos confirmados
};

// --- Controladores ---

const listar_reservas = async (req, res) => {
    try {
        const lista = await model.find();
        return res.status(200).json({ msg: "Datos de reservas", Datos: lista });
    } catch (error) {
        console.error("Error al traer reservas", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const listar_reserva_id = async (req, res) => {
    let { id } = req.params;
    try {
        const item = await model.findOne({ id_reserva: id });
        if (!item) {
            return res.status(404).json({ msg: "Reserva no encontrada por ese id" });
        }
        return res.status(200).json({ msg: "Datos de la reserva por id", Datos: item });
    } catch (error) {
        console.error("Error al traer reserva por id", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const insert_reserva = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errors: errores.array() });
    }

    const { id_sala, periodo_start, periodo_end, duracion_montaje, duracion_desmontaje } = req.body;

    try {
        // 1. Verificar conflictos
        const conflicto = await checkOverlap(id_sala, periodo_start, periodo_end, duracion_montaje, duracion_desmontaje);
        
        if (conflicto) {
            return res.status(409).json({ 
                msg: "Conflicto de horario", 
                error: "La sala ya está reservada en ese rango (incluyendo tiempos de montaje).",
                reservaEnConflicto: conflicto
            });
        }

        // 2. Insertar
        const insertado = await model.create(req.body);
        return res.status(201).json({ msg: "Datos insertados correctamente", Insercion: insertado });
    } catch (error) {
        console.error("Error al insertar reserva", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: "Error de validación", error: error.message });
        }
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const upd_reserva = async (req, res) => {
    let { id } = req.params;
    
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errors: errores.array() });
    }

    try {
        // 1. Obtener datos actuales para completar lo que falte en el body
        const reservaActual = await model.findOne({ id_reserva: id });
        if (!reservaActual) {
            return res.status(404).json({ msg: "No hay una reserva con ese id" });
        }

        const salaFinal = req.body.id_sala || reservaActual.id_sala;
        const startFinal = req.body.periodo_start || reservaActual.periodo_start;
        const endFinal = req.body.periodo_end || reservaActual.periodo_end;
        const montFinal = req.body.duracion_montaje || reservaActual.duracion_montaje;
        const desmontFinal = req.body.duracion_desmontaje || reservaActual.duracion_desmontaje;

        // 2. Verificar conflictos (excluyendo la reserva actual con 'id')
        const conflicto = await checkOverlap(salaFinal, startFinal, endFinal, montFinal, desmontFinal, id);

        if (conflicto) {
            return res.status(409).json({ 
                msg: "Conflicto al actualizar", 
                error: "El nuevo horario choca con otra reserva existente.",
                reservaEnConflicto: conflicto
            });
        }

        // 3. Actualizar
        const actualizado = await model.findOneAndUpdate(
            { id_reserva: id }, 
            req.body, 
            { new: true }
        );

        return res.status(200).json({ msg: "Reserva actualizada correctamente", Upd: actualizado });

    } catch (error) {
        console.error("Error al actualizar reserva", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: "Error de validación", error: error.message });
        }
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const delete_reserva = async (req, res) => {
    let { id } = req.params;
    try {
        const borrado = await model.findOneAndDelete({ id_reserva: id });
        if (!borrado) {
            return res.status(404).json({ msg: "No hay una reserva con ese id" });
        }
        return res.status(200).json({ msg: "Reserva borrada correctamente", Deleted: borrado });
    } catch (error) {
        console.error("Error al borrar reserva", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const buscar_eventos_fecha = async (req, res) => {
    const { fecha } = req.params; // Formato "YYYY-MM-DD"

    console.log("Buscando reservas para la fecha:", fecha);

    try {
        // 1. Construir el rango de búsqueda (Inicio y Fin del día)
        // MongoDB guarda en UTC, así que aseguramos buscar desde las 00:00:00 hasta las 23:59:59
        const start = new Date(fecha);
        start.setUTCHours(0, 0, 0, 0);
        
        const end = new Date(fecha);
        end.setUTCHours(23, 59, 59, 999);

        // 2. PASO CLAVE: Buscar primero en 'Reserva_evento'
        // Aquí es donde existe el campo 'periodo_start'
        const reservasEncontradas = await model.find({
            periodo_start: {
                $gte: start,
                $lte: end
            }
        });

        if (!reservasEncontradas || reservasEncontradas.length === 0) {
            return res.status(200).json({ msg: "No hay eventos programados para esta fecha", Datos: [] });
        }

        // 3. Con las reservas en mano, buscamos la info del Evento para cada una
        const listaCompleta = await Promise.all(reservasEncontradas.map(async (reserva) => {
            
            // Usamos el id_evento que viene dentro de la reserva que encontramos
            const evento = await Evento.findOne({ id_evento: reserva.id_evento });
            
            // Si por error de integridad no existe el evento, retornamos null (lo filtraremos luego)
            if (!evento) return null;

            return {
                evento: {
                    nombre_evento: evento.nombre_evento,
                    descripcion: evento.descripcion,
                    folio_evento: evento.folio_evento,
                    categoria_evento: evento.categoria_evento,
                    tipo_de_admision: evento.tipo_de_admision,
                    id_evento: evento.id_evento,
                    estado: evento.estado,
                    qr_imagen: evento.qr_imagen
                }
            };
        }));

        // Filtramos nulos por si hubo algún evento borrado con reserva huérfana
        const datosFinales = listaCompleta.filter(item => item !== null);

        console.log(`Encontrados ${datosFinales.length} eventos.`);
        return res.status(200).json({ msg: "Eventos encontrados", Datos: datosFinales });

    } catch (error) {
        console.error("Error buscando por fecha:", error);
        return res.status(500).json({ msg: "Error en el servidor", error: error.message });
    }
};


module.exports = {
    listar_reservas, listar_reserva_id, insert_reserva, upd_reserva, delete_reserva, buscar_eventos_fecha
}