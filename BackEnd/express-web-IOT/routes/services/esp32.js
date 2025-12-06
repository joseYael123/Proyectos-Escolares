const express = require('express');
const router = express.Router();
const esp32Control = require('../../app/controllers/servicesController/esp32.controller');

router.post('/mandar', esp32Control.mandarAccion);
router.get('/obtener', esp32Control.obtenerUltimaAccionEntrada);
router.post('/liberar', esp32Control.liberar_espacio)
router.get('/salida', esp32Control.obtenerUltimaActualizacionSalida);
router.post('/servo', esp32Control.moverServoNgrok);

module.exports = router;