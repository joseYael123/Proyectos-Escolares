const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../../app/controllers/mongoControllers/auth.controller');
const { verifyToken } = require('../../app/middleware/auth');

// Validaciones para login
const loginValidations = [
    body('usuario_admin')
        .notEmpty()
        .withMessage('El usuario es requerido'),
    body('contra_admin')
        .notEmpty()
        .withMessage('La contraseña es requerida')
];

// Validaciones para cambio de contraseña
const changePasswordValidations = [
    body('contra_actual')
        .notEmpty()
        .withMessage('La contraseña actual es requerida'),
    body('nueva_contra')
        .isLength({ min: 6 })
        .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula y un número')
];

// Rutas públicas
router.post('/login', loginValidations, authController.loginAdmin);

// Rutas protegidas (requieren token)
router.get('/verify', verifyToken, authController.verifyToken);
router.put('/change-password', verifyToken, changePasswordValidations, authController.changePassword);

module.exports = router;