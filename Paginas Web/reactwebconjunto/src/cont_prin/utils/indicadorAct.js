import React from 'react';
import './estilosCargando.css'; // Importamos los estilos

const LoadingModal = ({ isLoading }) => {
  // Si no está cargando, no mostramos nada (retorna null)
  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        {/* El círculo giratorio */}
        <div className="spinner"></div>
        
        {/* El texto */}
        <h3 className="loading-title">Procesando Solicitud</h3>
        <p className="loading-text">Guardando datos en la base de datos...</p>
        
        <small className="loading-warning">
          Por favor espera y no cierres esta ventana.
        </small>
      </div>
    </div>
  );
};

export default LoadingModal;