const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const ResponsableModel = require('../app/models/postgresModels/Responsable');
const ResponsableMg = require('../app/models/mongoModels/Responsable');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '2125200366@soy.utj.edu.mx', 
    pass: process.env.CONTRA_APP_GMAIL
  }
});

// --- ENVÍO DE CONFIRMACIÓN ---
const enviarCorreoConfirmacion = async (evento, responsable, imagePath) => {
  console.log('--- [Email Service] Enviando Confirmación ---');
  try {
    let responsableDatos = responsable;
    if (!responsableDatos && evento.id_responsable) {
      responsableDatos = await ResponsableModel.findByPk(evento.id_responsable);
    }
    
    const emailDestino = responsableDatos?.correo || responsableDatos?.correo_electronico || responsableDatos?.email;
    
    if (!responsableDatos || !emailDestino) {
        console.warn("⚠️ No se encontró correo para confirmar.");
        return false;
    }

    const nombreResponsable = responsableDatos.nombre || responsableDatos.nombre_completo || 'Usuario';

    const mailOptions = {
      from: '"Conjunto Santander Admin" <2125200366@soy.utj.edu.mx>',
      to: emailDestino,
      subject: `Confirmación de Evento: ${evento.nombre_evento}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <h2 style="color: #0d6efd;">Estimado/a ${nombreResponsable},</h2>
            <p>Le informamos que su evento <strong>"${evento.nombre_evento}"</strong> ha sido <span style="color:green; font-weight:bold;">CONFIRMADO</span> exitosamente.</p>
            <p>
                Adjunto encontrará su <strong>código QR</strong> para el acceso.
                <br><em>Puede utilizarlo como alternativa al acceso por placas.</em>
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 0.9em; color: #666;">Atentamente,<br><strong>Conjunto Santander de Artes Escénicas</strong></p>
        </div>
      `,
      attachments: [{ filename: `Acceso_QR_${evento.folio_evento || evento.id_evento}.png`, path: imagePath }]
    };

    if (!fs.existsSync(imagePath)) console.warn(`⚠️ Advertencia: La imagen no existe en disco: ${imagePath}`);

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Confirmación enviada a: ${emailDestino}`);
    return true;

  } catch (error) {
    console.error("❌ Error enviando confirmación:", error.message);
    return false;
  }
};

// --- NUEVA FUNCIÓN: ENVÍO DE RECHAZO ---
const enviarCorreoRechazo = async (evento, responsable) => {
  console.log('--- [Email Service] Enviando Notificación de RECHAZO ---');
  
  try {
    let responsableDatos = responsable;

    if (!responsableDatos && evento.id_responsable) {
        responsableDatos = await ResponsableModel.findByPk(evento.id_responsable);
    }

    const emailDestino = responsableDatos?.correo || responsableDatos?.correo_electronico || responsableDatos?.email;

    if (!responsableDatos || !emailDestino) {
        console.warn("⚠️ No se pudo enviar rechazo: Falta correo.");
        return false;
    }

    const nombreResponsable = responsableDatos.nombre || responsableDatos.nombre_completo || 'Usuario';

    const mailOptions = {
      from: '"Conjunto Santander Admin" <2125200366@soy.utj.edu.mx>',
      to: emailDestino,
      subject: `Actualización de Evento: ${evento.nombre_evento}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <h2 style="color: #dc3545;">Estimado/a ${nombreResponsable},</h2>
            
            <p>Le informamos que el estatus de su evento <strong>"${evento.nombre_evento}"</strong> ha cambiado a: <span style="color: #dc3545; font-weight: bold;">DENEGADO</span>.</p>
            
            <p>
                Lamentablemente, no podemos proceder con la solicitud en este momento. 
                <br>
                Cualquier código QR generado anteriormente ha sido inhabilitado.
            </p>
            
            <p>Por favor, póngase en contacto con la administración si tiene dudas o desea reagendar.</p>
            
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            
            <p style="font-size: 0.9em; color: #666;">
                Atentamente,<br>
                <strong>Conjunto Santander de Artes Escénicas</strong>
            </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Correo de rechazo enviado a: ${emailDestino}`);
    return true;

  } catch (error) {
    console.error("❌ Error enviando rechazo:", error.message);
    return false;
  }
};

module.exports = {
  enviarCorreoConfirmacion,
  enviarCorreoRechazo
};