const Sala = require('../../models/mongoModels/Sala');
const Reserva_evento = require('../../models/mongoModels/Reserva_evento');
const Evento = require('../../models/mongoModels/Evento'); // Necesario para verificar el estado
const { validationResult } = require('express-validator');
const moment = require('moment');

// --- Helper: Horas de apertura ---
function getHorasApertura(diaSemana) {
    if (diaSemana === 0) return 8; // Domingo
    if (diaSemana === 6) return 11; // Sábado
    return 13; // Lunes a Viernes
}

// --- Helper: Convertir "HH:mm:ss" a Minutos ---
function stringToMinutes(timeString) {
    if (!timeString) return 120; // Default 2 horas
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    return (hours * 60) + minutes + (seconds / 60);
}

// --- HELPER CLAVE: FILTRAR SOLO RESERVAS CONFIRMADAS ---
async function filtrarReservasConfirmadas(reservas) {
    if (!reservas || reservas.length === 0) return [];

    // 1. Obtenemos los IDs de los eventos de estas reservas
    const eventoIds = reservas.map(r => r.id_evento);

    // 2. Buscamos en la colección de Eventos cuáles de estos están realmente "Ocupados"
    // Ignoramos los que están en "Pendiente" o "Rechazado"
    const eventosConfirmados = await Evento.find({
        id_evento: { $in: eventoIds },
        estado: { $in: ['Aceptado', 'Aprobado', 'Confirmado'] }
    }).select('id_evento'); // Solo traemos el ID para optimizar

    // 3. Creamos un Set para búsqueda rápida
    const idsConfirmadosSet = new Set(eventosConfirmados.map(e => e.id_evento));

    // 4. Retornamos solo las reservas que pertenecen a eventos confirmados
    return reservas.filter(r => idsConfirmadosSet.has(r.id_evento));
}

const getResumenMes = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }

    const { mes, anio } = req.query;
    const diasEnMes = moment(`${anio}-${mes}`, "YYYY-M").daysInMonth();
    let resumen = {};

    try {
        const inicioMes = moment.utc(`${anio}-${mes}-01`).startOf('day').toDate();
        const finMes = moment.utc(`${anio}-${mes}-01`).endOf('month').toDate();

        // 1. Traer TODAS las reservas del mes
        const reservasRaw = await Reserva_evento.find({
            periodo_start: { $gte: inicioMes, $lte: finMes }
        });

        // 2. FILTRAR: Quedarnos solo con las confirmadas
        // Las pendientes no contarán como ocupación visual
        const reservas = await filtrarReservasConfirmadas(reservasRaw);

        // 3. Calcular ocupación
        for (let i = 1; i <= diasEnMes; i++) {
            const fechaActual = moment.utc(`${anio}-${mes}-${i}`, "YYYY-M-D");
            const diaDeSemana = fechaActual.day();
            const horasDisponibles = getHorasApertura(diaDeSemana);
            const fechaISO = fechaActual.format("YYYY-MM-DD");

            let minutosOcupadosDia = 0;

            const reservasDelDia = reservas.filter(r => 
                moment(r.periodo_start).isSame(fechaActual, 'day')
            );

            for (const r of reservasDelDia) {
                const durEvento = moment(r.periodo_end).diff(moment(r.periodo_start), 'minutes');
                const durMontaje = stringToMinutes(r.duracion_montaje);
                const durDesmontaje = stringToMinutes(r.duracion_desmontaje);

                minutosOcupadosDia += (durEvento + durMontaje + durDesmontaje);
            }

            const horasOcupadas = minutosOcupadosDia / 60;

            if (horasOcupadas >= horasDisponibles) {
                resumen[fechaISO] = 'lleno';
            } else if (horasOcupadas > 0) {
                resumen[fechaISO] = 'parcial';
            } else {
                resumen[fechaISO] = 'disponible';
            }
        }

        return res.status(200).json({ msg: "Resumen del mes obtenido (Mongo)", resumen: resumen });

    } catch (error) {
        console.error("Error al traer resumen del mes (Mongo)", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const getDetalleDia = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ errores: errores.array() });
    }

    const { fecha } = req.query;

    try {
        const inicioDia = moment.utc(fecha).startOf('day').toDate();
        const finDia = moment.utc(fecha).endOf('day').toDate();

        const salas = await Sala.find(); 
        
        // 1. Traer reservas del día
        const reservasRaw = await Reserva_evento.find({
            periodo_start: { $gte: inicioDia, $lte: finDia }
        });

        // 2. FILTRAR: Solo las confirmadas
        const reservasDelDia = await filtrarReservasConfirmadas(reservasRaw);

        const resultado = salas.map(sala => {
            let totalMinutosOcupados = 0;
            const bloquesOcupados = [];

            const reservasSala = reservasDelDia.filter(r => r.id_sala === sala.id_sala);

            for (const r of reservasSala) {
                const minutosMontaje = stringToMinutes(r.duracion_montaje);
                const minutosDesmontaje = stringToMinutes(r.duracion_desmontaje);

                const inicioTotal = moment(r.periodo_start).subtract(minutosMontaje, 'minutes');
                const finTotal = moment(r.periodo_end).add(minutosDesmontaje, 'minutes');

                totalMinutosOcupados += finTotal.diff(inicioTotal, 'minutes');

                bloquesOcupados.push({
                    inicio: inicioTotal.toISOString(),
                    fin: finTotal.toISOString()
                });
            }

            let estado = '';
            const diaDeSemana = moment.utc(fecha).day();
            const horasDisponibles = getHorasApertura(diaDeSemana);
            const minutosDisponibles = horasDisponibles * 60;

            if (totalMinutosOcupados === 0) {
                estado = 'libre';
            } else if (totalMinutosOcupados >= minutosDisponibles) {
                estado = 'lleno';
            } else {
                estado = 'parcialmente_ocupado';
            }

            return {
                salaId: sala.id_sala,
                nombreSala: sala.nombre_sala,
                capacidad: sala.capacidad,
                estado: estado,
                bloquesOcupados: bloquesOcupados
            };
        });

        return res.status(200).json({ resultado: resultado });

    } catch (error) {
        console.error("Error al obtener detalle del día (Mongo)", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

module.exports = {
    getResumenMes,
    getDetalleDia
}