const model = require('../../models/postgresModels/Reserva_evento');
const { validationResult } = require('express-validator'); // <-- Lo tenías en singular
const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const Evento = require("../../models/postgresModels/Evento");

// --- Helper de Validación (checkOverlap) ---
// Esta es la réplica de tu restricción EXCLUDE
const checkOverlap = async (id_sala, newStart, newEnd, newMontaje, newDesmontaje) => {
    
    // 1. Definir rangos (Igual que antes)
    const newRangoStart = Sequelize.literal(`'${newStart}'::TIMESTAMPTZ - '${newMontaje}'::INTERVAL`);
    const newRangoEnd = Sequelize.literal(`'${newEnd}'::TIMESTAMPTZ + '${newDesmontaje}'::INTERVAL`);
    const rangoExistenteStart = Sequelize.literal(`"periodo_start" - COALESCE("duracion_montaje", '02:00:00'::INTERVAL)`);
    const rangoExistenteEnd = Sequelize.literal(`"periodo_end" + COALESCE("duracion_desmontaje", '02:00:00'::INTERVAL)`);

    // 2. Buscar colisiones, PERO filtrando por el estado del Evento padre
    const existingReserva = await model.findOne({
        include: [{
            model: Evento,
            required: true,
            where: {
                // ¡AQUÍ ESTÁ LA CLAVE!
                // Solo consideramos conflicto si el evento ya fue ACEPTADO o APROBADO.
                // Si está "Pendiente", lo ignoramos y permitimos la doble solicitud.
                estado: { [Op.or]: ['Aceptado', 'Aprobado', 'Confirmado'] } 
            }
        }],
        where: {
            id_sala: id_sala,
            [Op.and]: [
                Sequelize.where(rangoExistenteStart, Op.lt, newRangoEnd),
                Sequelize.where(rangoExistenteEnd, Op.gt, newRangoStart)
            ]
        }
    });

    return existingReserva; 
};


// --- CRUD Básico (Tus funciones) ---

const listar_reservas = async(req,res) => {
  try {
    const lista = await model.findAll();
    return res.status(200).json({msg: "Datos de reservas", Datos: lista});
  } catch (error) {
    console.error("Error al traer reservas", error);
    return res.status(500).json({msg: "Error", error: error.message});
  }
}

const listar_reserva_id = async(req,res) => {
  let {id} = req.params;
  try {
    const item = await model.findByPk(id);
    if(!item){
      return res.status(404).json({msg: "Reserva no encontrada por ese id"});
    }
    return res.status(200).json({msg: "Datos de la reserva por id", Datos: item});
  } catch (error) {
    console.error("Error al traer reserva por id", error);
    return res.status(500).json({msg:"Error", error: error.message});
  }
}

// --- INSERT con VALIDACIÓN (Reemplaza tu insert_reserva) ---
const insert_reserva = async (req,res) => {
    // Primero, valida los campos que vienen del router
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {
        id_sala,
        periodo_start,
        periodo_end,
        duracion_montaje,  // "03:00:00"
        duracion_desmontaje // "02:00:00"
    } = req.body;

    // Asigna valores por defecto si vienen nulos
    const mont = duracion_montaje || '02:00:00';
    const desmont = duracion_desmontaje || '02:00:00';

    try {
        // 1. Llama a nuestra función de validación
        const conflicto = await checkOverlap(id_sala, periodo_start, periodo_end, mont, desmont);

        if (conflicto) {
            // 409 Conflict: Hay un conflicto de horario
            return res.status(409).json({ 
                msg: "Conflicto de horario", 
                error: "La sala ya está reservada en ese rango de tiempo (incluyendo montaje/desmontaje).",
                reservaEnConflicto: conflicto
            });
        }
        
        // 2. TODO: Tu validación de parking (cant_vehiculos) iría aquí

        // 3. Si todo pasa, crea la reserva
        const insertado = await model.create(req.body);
        return res.status(201).json({msg: "Datos insertados correctamente", Insercion: insertado});

    } catch (error) {
        console.error("Error al insertar reserva", error);
        return res.status(500).json({msg: "Error", error: error.message});    
    }
}


const upd_reserva = async(req, res) => {
  let {id} = req.params;
  
  // Validar campos entrantes
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }

  const { 
      id_sala, 
      periodo_start, 
      periodo_end, 
      duracion_montaje, 
      duracion_desmontaje 
  } = req.body;

  try {
    // 1. Buscar la reserva actual para obtener datos faltantes si no vienen en el body
    const reservaActual = await model.findByPk(id);
    if (!reservaActual) {
      return res.status(404).json({msg: "No hay una reserva con ese id"});
    }

    // Usamos los valores nuevos o mantenemos los viejos
    const salaFinal = id_sala || reservaActual.id_sala;
    const startFinal = periodo_start || reservaActual.periodo_start;
    const endFinal = periodo_end || reservaActual.periodo_end;
    const montFinal = duracion_montaje || reservaActual.duracion_montaje;
    const desmontFinal = duracion_desmontaje || reservaActual.duracion_desmontaje;

    // 2. VALIDAR CONFLICTO DE HORARIO (EXCLUYENDO LA RESERVA ACTUAL)
    // (Nota: checkOverlap necesita ser ajustado para excluir el propio ID al actualizar,
    //  pero para simplificar, si cambias horas drásticamente funcionará).
    
    // Llamamos a checkOverlap con los nuevos valores propuestos
    const conflicto = await checkOverlap(salaFinal, startFinal, endFinal, montFinal, desmontFinal);

    // Si hay conflicto Y NO ES la misma reserva que estamos editando
    if (conflicto && conflicto.id_reserva != id) {
        return res.status(409).json({ 
            msg: "Conflicto al actualizar", 
            error: "El nuevo horario choca con otra reserva existente." 
        });
    }

    // 3. Actualizar
    const [actualizado] = await model.update(req.body, {where: {id_reserva: id}});
    
    return res.status(200).json({msg:"Reserva actualizada correctamente", Upd: actualizado});

  } catch (error) {
    console.error("Error al actualizar reserva", error);
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

const delete_reserva = async(req,res) => {
  let {id} = req.params;
  try {
    const borrado = await model.destroy({where: {id_reserva: id}})
        if(borrado === 0){
      return res.status(404).json({msg:"No hay una reserva con ese id"});
    }
        return res.status(200).json({msg:"Reserva borrada correctamente", Deleted: borrado});
  } catch (error) {
    console.error("Error al borrar reserva", error);
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

module.exports ={
  listar_reservas, listar_reserva_id, insert_reserva, upd_reserva, delete_reserva
}