import React, { useState } from "react"; // Importamos useState
import '../navBar.css';
import logoGrande from '../imagenes/logo.png'; 
import expresionesLogo from '../imagenes/expresiones.png';
import { Link, useNavigate } from "react-router-dom";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import axios from 'axios';

function NavBar() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const navigate = useNavigate();
  
  // Estado para controlar la animación del botón en el NavBar
  const [verificando, setVerificando] = useState(false);

  // --- Funciones de Limpieza y Navegación ---
  const limpiarDatosFormulario = () => {
    localStorage.removeItem('paso1Data');
    localStorage.removeItem('paso2Data');
    localStorage.removeItem('paso3Data');
    localStorage.removeItem('persistencia');
    console.log("Datos del formulario limpiados.");
  };

  const handleSafeNavigation = (e, rutaDestino) => {
    e.preventDefault(); 
    const estaEditando = localStorage.getItem('persistencia') === 'true';

    if (estaEditando) {
      const confirmar = window.confirm("Tienes una solicitud en proceso. Si sales ahora, perderás todos los datos ingresados. ¿Estás seguro de que quieres salir?");
      if (confirmar) {
        limpiarDatosFormulario();
        navigate(rutaDestino);
      }
    } else {
      navigate(rutaDestino);
    }
  };

  const handleCaptcha = async (e) => {
    e.preventDefault();

    // Evitar doble clic si ya está verificando
    if (verificando) return;

    const estaEditando = localStorage.getItem('persistencia') === 'true';
    if (estaEditando) {
      const confirmar = window.confirm("Ya tienes una solicitud en proceso. ¿Deseas reiniciarla? Se perderán los datos actuales.");
      if (!confirmar) return; 
      limpiarDatosFormulario();
    }

    if (!executeRecaptcha) {
      console.log("Recaptcha no listo");
      return;
    }
  
    // 1. Activamos la animación en el botón
    setVerificando(true);

    try {
      const token = await executeRecaptcha('solicitud_espacios_click');
      const res = await axios.post('http://localhost:5000/verificar-captcha', {token}); 
      
      if (res.data.success && res.data.score > 0.5) {
        navigate('/solicitud-espacios');
      } else {
        alert("Detectamos tráfico inusual. Por favor intenta más tarde.");
      }
    } catch (error) {
      console.error("Error al verificar captcha", error);
      alert("Error de conexión al verificar seguridad.");
    } finally {
      // 2. Desactivamos la animación pase lo que pase
      setVerificando(false);
    }
  }

  return (
    <>
      <header>
        <div className="announcement-banner">
          <p>HORARIO DE TAQUILLA: De lunes a viernes de 10:00 a 20:00 h...</p>
        </div>

        <div className="logo-title">
          <Link to="/" onClick={(e) => handleSafeNavigation(e, '/')}>
            <img src={logoGrande} alt="Logo Conjunto Santander" className="logo-grande" />
          </Link>
        </div>

        <nav>
          <ul>
            <li><Link to="/" onClick={(e) => handleSafeNavigation(e, '/')}>CARTELERA</Link></li>
            <li><Link to="/el-recinto" onClick={(e) => handleSafeNavigation(e, '/el-recinto')}>EL RECINTO</Link></li>
            <li><Link to="/vinculacion-educativa" onClick={(e) => handleSafeNavigation(e, '/vinculacion-educativa')}>VINCULACIÓN EDUCATIVA</Link></li>
            <li><Link to="/alquilar-comerciales" onClick={(e) => handleSafeNavigation(e, '/alquilar-comerciales')}>ALQUILAR COMERCIALES</Link></li>
            <li><Link to="/contacto" onClick={(e) => handleSafeNavigation(e, '/contacto')}>CONTACTO</Link></li>
            
            {/* --- ENLACE PROTEGIDO CON ANIMACIÓN --- */}
            <li> 
                <Link 
                    to="/solicitud-espacios" 
                    onClick={handleCaptcha} 
                    className="nav-link-protected"
                    style={{
                      cursor: verificando ? 'wait' : 'pointer', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      opacity: verificando ? 0.7 : 1, // Efecto visual de "ocupado"
                      transition: 'opacity 0.2s'
                    }}
                    title={verificando ? "Verificando seguridad..." : "Acceso protegido"}
                >
                    {verificando ? (
                      <>
                        VERIFICANDO...
                        {/* Usamos fa-spinner fa-spin para rotar. Si no tienes font-awesome actualizado, fa-circle-o-notch también sirve */}
                        <i className="fa fa-spinner fa-spin" style={{ fontSize: '14px' }}></i>
                      </>
                    ) : (
                      <>
                        SOLICITUD DE ESPACIOS
                        <i className="fa fa-lock" style={{ fontSize: '12px', opacity: 0.7 }}></i>
                      </>
                    )}
                </Link>
            </li>
            {/* -------------------------------------- */}
          </ul>
          <div className="expresiones-image">
            <img src={expresionesLogo} alt="EXPRESIONES ALICE 2025" />
          </div>
        </nav>

        <div className="search-icon">
          <i className="fa fa-search"></i>
        </div>
      </header>

      <div className="red-divider"></div>
    </>
  );
}

export default NavBar;