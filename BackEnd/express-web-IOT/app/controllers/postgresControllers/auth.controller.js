const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const AdminModel = require('../../models/postgresModels/Admin');
const { JWT_SECRET } = require('../../middleware/auth');

/**
 * Login para admin de PostgreSQL
 */
const loginAdmin = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ 
            msg: "Datos de entrada inválidos", 
            errors: errores.array(),
            success: false 
        });
    }

    try {
        const { usuario_admin, contra_admin } = req.body;

        // 1. Buscar el admin por usuario
        const admin = await AdminModel.findOne({ 
            where: { usuario_admin } 
        });
        
        if (!admin) {
            return res.status(401).json({ 
                msg: "Credenciales inválidas", 
                success: false 
            });
        }

        // 2. Verificar que el admin esté activo
        if (admin.estado !== 'ACTIVO' && admin.estado !== 'Activo') {
            return res.status(401).json({ 
                msg: "Cuenta de administrador inactiva", 
                success: false 
            });
        }

        // 3. Verificar la contraseña
        const passwordValid = await bcrypt.compare(contra_admin, admin.contra_admin);
        if (!passwordValid) {
            return res.status(401).json({ 
                msg: "Credenciales inválidas", 
                success: false 
            });
        }

        // 4. Generar token JWT
        const payload = {
            admin_id: admin.admin_id,
            usuario_admin: admin.usuario_admin,
            nom_admin: admin.nom_admin,
            rol: admin.rol,
            database: 'postgresql'
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

        // 5. Respuesta exitosa
        return res.status(200).json({
            msg: "Login exitoso",
            success: true,
            token,
            admin: {
                admin_id: admin.admin_id,
                nom_admin: admin.nom_admin,
                app_admin: admin.app_admin,
                apm_admin: admin.apm_admin,
                usuario_admin: admin.usuario_admin,
                correo: admin.correo,
                rol: admin.rol,
                estado: admin.estado,
                imagen: admin.imagen
            }
        });

    } catch (error) {
        console.error("Error en login:", error);
        return res.status(500).json({ 
            msg: "Error interno del servidor", 
            success: false,
            error: error.message 
        });
    }
};

/**
 * Verificar token válido
 */
const verifyToken = async (req, res) => {
    try {
        // Si llegamos aquí, el token ya fue validado por el middleware
        const admin = await AdminModel.findOne({ 
            where: { admin_id: req.user.admin_id } 
        });
        
        if (!admin) {
            return res.status(404).json({ 
                msg: "Admin no encontrado", 
                success: false 
            });
        }

        return res.status(200).json({
            msg: "Token válido",
            success: true,
            admin: {
                admin_id: admin.admin_id,
                nom_admin: admin.nom_admin,
                app_admin: admin.app_admin,
                apm_admin: admin.apm_admin,
                usuario_admin: admin.usuario_admin,
                correo: admin.correo,
                rol: admin.rol,
                estado: admin.estado,
                imagen: admin.imagen
            }
        });
    } catch (error) {
        console.error("Error verificando token:", error);
        return res.status(500).json({ 
            msg: "Error interno del servidor", 
            success: false 
        });
    }
};

/**
 * Cambiar contraseña
 */
const changePassword = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ 
            msg: "Datos de entrada inválidos", 
            errors: errores.array(),
            success: false 
        });
    }

    try {
        const { contra_actual, nueva_contra } = req.body;
        const adminId = req.user.admin_id;

        // 1. Buscar el admin
        const admin = await AdminModel.findOne({ 
            where: { admin_id: adminId } 
        });
        
        if (!admin) {
            return res.status(404).json({ 
                msg: "Admin no encontrado", 
                success: false 
            });
        }

        // 2. Verificar contraseña actual
        const passwordValid = await bcrypt.compare(contra_actual, admin.contra_admin);
        if (!passwordValid) {
            return res.status(401).json({ 
                msg: "Contraseña actual incorrecta", 
                success: false 
            });
        }

        // 3. Encriptar nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nueva_contra, salt);

        // 4. Actualizar contraseña
        await AdminModel.update(
            { contra_admin: hashedPassword },
            { where: { admin_id: adminId } }
        );

        return res.status(200).json({
            msg: "Contraseña actualizada correctamente",
            success: true
        });

    } catch (error) {
        console.error("Error cambiando contraseña:", error);
        return res.status(500).json({ 
            msg: "Error interno del servidor", 
            success: false 
        });
    }
};

module.exports = {
    loginAdmin,
    verifyToken,
    changePassword
};