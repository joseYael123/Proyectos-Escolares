const sequelize = require('../../../db/sequelize');
const {DataTypes, Model} = require('sequelize');

const Responsable = sequelize.define("responsable", {
    id_responsable: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }, 
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    apellido_paterno:{
        type: DataTypes.STRING,
        allowNull: false
    },
    apellido_materno:{
        type: DataTypes.STRING,
        allowNull: false
    },
    telefono: {
        type: DataTypes.STRING,
        allowNull: false
    }, 
    correo_electronico: {
        type: DataTypes.STRING,
        allowNull: false
    },
    link_social:{
        type: DataTypes.STRING,
        allowNull: true
    }, 
    qr_responsable: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    qr_imagen:{
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'responsable',
    timestamps: true,
    createdAt: 'createdat',
    updatedAt: 'updatedat'
});

module.exports = Responsable;

