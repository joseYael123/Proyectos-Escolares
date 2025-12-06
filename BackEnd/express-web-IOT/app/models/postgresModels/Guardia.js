const sequelize = require('../../../db/sequelize');
const {DataTypes, Model} = require('sequelize');

const Guardia = sequelize.define("guardia", {
    id_guardia: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }, 
    nom_guardia: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    app_guardia:{
        type: DataTypes.STRING,
        allowNull: false
    },
    apm_guardia:{
        type: DataTypes.STRING,
        allowNull: false
    },
    numero_guardia: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            msg: 'Este número de guardia ya está registrado'
        }
    }, 
    contra_guardia: {
        type: DataTypes.STRING,
        allowNull: false
    },
    estado:{
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Activo"
    },
    imagen : {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'guardia',
    timestamps: true,
    createdAt: 'createdat',
    updatedAt: 'updatedat'
});

module.exports = Guardia;

