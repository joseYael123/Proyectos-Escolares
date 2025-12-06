const sequelize = require('../../../db/sequelize');
const {DataTypes, Model} = require('sequelize');

const Reserva_evento = sequelize.define("reserva_evento", {
    id_reserva: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    }, 
    periodo_start: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    periodo_end:{
        type: DataTypes.DATE,
        allowNull: false
    },
    cant_vehiculos:{
        type: DataTypes.INTEGER,
        allowNull: false
    },
    duracion_montaje: { // Postgres lo maneja como INTERVAL
        type: DataTypes.STRING, // Sequelize lo leerá como un string
        allowNull: true,
        defaultValue: '02:00:00' // 2 horas por defecto
    },
    duracion_desmontaje: { 
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '02:00:00'
    },    // --- LLAVES FORÁNEAS AGREGADAS ---
    id_evento: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_sala: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // --------------------------------
}, {
    tableName: 'reserva_evento',
    timestamps: true,
    createdAt: 'createdat',
    updatedAt: 'updatedat'
});

module.exports = Reserva_evento;