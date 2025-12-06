const jwt = require('jsonwebtoken');

// Clave secreta para JWT (en producción esto debería estar en variables de entorno)
const JWT_SECRET = 'conjuntoSantanderSecretKey2024!';

/**
 * Middleware para verificar tokens JWT
 */
const verifyToken = (req, res, next) => {
    try {
        // Obtener el token del header Authorization
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                msg: "Token de acceso requerido", 
                success: false 
            });
        }

        // El formato esperado es: "Bearer <token>"
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                msg: "Formato de token inválido. Use: Bearer <token>", 
                success: false 
            });
        }

        // Verificar y decodificar el token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Agregar la información del usuario al request
        req.user = decoded;
        
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                msg: "Token expirado", 
                success: false 
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                msg: "Token inválido", 
                success: false 
            });
        }

        console.error("Error en verificación de token:", error);
        return res.status(500).json({ 
            msg: "Error interno del servidor", 
            success: false 
        });
    }
};

/**
 * Middleware adicional para verificar que el usuario sea super admin
 */
const verifySuperAdmin = (req, res, next) => {
    if (req.user && (req.user.rol === 'super admin' || req.user.rol === 'super_admin')) {
        next();
    } else {
        return res.status(403).json({ 
            msg: "Acceso denegado. Se requieren permisos de super admin", 
            success: false 
        });
    }
};

/**
 * Middleware para verificar que el usuario sea super admin o logística
 */
const verifySuperAdminOrLogistica = (req, res, next) => {
    if (req.user && (req.user.rol === 'super admin' || req.user.rol === 'super_admin' || req.user.rol === 'logistica')) {
        next();
    } else {
        return res.status(403).json({ 
            msg: "Acceso denegado. Se requieren permisos de super admin o logística", 
            success: false 
        });
    }
};

/**
 * Middleware para verificar que el usuario sea logística
 */
const verifyLogistica = (req, res, next) => {
    if (req.user && req.user.rol === 'logistica') {
        next();
    } else {
        return res.status(403).json({ 
            msg: "Acceso denegado. Se requieren permisos de logística", 
            success: false 
        });
    }
};

module.exports = {
    verifyToken,
    verifySuperAdmin,
    verifySuperAdminOrLogistica,
    verifyLogistica,
    JWT_SECRET
};