const sequelize = require('../../../db/sequelize');
const {DataTypes, Model} = require('sequelize');

const Parking = sequelize.define("parking_lot", {
    id_lot: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }, 
    nombre_lot: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    total_espacios:{
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'parking_lot',
    timestamps: true,
    createdAt: 'createdat',
    updatedAt: 'updatedat'
});

module.exports = Parking;

