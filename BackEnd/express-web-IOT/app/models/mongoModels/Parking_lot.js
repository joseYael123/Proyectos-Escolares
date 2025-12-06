const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

// Basado en el modelo Parking de Sequelize
const parkingSchema = new mongoose.Schema(
    {
        // id_lot será creado por AutoIncrement
        nombre_lot: {
            type: String,
            required: [true, "El nombre_lot no puede ser null"]
        },
        total_espacios: {
            type: Number,
            required: [true, "El total_espacios no puede ser null"]
        }
    },
    {
        timestamps: true
    }
);

parkingSchema.plugin(AutoIncrement, {
  inc_field: 'id_lot',
  id: 'parkingNums',
  start_seq: 1
});

const Parking = mongoose.model("parking_lot", parkingSchema, 'parking_lot');

module.exports = Parking;
