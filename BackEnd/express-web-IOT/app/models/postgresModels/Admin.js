const sequelize = require('../../../db/sequelize');
const {DataTypes, Model} = require('sequelize');

const Admin = sequelize.define("admin", {
    admin_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }, 
    nom_admin: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    app_admin:{
        type: DataTypes.STRING,
        allowNull: false
    },
    apm_admin:{
        type: DataTypes.STRING,
        allowNull: true
    },
    correo: {
        type: DataTypes.STRING,
        allowNull: false
    }, 
    usuario_admin: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contra_admin:{
        type: DataTypes.STRING,
        allowNull: false
    }, 
    rol: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "logistica"
    },
    imagen:{
        type: DataTypes.STRING,
        allowNull: true
    },
    estado: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "ACTIVO"
    }
}, {
    tableName: 'admin',
    timestamps: true,
    createdAt: 'createdat',
    updatedAt: 'updatedat'
});

module.exports = Admin;

