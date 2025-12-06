const express = require('express');
const router = express.Router();
const controller = require('../../app/controllers/servicesController/email.controller');

// POST http://localhost:5000/pg/email/enviar
router.post('/enviar', controller.enviarCorreo);

module.exports = router;