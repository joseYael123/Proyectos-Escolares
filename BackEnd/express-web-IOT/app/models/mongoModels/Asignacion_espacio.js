const mongoose = require('mongoose');
const { INTEGER } = require('sequelize');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Basado en el modelo Asignacion_espacio de Sequelize
const asignacionEspacioSchema = new mongoose.Schema(
    {
        // id_asignacion será creado por AutoIncrement
        
        // Llave foránea de Vehiculo
        id_vehiculo: {
            type: Number,
            ref: 'vehiculos', // Referencia al modelo de Vehiculo
            required: [true, "El id_vehiculo no puede ser null"]
        },
        // Llave foránea de Espacio_esta
        id_espacio: {
            type: Number,
            ref: 'espacio_estacionamientos', // Referencia al modelo de Espacio_esta
            required: [true, "El id_espacio no puede ser null"]
        },
        fecha_asignacion: {
            type: Date,
            required: [true, "La fecha_asignacion no puede ser null"]
        },
        fecha_liberacion: {
            type: Date,
            required: false
        },
        observaciones: {
            type: String,
            required: [true, "Las observaciones no pueden ser null"]
        },
        id_evento: {
            type: Number,
            required: [true, "el id del evento se requiere"]
        }
    },
    {
        // Esto añade createdAt y updatedAt automáticamente
        timestamps: true 
    }
);

asignacionEspacioSchema.plugin(AutoIncrement, {
  inc_field: 'id_asignacion', // El campo que será nuestro ID numérico
  id: 'asignacionNums',     // ID único para el contador de esta colección
  start_seq: 0           
});

const Asignacion_espacio = mongoose.model("asignacion_espacio", asignacionEspacioSchema, 'asignacion_espacio');

module.exports = Asignacion_espacio;