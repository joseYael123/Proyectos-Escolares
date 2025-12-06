const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Basado en el modelo Reserva_evento de Sequelize
const reservaEventoSchema = new mongoose.Schema(
    {
        // id_reserva será creado por AutoIncrement
        
        // Llave foránea de Evento
        id_evento: {
            type: Number,
            ref: 'eventos', // Referencia al modelo de Evento
            required: [true, "El id_evento no puede ser null"]
        },
        // Llave foránea de Sala
        id_sala: {
            type: Number,
            ref: 'salas', // Referencia al modelo de Sala
            required: [true, "El id_sala no puede ser null"]
        },
        periodo_start: {
            type: Date,
            required: [true, "El periodo_start no puede ser null"]
        },
        periodo_end: {
            type: Date,
            required: [true, "El periodo_end no puede ser null"]
        },
        cant_vehiculos: {
            type: Number,
            required: [true, "La cant_vehiculos no puede ser null"]
        }, 
        duracion_montaje:{
            type: String,
            required: [true, "La duracion de montaje se requiere"]
        }, 
        duracion_desmontaje:{
            type: String,
            required: [true, "La duracion de desmontaje se requiere"]
        }
    },
    {
        timestamps: true
    }
);

reservaEventoSchema.plugin(AutoIncrement, {
  inc_field: 'id_reserva',
  id: 'reservaEventoNums',
  start_seq: 0
});

const Reserva_evento = mongoose.model("reserva_evento", reservaEventoSchema, 'reserva_evento');

module.exports = Reserva_evento;
