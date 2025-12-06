const express = require('express');
const router = express.Router();
const axios = require('axios'); // Necesitas axios: npm install axios

// Esta ruta recibe el token del frontend y valida con Google
router.post('/verificar-captcha', async (req, res) => {
    const { token } = req.body;
    
    // 1. AQUÍ SE USA LA SECRET KEY
    // Se lee desde el archivo .env del backend
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!token) {
        return res.status(400).json({ success: false, msg: "Falta el token de captcha" });
    }

    if (!secretKey) {
        console.error("Error: No se encontró la RECAPTCHA_SECRET_KEY en el .env");
        return res.status(500).json({ success: false, msg: "Error de configuración del servidor" });
    }

    try {
        // 2. Hacemos la petición a Google
        // Le enviamos: Tu Secreto + El Token del Usuario
        const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;
        
        const googleRes = await axios.post(url);
        const { success, score } = googleRes.data;

        // 3. Verificamos el resultado
        // success: true si el token es válido
        // score: 0.0 (bot) a 1.0 (humano). 0.5 es un buen filtro.
        if (success && score > 0.5) {
            console.log(`Captcha válido. Score: ${score}`);
            return res.json({ success: true, score });
        } else {
            console.warn(`Captcha fallido o bajo score. Score: ${score}`);
            return res.json({ success: false, score, msg: "No se pudo verificar que seas humano." });
        }

    } catch (err) {
        console.error("Error contactando a Google Recaptcha:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;