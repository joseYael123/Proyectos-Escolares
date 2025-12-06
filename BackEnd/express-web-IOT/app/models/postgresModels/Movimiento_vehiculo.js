const sequelize = require('../../../db/sequelize');
const {DataTypes, Model} = require('sequelize');

const Movimiento_vehiculo = sequelize.define("movimiento_vehiculo", {
  id_movimiento: {
    type: DataTypes.BIGINT, // Corresponde a 'bigserial'
    primaryKey: true,
    autoIncrement: true
  },
  // --- LLAVES FORÁNEAS AGREGADAS ---
  id_vehiculo: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_evento: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // --------------------------------
  tipo_operacion: {
    type: DataTypes.STRING(20),
    allowNull: false // Asumo que no puede ser nulo
  },
  direccion_vehiculo: {
    type: DataTypes.STRING(10), 
    allowNull: false,
  },
  fecha_hora:{
    type: DataTypes.DATE, 
    allowNull: false
  },
  observaciones:{
    type: DataTypes.STRING(255),
    allowNull: true 
  }
}, {
  tableName: 'movimiento_vehiculo',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat'
});

module.exports = Movimiento_vehiculo;