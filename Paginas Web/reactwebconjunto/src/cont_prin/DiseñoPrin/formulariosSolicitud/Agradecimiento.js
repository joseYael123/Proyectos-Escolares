import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './formulario.css';
import Footer from '../Footer/Footer';

function Agradecimiento() {
  const navigate = useNavigate();

  useEffect(() => {
    // Limpiar todos los datos del localStorage
    localStorage.removeItem('paso1Data');
    localStorage.removeItem('paso2Data');
    localStorage.removeItem('paso3Data');
  }, []);

  return (
    <>
      <div className="container" style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div className="bg"></div>
        <div className="bg bg2"></div>
        <div className="bg bg3"></div>

        {/* Icono de éxito */}
        <div style={{ fontSize: '80px', color: '#28a745', marginBottom: '30px' }}>
          ✓
        </div>

        {/* Mensaje principal */}
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>
          ¡Gracias por elegirnos!
        </h1>

        <h3 style={{ fontSize: '24px', marginBottom: '30px', color: '#555' }}>
          Conjunto Santander
        </h3>

        {/* Mensaje de confirmación */}
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#666', marginBottom: '20px' }}>
            Hemos recibido tu solicitud de espacio correctamente.
          </p>
          
          <p style={{ fontSize: '18px', lineHeight: '1.6', color: '#666', marginBottom: '30px' }}>
            Nuestro equipo revisará tu solicitud y te enviaremos una respuesta a tu correo electrónico 
            en las próximas <strong>24 a 48 horas</strong>.
          </p>

          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '8px',
            marginBottom: '30px'
          }}>
            <p style={{ fontSize: '16px', color: '#555', margin: '0' }}>
              📧 Revisa tu bandeja de entrada y carpeta de spam
            </p>
          </div>

          <p style={{ fontSize: '16px', color: '#888', marginBottom: '40px' }}>
            Si tienes alguna duda o consulta, no dudes en contactarnos.
          </p>

          {/* Botón para volver al inicio */}
          <button 
            onClick={() => navigate('/')}
            className="btn btn-lg"
            style={{ 
              backgroundColor: '#333', 
              color: '#fff', 
              border: 'none',
              padding: '12px 40px',
              fontSize: '18px',
              fontWeight: 'bold',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Volver al inicio
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Agradecimiento;
