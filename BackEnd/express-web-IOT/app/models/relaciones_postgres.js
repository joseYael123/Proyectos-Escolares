// Importar todos los modelos
const Admin = require('./postgresModels/Admin');
const Asignacion_espacio = require('./postgresModels/Asignacion_espacio');
const Espacio_esta = require('./postgresModels/Espacio_estacionamiento');
const Evento = require('./postgresModels/Evento');
const Guardia = require('./postgresModels/Guardia');
const Parking = require('./postgresModels/Parking_lot');
const Reserva_evento = require('./postgresModels/Reserva_evento');
const Responsable = require('./postgresModels/Responsable');
const Sala = require('./postgresModels/Sala');
const Vehiculo = require('./postgresModels/Vehiculo');
const Movimiento_vehiculo = require('./postgresModels/Movimiento_vehiculo'); // Importado

function definirRelaciones() {
 console.log('Definiendo relaciones de Sequelize...');

 // --- Relaciones de 'evento' ---

 // Un Responsable tiene muchos Eventos
 Responsable.hasMany(Evento, { foreignKey: 'id_responsable' }); // Corregido
 // Un Evento pertenece a un Responsable
 Evento.belongsTo(Responsable, { foreignKey: 'id_responsable' }); // Corregido

 // --- Relaciones de 'reserva_evento' ---

 // Un Evento tiene muchas Reservas de Evento
 Evento.hasMany(Reserva_evento, { foreignKey: 'id_evento' });
 // Una Reserva de Evento pertenece a un Evento
 Reserva_evento.belongsTo(Evento, { foreignKey: 'id_evento' });

 // Una Sala tiene muchas Reservas de Evento
 Sala.hasMany(Reserva_evento, { foreignKey: 'id_sala' });
 // Una Reserva de Evento pertenece a una Sala
 Reserva_evento.belongsTo(Sala, { foreignKey: 'id_sala' });

 // --- Relaciones de 'asignacion_espacio' ---

 // Un Vehículo tiene muchas Asignaciones de Espacio
 Vehiculo.hasMany(Asignacion_espacio, { foreignKey: 'id_vehiculo' });
 // Una Asignación de Espacio pertenece a un Vehículo
 Asignacion_espacio.belongsTo(Vehiculo, { foreignKey: 'id_vehiculo' });

 // Un Espacio (espacio_estacionamiento) tiene muchas Asignaciones
 Espacio_esta.hasMany(Asignacion_espacio, { foreignKey: 'id_espacio' });
 // Una Asignación de Espacio pertenece a un Espacio
 Asignacion_espacio.belongsTo(Espacio_esta, { foreignKey: 'id_espacio' });

 // --- Relaciones de 'espacio_estacionamiento' ---

 // Un Parking (parking_lot) tiene muchos Espacios
 Parking.hasMany(Espacio_esta, { foreignKey: 'id_lot' });
 // Un Espacio (espacio_estacionamiento) pertenece a un Parking
 Espacio_esta.belongsTo(Parking, { foreignKey: 'id_lot' });

 // --- Relaciones de 'movimiento_vehiculo' ---
 
 // Un Vehículo tiene muchos Movimientos
 Vehiculo.hasMany(Movimiento_vehiculo, { foreignKey: 'id_vehiculo' });
 // Un Movimiento pertenece a un Vehículo
 Movimiento_vehiculo.belongsTo(Vehiculo, { foreignKey: 'id_vehiculo' });
 
  // Un Evento tiene muchos Movimientos
 Evento.hasMany(Movimiento_vehiculo, { foreignKey: 'id_evento' });
 // Un Movimiento pertenece a un Evento
 Movimiento_vehiculo.belongsTo(Evento, { foreignKey: 'id_evento' });

 //Un vehiculo tiene solo un responsable
 Vehiculo.belongsTo(Responsable, {foreignKey: 'id_responsable'});

 //Una asignacion tiene un solo evento
 Asignacion_espacio.belongsTo(Evento, {foreignKey: 'id_evento'});
}

module.exports = definirRelaciones;