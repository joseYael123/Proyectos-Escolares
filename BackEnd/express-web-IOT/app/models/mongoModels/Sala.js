const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Basado en el modelo Sala de Sequelize
const salaSchema = new mongoose.Schema(
    {
        // id_sala será creado por AutoIncrement
        nombre_sala: {
            type: String,
            required: [true, "El nombre_sala no puede ser null"]
        },
        descripcion: {
            type: String,
            required: [true, "La descripcion no puede ser null"]
        },
        capacidad: {
            type: Number,
            required: [true, "La capacidad no puede ser null"]
        },
        estado: {
            type: String,
            required: false,
            default: "activo"
        }
    },
    {
        timestamps: true
    }
);

salaSchema.plugin(AutoIncrement, {
  inc_field: 'id_sala',
  id: 'salaNums',
  start_seq: 1
});

const Sala = mongoose.model("sala", salaSchema, 'sala');

module.exports = Sala;