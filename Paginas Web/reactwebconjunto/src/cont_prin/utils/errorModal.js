import React from 'react';
import './modalError.css';

const ErrorModal = ({ isOpen, onClose, message }) => {
  // Si isOpen es falso, el modal no se renderiza
  if (!isOpen) return null;

  return (
    <div className="error-overlay">
      <div className="error-content">
        {/* Círculo rojo con la X */}
        <div className="error-icon-circle">
          <span>✕</span> 
        </div>
        
        <h3 className="error-title">¡Error!</h3>
        
        <p className="error-message">
          {message || "Ocurrió un error al procesar su solicitud. Por favor intente más tarde."}
        </p>

        <button onClick={onClose} className="btn-error-close">
          Cerrar
        </button>
      </div>
    </div>
  );
};

export default ErrorModal;