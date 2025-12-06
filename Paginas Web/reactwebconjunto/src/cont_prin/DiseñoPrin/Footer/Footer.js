import React from 'react';
import './Footer.css';

function Footer() {
  return (
    <footer className="footer-santander">
      <div className="footer-content">
        <div className="footer-section">
          <h4>DOMICILIO</h4>
          <p>Av. Periférico Norte No. 1695</p>
          <p>Col. Parque Industrial Belenes Norte</p>
          <p>Zapopan, Jalisco</p>
          <p>C.P. 45145</p>
          <p>contacto@conjuntosantander.com</p>
        </div>

        <div className="footer-section">
          <h4>INFORMACIÓN</h4>
          <p>Conjunto Santander de Artes Escénicas</p>
          <p>Espacio cultural dedicado a la difusión de las artes escénicas</p>
          <p>Teatro, danza, música y más</p>
          <p>Capacidad para eventos de hasta 3,000 personas</p>
        </div>

        <div className="footer-section">
          <h4>SÍGUENOS</h4>
          <div className="social-icons">
            <a href="https://www.facebook.com/ConjuntoSantander" target="_blank" rel="noopener noreferrer" className="social-icon facebook" aria-label="Facebook">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://www.instagram.com/conjuntosantander/" target="_blank" rel="noopener noreferrer" className="social-icon instagram" aria-label="Instagram">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://www.youtube.com/channel/UC5MTKq5ZLEeaHlxZ60lFQ6Q/videos" target="_blank" rel="noopener noreferrer" className="social-icon youtube" aria-label="YouTube">
              <i className="fab fa-youtube"></i>
            </a>
            <a href="https://x.com/conjsantander" target="_blank" rel="noopener noreferrer" className="social-icon twitter" aria-label="Twitter">
              <i className="fab fa-twitter"></i>
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h4>HORARIO DE TAQUILLAS</h4>
          <p>Lunes a viernes 10:00 a 20:00 h</p>
          <p>Sábados 11:00 a 19:00 h</p>
          <p>Domingos 11:00 a 17:00 h</p>
          <p className="note">En taquillas no hay comisión extra por cargo por boleto.</p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2025 Todos los derechos reservados Conjunto Santander</p>
      </div>

      {/* Botón flotante para volver arriba */}
      <button 
        className="scroll-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Volver arriba"
      >
        ↑
      </button>
    </footer>
  );
}

export default Footer;
