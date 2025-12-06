const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Basado en el modelo Movimiento_vehiculo de Sequelize
const movimientoVehiculoSchema = new mongoose.Schema(
    {
        // id_movimiento será creado por AutoIncrement
        
        // Llave foránea de Vehiculo
        id_vehiculo: {
            type: Number,
            ref: 'vehiculos', // Referencia al modelo de Vehiculo
            required: [true, "El id_vehiculo no puede ser null"]
        },
        // Llave foránea de Evento
        id_evento: {
            type: Number,
            ref: 'eventos', // Referencia al modelo de Evento
            required: [true, "El id_evento no puede ser null"]
        },
        tipo_operacion: {
            type: String,
            required: [true, "El tipo_operacion no puede ser null"]
        },
        direccion_vehiculo: {
            type: String,
            required: [true, "La direccion_vehiculo no puede ser null"]
        },
        fecha_hora: {
            type: Date,
            required: [true, "La fecha_hora no puede ser null"]
        },
        observaciones: {
            type: String,
            required: false // Opcional
        }
    },
    {
        timestamps: true
    }
);

movimientoVehiculoSchema.plugin(AutoIncrement, {
 inc_field: 'id_movimiento',
  id: 'movimientoNums',
  start_seq: 0
});

const Movimiento_vehiculo = mongoose.model("movimiento_vehiculo", movimientoVehiculoSchema, 'movimiento_vehiculo');

module.exports = Movimiento_vehiculo;