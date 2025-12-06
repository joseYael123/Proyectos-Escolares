const controller = require('../../app/controllers/postgresControllers/reserva.controller');
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const moment = require('moment'); // 1. ¡IMPORTANTE! Faltaba importar moment

// Expresión regular para validar formato de tiempo "HH:mm:ss"
const timeRegex = /^\d{2}:\d{2}:\d{2}$/;

const validaciones = [
  body('id_evento').isInt().withMessage('id_evento es requerido'),
  body('id_sala').isInt().withMessage('id_sala es requerida'),
  body('periodo_start').isISO8601().withMessage('periodo_start debe ser una fecha válida'),
  
  body('periodo_end').isISO8601().withMessage('periodo_end debe ser una fecha válida')
        .custom((value, { req }) => {
            // Ahora sí funcionará porque importamos moment
            if (moment(value).isBefore(req.body.periodo_start)) {
                throw new Error('periodo_end no puede ser anterior a periodo_start');
            }
            return true;
        }),

  // 2. CORRECCIÓN DE CAMPOS:
  // El frontend envía 'duracion_montaje' (string), no '_minutos' (int).
  // Validamos que sea un string con formato de hora.
  body('duracion_montaje')
      .notEmpty().withMessage('La duración de montaje es requerida')
      .matches(timeRegex).withMessage('El formato debe ser HH:mm:ss (ej. 02:00:00)'),

  body('duracion_desmontaje')
      .notEmpty().withMessage('La duración de desmontaje es requerida')
      .matches(timeRegex).withMessage('El formato debe ser HH:mm:ss (ej. 02:00:00)'),
      
  // Opcional: Validar cantidad de vehículos si es necesario
  body('cant_vehiculos').isInt({ min: 0 }).withMessage('cant_vehiculos debe ser un número')
];

router.get('/', controller.listar_reservas);
router.get('/:id', controller.listar_reserva_id);
router.post('/', validaciones,  controller.insert_reserva);
router.put('/:id', validaciones, controller.upd_reserva);
router.delete('/:id', controller.delete_reserva);

module.exports = router;