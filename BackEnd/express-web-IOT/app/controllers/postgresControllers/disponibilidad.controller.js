// 1. IMPORTAR EL MODELO 'Evento' TAMBIÉN
const Sala = require('../../models/postgresModels/Sala'); 
const Evento = require('../../models/postgresModels/Evento');
const Reserva_evento = require('../../models/postgresModels/Reserva_evento');
const { validationResult } = require('express-validator');
const { Op, Sequelize } = require('sequelize');
const moment = require('moment');

function getHorasApertura(diaSemana){
    if(diaSemana === 0) return 8; 
    if(diaSemana === 6) return 11; 
    return 13; 
}

const duracionTotalEnMinutos = Sequelize.literal(
    `(
        EXTRACT(EPOCH FROM (periodo_end - periodo_start)) / 60 +
        EXTRACT(EPOCH FROM (COALESCE(duracion_montaje, '02:00:00'::INTERVAL))) / 60 +
        EXTRACT(EPOCH FROM (COALESCE(duracion_desmontaje, '02:00:00'::INTERVAL))) / 60
    )`
);

const getResumenMes = async(req,res) => {
    const errores = validationResult(req);
    if(!errores.isEmpty()){
        return res.status(400).json({erorres: errores.array()});
    }

    const {mes , anio} = req.query;
    const diasEnMes = moment(`${anio}-${mes}`, "YYYY-M").daysInMonth();
    let resumen = {};

    try {
        const inicioMes = moment.utc(`${anio}-${mes}-01`).startOf('day');
        const finMes = moment.utc(inicioMes).endOf('month');

        // --- MODIFICACIÓN: FILTRAR SOLO EVENTOS ACEPTADOS ---
        const reservas = await Reserva_evento.findAll({
             attributes: [
                'periodo_start',
                [duracionTotalEnMinutos, 'duracion_total_minutos']
            ],
            include: [{
                model: Evento,
                required: true, // Inner Join
                where: {
                    // Solo contamos eventos que YA están confirmados/aceptados/aprobados
                    estado: { [Op.or]: ['Aceptado', 'Aprobado', 'Confirmado'] }
                },
                attributes: [] // No necesitamos datos del evento, solo filtrar
            }],
            where:{
                periodo_start: {[Op.between]: [inicioMes.toDate(), finMes.toDate()]}
            }
        });

        const horasPorDia = {};
        for (const r of reservas) {
            const dia = moment(r.periodo_start).format("YYYY-MM-DD");
            if (!horasPorDia[dia]) horasPorDia[dia] = 0;
            horasPorDia[dia] += (r.get('duracion_total_minutos') / 60); 
        }

        for(let i = 1; i <= diasEnMes ; i++){
            const fechaActual = moment.utc(`${anio}-${mes}-${i}`, "YYYY-M-D");
            const diaDeSemana = fechaActual.day();
            const horasDisponibles = getHorasApertura(diaDeSemana);
            const fechaISO = fechaActual.format("YYYY-MM-DD");

            const horasOcupadas = horasPorDia[fechaISO] || 0;
            
            if(horasOcupadas >= horasDisponibles) {
                resumen[fechaISO] = 'lleno';
            } else if (horasOcupadas > 0) {
                resumen[fechaISO] = 'parcial';
            } else {
                resumen[fechaISO] = 'disponible';
            }
        }
        
        return res.status(200).json({msg: "resumen del mes obtenido", resumen: resumen});

    } catch (error) {
        console.error("Hubo un error al traer el resumen del mes", error);
        return res.status(500).json({msg: "Error", error: error.message});
    }
}

const getDetalleDia = async(req,res) => {
    const errores = validationResult(req);
    if(!errores.isEmpty()){
        return res.status(400).json({errores: errores.array()});
    }

    const {fecha} =req.query;

    try{
        const inicioDia = moment.utc(fecha).startOf('day');
        const finDia = moment.utc(fecha).endOf('day');

        const salas = await Sala.findAll();

        // --- MODIFICACIÓN: FILTRAR SOLO EVENTOS ACEPTADOS ---
        const reservasDelDia = await Reserva_evento.findAll({
            attributes: [
                'id_sala',
                [Sequelize.literal(`"periodo_start" - COALESCE("duracion_montaje", '02:00:00'::INTERVAL)`), 'inicio_total'],
                [Sequelize.literal(`"periodo_end" + COALESCE("duracion_desmontaje", '02:00:00'::INTERVAL)`), 'fin_total'],
                [duracionTotalEnMinutos, 'duracion_total_minutos']
            ],
            include: [{
                model: Evento,
                required: true,
                where: {
                    estado: { [Op.or]: ['Aceptado', 'Aprobado', 'Confirmado'] }
                },
                attributes: []
            }],
            where: {
                periodo_start: {[Op.between]: [inicioDia.toDate(), finDia.toDate()]}
            }
        });
        
        const resultado = salas.map(sala =>{
            const bloquesOcupados = [];
            let totalMinutosOcupados = 0;
            
            const reservaSala = reservasDelDia.filter(r => r.id_sala === sala.id_sala);
            
            for (const r of reservaSala){
                totalMinutosOcupados += r.get('duracion_total_minutos');
                bloquesOcupados.push({
                    inicio: r.get('inicio_total'),
                    fin: r.get('fin_total')
                });
            }

            let estado = '';
            const diaDeSemana = moment.utc(fecha).day();
            const horasDisponibles = getHorasApertura(diaDeSemana);
            const minutosDisponibles = horasDisponibles * 60;

            if(totalMinutosOcupados === 0){
                estado = 'libre'
            } else if(totalMinutosOcupados >= minutosDisponibles){
                estado = 'lleno'; 
            } else {
                estado = 'parcialmente_ocupado'
            }
            
            return {
                salaId: sala.id_sala,
                nombreSala: sala.nombre_sala,
                capacidad: sala.capacidad,
                estado: estado,
                bloquesOcupados: bloquesOcupados
            };
        });
        
        return res.status(200).json({resultado: resultado});
    } catch(error){
        console.error("Hubo un error al obtener los dias disponibles", error);
        return res.status(500).json({msg: "Errores", error: error.message});
    }
}

module.exports = {
    getResumenMes,
    getDetalleDia
}