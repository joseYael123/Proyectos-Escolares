const sequelize = require('../../../db/sequelize');
const {DataTypes, Model} = require('sequelize');

const Espacio_esta = sequelize.define("espacio_estacionamiento", {
    id_espacio: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }, 
    // --- LLAVE FORÁNEA AGREGADA ---
    id_lot: { // Referencia a parking_lot
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // ------------------------------
    numero_cajon: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    tipo_espacio:{
        type: DataTypes.STRING,
        allowNull: false
    },
    estado_disponible:{
        type: DataTypes.BOOLEAN,
        allowNull: false
    }
}, {
    tableName: 'espacio_estacionamiento',
    timestamps: true,
    createdAt: 'createdat',
    updatedAt: 'updatedat'
}); 

module.exports = Espacio_esta;