const sequelize = require('../../../db/sequelize');
const {DataTypes, Model} = require('sequelize');

const Evento = sequelize.define("evento", {
    id_evento: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }, 
    // --- AGREGAR ESTO ---
    // Es necesario para que Model.create() acepte el valor
    id_responsable: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // --------------------
    nombre_evento: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    descripcion:{
        type: DataTypes.STRING,
        allowNull: false
    },
    categoria_evento:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tipo_de_admision: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    qr_evento: {
        type: DataTypes.STRING,
        allowNull: true
    },
    qr_imagen:{
        type: DataTypes.STRING,
        allowNull: true
    },
    estado:{
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Pendiente"
    },
    folio_evento:{
        type: DataTypes.STRING,
        allowNull: true    
    }
}, {
    tableName: 'evento',
    timestamps: true,
    createdAt: 'createdat',
    updatedAt: 'updatedat'  
});

module.exports = Evento;