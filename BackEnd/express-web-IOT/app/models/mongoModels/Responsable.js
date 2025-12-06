const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Basado en el modelo Responsable de Sequelize
const responsableSchema = new mongoose.Schema(
    {
        // id_responsable será creado por AutoIncrement
        nombre: {
            type: String,
            required: [true, "El nombre no puede ser null"]
        },
        apellido_paterno: {
            type: String,
            required: [true, "El apellido_paterno no puede ser null"]
        },
        apellido_materno: {
            type: String,
            required: [true, "El apellido_materno no puede ser null"]
        },
        telefono: {
            type: String,
            required: [true, "El telefono no puede ser null"]
        },
        correo_electronico: {
            type: String,
            required: [true, "El correo_electronico no puede ser null"]
        },
        link_social: {
            type: String,
            required: false // Equivalente a allowNull: true
        },
        qr_responsable: {
            type: String,
            required: false // Equivalente a allowNull: true
        },
        qr_imagen: {
            type: String,
            required: false
        }
    },
    {
        timestamps: true
    }
);

responsableSchema.plugin(AutoIncrement, {
  inc_field: 'id_responsable',
  id: 'responsableNums',
  start_seq: 0
});

const Responsable = mongoose.model("responsable", responsableSchema, 'responsable');

module.exports = Responsable;