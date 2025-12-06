const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Basado en el modelo Vehiculo de Sequelize
const vehiculoSchema = new mongoose.Schema(
    {
        // id_vehiculo será creado por AutoIncrement
        placas: {
            type: String,
            required: [true, "Las placas no pueden ser null"]
        },
        modelo: {
            type: String,
            required: [true, "El modelo no puede ser null"]
        },
        color: {
            type: String,
            required: [true, "El color no puede ser null"]
        }, 
        placa_imagen: {
            type: String,
            required: false
        },
        tipo_vehiculo: {
            type: String,
            required: [true, "Tipo de vehiculo es requerido"]
        },
        id_responsable:{
            type: Number,
            ref: 'responsables',
            required: [true, "el id del responsable no puede ser null"]
            
        }
    },
    {
        timestamps: true
    }
);

vehiculoSchema.plugin(AutoIncrement, {
  inc_field: 'id_vehiculo',
  id: 'vehiculoNums',
  start_seq: 0
});

const Vehiculo = mongoose.model("vehiculo", vehiculoSchema, 'vehiculo');

module.exports = Vehiculo;
