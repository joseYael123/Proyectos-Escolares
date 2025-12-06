const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Basado en el modelo Guardia de Sequelize
const guardiaSchema = new mongoose.Schema(
    {
        // id_guardia será creado por AutoIncrement
        nom_guardia: {
            type: String,
            required: [true, "El nom_guardia no puede ser null"]
        },
        app_guardia: {
            type: String,
            required: [true, "El app_guardia no puede ser null"]
        },
        apm_guardia: {
            type: String,
            required: [true, "El apm_guardia no puede ser null"]
        },
        numero_guardia: {
            type: String,
            required: [true, "El numero_guardia no puede ser null"],
            unique: true
        },
        contra_guardia: {
            type: String,
            required: [true, "El contra_guardia no puede ser null"]
        },
        estado: {
            type: String,
            required: false,
            default: "Activo"
        },
        imagen:{
            type: String,
            required: false
        }
    },
    {
        timestamps: true
    }
);

guardiaSchema.plugin(AutoIncrement, {
  inc_field: 'id_guardia',
  id: 'guardiaNums',
  start_seq: 0
});

// Asegurar que el índice único se cree en MongoDB
guardiaSchema.index({ numero_guardia: 1 }, { unique: true });

const Guardia = mongoose.model("guardia", guardiaSchema, 'guardia');

// Crear índices en la base de datos (ejecutar una vez al iniciar)
Guardia.createIndexes().catch(err => {
  console.error('Error creando índices para Guardia:', err);
});

module.exports = Guardia;