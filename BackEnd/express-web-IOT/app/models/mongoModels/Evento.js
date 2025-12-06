const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Basado en el modelo Evento de Sequelize
const eventoSchema = new mongoose.Schema(
    {
        // id_evento será creado por AutoIncrement
        
        // Llave foránea de Responsable
        id_responsable: {
            type: Number,
            ref: 'responsables', // Referencia al modelo de Responsable
            required: [true, "El id_responsable no puede ser null"]
        },
        nombre_evento: {
            type: String,
            required: [true, "El nombre_evento no puede ser null"]
        },
        descripcion: {
            type: String,
            required: [true, "La descripcion no puede ser null"]
        },
        categoria_evento: {
            type: String, // Ajustado a String como en el modelo corregido de Sequelize
            required: [true, "La categoria_evento no puede ser null"]
        },
        tipo_de_admision: {
            type: String,
            required: [true, "El tipo_de_admision no puede ser null"]
        },
        qr_evento: {
            type: String,
            required: false
        },
        qr_imagen: {
            type: String,
            required: false
        },
        estado: {
            type: String,
            required: false,
            default: "Pendiente"
        },
        folio_evento:{
            type: String,
            required: false,
        }
    },
    {
        timestamps: true
    }
);

eventoSchema.plugin(AutoIncrement, {
  inc_field: 'id_evento',
  id: 'eventoNums',
  start_seq: 0
});

const Evento = mongoose.model("evento", eventoSchema, 'evento');

module.exports = Evento;