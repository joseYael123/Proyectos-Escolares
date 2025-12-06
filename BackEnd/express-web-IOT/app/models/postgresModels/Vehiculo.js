const sequelize = require('../../../db/sequelize');
const {DataTypes, Model} = require('sequelize');

const Vehiculo = sequelize.define("vehiculo", {
    id_vehiculo: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }, 
    placas: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    modelo:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    color:{
        type: DataTypes.STRING,
        allowNull: false
    },
    placa_imagen:{
        type: DataTypes.STRING,
        allowNull: true
    },
    tipo_vehiculo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    id_responsable: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'vehiculo',
    timestamps: true,
    createdAt: 'createdat',
    updatedAt: 'updatedat'
});

module.exports = Vehiculo;

