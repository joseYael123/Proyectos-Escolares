const sequelize = require('../../../db/sequelize');
const {DataTypes, Model} = require('sequelize');

const Asignacion_espacio = sequelize.define("asignacion_espacio", {
    id_asignacion: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }, 
    // --- LLAVES FORÁNEAS AGREGADAS ---
    id_vehiculo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_espacio: { // Referencia a espacio_estacionamiento
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // --------------------------------
    fecha_asignacion: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    fecha_liberacion:{
        type: DataTypes.DATE,
        allowNull: true
    },
    observaciones:{
        type: DataTypes.STRING,
        allowNull: false
    },
    id_evento:{
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'asignacion_espacio',
    timestamps: true, 
    createdAt: 'createdat',
    updatedAt: 'updatedat'
});

module.exports = Asignacion_espacio;