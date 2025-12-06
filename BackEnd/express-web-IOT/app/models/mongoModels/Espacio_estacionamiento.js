const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Basado en el modelo Espacio_esta de Sequelize
const espacioEstaSchema = new mongoose.Schema(
    {
        // id_espacio será creado por AutoIncrement
        
        // Llave foránea de Parking (parking_lot)
        id_lot: {
            type: Number,
            ref: 'parking_lots', // Referencia al modelo de Parking
            required: [true, "El id_lot no puede ser null"]
        },
        numero_cajon: {
            type: String,
            required: [true, "El numero_cajon no puede ser null"]
        },
        tipo_espacio: {
            type: String,
            required: [true, "El tipo_espacio no puede ser null"]
        },
        estado_disponible: {
            type: Boolean,
            required: [true, "El estado_disponible no puede ser null"]
        }
    },
    {
        timestamps: true
    }
);

espacioEstaSchema.plugin(AutoIncrement, {
  inc_field: 'id_espacio',
  id: 'espacioNums',
  start_seq: 1
});

const Espacio_esta = mongoose.model("espacio_estacionamiento", espacioEstaSchema, 'espacio_estacionamiento');

module.exports = Espacio_esta;