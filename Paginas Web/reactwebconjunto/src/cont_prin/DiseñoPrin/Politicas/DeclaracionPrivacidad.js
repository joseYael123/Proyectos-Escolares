import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../Footer/Footer';
import '../formulariosSolicitud/formulario.css';

function DeclaracionPrivacidad() {
  const navigate = useNavigate();

  return (
    <>
      <br />
      <div className="container">
        {/* Botón de regreso */}
        <button 
          type="button"
          onClick={() => navigate(-1)}
          className="btn mb-3"
          style={{ 
            backgroundColor: 'transparent', 
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0',
            marginBottom: '10px'
          }}
          title="Regresar"
        >
          ← Regresar
        </button>

        <h1 style={{ marginBottom: '30px' }}>Declaración de Privacidad</h1>
        
        <div style={{ lineHeight: '1.8', textAlign: 'justify' }}>
          <h3>Conjunto Santander de Artes Escénicas</h3>
          <p><strong>Última actualización: Noviembre 2025</strong></p>
          
          <br />
          
          <h4>1. INFORMACIÓN QUE RECOPILAMOS</h4>
          <p>
            Conjunto Santander recopila información personal cuando usted solicita espacios, 
            reserva eventos o se comunica con nosotros. Esta información puede incluir:
          </p>
          <ul>
            <li>Nombre completo del responsable del evento</li>
            <li>Número de teléfono</li>
            <li>Correo electrónico</li>
            <li>Información del evento (nombre, descripción, categoría)</li>
            <li>Información de vehículos autorizados</li>
          </ul>

          <br />

          <h4>2. USO DE LA INFORMACIÓN</h4>
          <p>La información recopilada se utiliza para:</p>
          <ul>
            <li>Procesar y gestionar solicitudes de espacios y eventos</li>
            <li>Comunicarnos con usted respecto a su solicitud</li>
            <li>Mejorar nuestros servicios</li>
            <li>Cumplir con requisitos legales y de seguridad</li>
            <li>Control de acceso vehicular al recinto</li>
          </ul>

          <br />

          <h4>3. PROTECCIÓN DE DATOS</h4>
          <p>
            Conjunto Santander se compromete a proteger su información personal. 
            Implementamos medidas de seguridad administrativas, técnicas y físicas 
            apropiadas para proteger sus datos contra acceso no autorizado, alteración, 
            divulgación o destrucción.
          </p>

          <br />

          <h4>4. COMPARTIR INFORMACIÓN</h4>
          <p>
            No vendemos, alquilamos ni compartimos su información personal con terceros 
            para fines de marketing. Solo compartimos información cuando:
          </p>
          <ul>
            <li>Es necesario para la prestación del servicio solicitado</li>
            <li>Lo requiere la ley</li>
            <li>Usted nos da su consentimiento explícito</li>
          </ul>

          <br />

          <h4>5. DERECHOS DEL TITULAR</h4>
          <p>Usted tiene derecho a:</p>
          <ul>
            <li>Acceder a sus datos personales</li>
            <li>Solicitar la corrección de datos inexactos</li>
            <li>Solicitar la eliminación de sus datos</li>
            <li>Oponerse al procesamiento de sus datos</li>
            <li>Revocar su consentimiento en cualquier momento</li>
          </ul>

          <br />

          <h4>6. COOKIES Y TECNOLOGÍAS SIMILARES</h4>
          <p>
            Utilizamos cookies y tecnologías similares para mejorar su experiencia en 
            nuestro sitio web. Puede configurar su navegador para rechazar cookies, 
            aunque esto puede afectar algunas funcionalidades del sitio.
          </p>

          <br />

          <h4>7. RETENCIÓN DE DATOS</h4>
          <p>
            Conservamos su información personal durante el tiempo necesario para cumplir 
            con los fines descritos en esta declaración, a menos que la ley requiera o 
            permita un período de retención más largo.
          </p>

          <br />

          <h4>8. CAMBIOS A ESTA DECLARACIÓN</h4>
          <p>
            Nos reservamos el derecho de actualizar esta Declaración de Privacidad en 
            cualquier momento. Los cambios entrarán en vigor inmediatamente después de su 
            publicación en nuestro sitio web.
          </p>

          <br />

          <h4>9. CONTACTO</h4>
          <p>
            Para ejercer sus derechos o si tiene preguntas sobre esta Declaración de 
            Privacidad, puede contactarnos en:
          </p>
          <ul>
            <li><strong>Dirección:</strong> Av. Periférico Norte No. 1695, Col. Parque Industrial Belenes Norte, Zapopan, Jalisco C.P. 45145</li>
            <li><strong>Email:</strong> contacto@conjuntosantander.com</li>
            <li><strong>Teléfono:</strong> (33) 1234 5678</li>
          </ul>

          <br />

          <h4>10. CONSENTIMIENTO</h4>
          <p>
            Al utilizar nuestros servicios y proporcionar su información personal, 
            usted acepta los términos de esta Declaración de Privacidad.
          </p>

          <br /><br />

          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '5px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0', fontWeight: 'bold' }}>
              © 2025 Conjunto Santander de Artes Escénicas. Todos los derechos reservados.
            </p>
          </div>
        </div>

        <br /><br />
      </div>
      <Footer />
    </>
  );
}

export default DeclaracionPrivacidad;
