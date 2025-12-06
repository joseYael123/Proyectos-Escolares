import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import './formulario.css';
import Footer from '../Footer/Footer';

function PrimerFormulario() {
  const [validado, setValidado] = useState(false);
  const [formData, setFormData] = useState({
    nombreResponsable: "",
    apellidoPaterno: "",
    apellidoMaterno: "",
    telefono: "",
    correoElectronico: "",
    paginaEvento: ""
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validar = (event) => {
    event.preventDefault();
    const formu = event.currentTarget;
    
    if (formu.checkValidity() === false) {
      event.stopPropagation();
      setValidado(true);
      return;
    }

    setValidado(true);
    
    
    // Guardar datos en localStorage para usarlos en el segundo formulario
    localStorage.setItem('paso1Data', JSON.stringify(formData));
    localStorage.setItem('persistencia', 'true');  
    
    // Navegar al segundo formulario
    navigate('/solicitud-espacios-paso2');
  };

  return (
    <>
      <br />
      <div className="container">
        <form 
          onSubmit={validar} 
          name="nameForm" 
          className={`needs-validation ${validado ? 'was-validated' : ''}`} 
          noValidate
        >
          <h2>¡Gracias por tu interés en el Conjunto Santander!</h2>
          <br />

          <div className="bg"></div>
          <div className="bg bg2"></div>
          <div className="bg bg3"></div>

          {/* Nombre */}
          <div className="mb-3">
            <label htmlFor="nombreResponsable" className="form-label">
              Nombre(s) del responsable
            </label>
            <input 
              type="text" 
              className="form-control" 
              id="nombreResponsable" 
              name="nombreResponsable" 
              placeholder="Texto" 
              value={formData.nombreResponsable}
              onChange={handleChange}
              required 
              minLength="1"
            />
            <div className="valid-feedback">Se ve bien!</div>
            <div className="invalid-feedback">
              Por favor ingresa al menos un carácter en el nombre.
            </div>
          </div>

          {/* Apellido paterno */}
          <div className="mb-3">
            <label htmlFor="apellidoPaterno" className="form-label">
              Apellido Paterno
            </label>
            <input 
              type="text" 
              className="form-control" 
              id="apellidoPaterno" 
              name="apellidoPaterno" 
              placeholder="Texto" 
              value={formData.apellidoPaterno}
              onChange={handleChange}
              required 
              minLength="1"
            />
            <div className="valid-feedback">Se ve bien!</div>
            <div className="invalid-feedback">
              Por favor ingresa al menos un carácter en el apellido paterno.
            </div>
          </div>

          {/* Apellido materno */}
          <div className="mb-3">
            <label htmlFor="apellidoMaterno" className="form-label">
              Apellido Materno
            </label>
            <input 
              type="text" 
              className="form-control" 
              id="apellidoMaterno" 
              name="apellidoMaterno" 
              placeholder="Texto" 
              value={formData.apellidoMaterno}
              onChange={handleChange}
              required 
              minLength="1"
            />
            <div className="valid-feedback">Se ve bien!</div>
            <div className="invalid-feedback">
              Por favor ingresa al menos un carácter en el apellido materno.
            </div>
          </div>

          {/* Teléfono */}
          <div className="mb-3">
            <label htmlFor="telefono" className="form-label">
              Número de teléfono
            </label>
            <input
              type="text"
              className="form-control"
              id="telefono"
              name="telefono"
              pattern="[0-9]{10}"
              maxLength="10"
              value={formData.telefono}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                setFormData({ ...formData, telefono: value });
              }}
              placeholder="10 dígitos"
              required
            />
            <div className="valid-feedback">Se ve bien!</div>
            <div className="invalid-feedback">
              Debe ser exactamente 10 dígitos numéricos.
            </div>
          </div>

          {/* Correo electrónico */}
          <div className="mb-3">
            <label htmlFor="correoElectronico" className="form-label">
              Correo electrónico
            </label>
            <input
              type="email"
              className="form-control"
              id="correoElectronico"
              name="correoElectronico"
              placeholder="Correo electrónico"
              value={formData.correoElectronico}
              onChange={handleChange}
              required
              pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
            />
            <div className="valid-feedback">¡Buen Email!</div>
            <div className="invalid-feedback">
              Por favor ingresa un correo válido con @ y dominio (ejemplo@dominio.com).
            </div>
          </div>

          {/* Página de evento */}
          <div className="mb-3">
            <label htmlFor="paginaEvento" className="form-label">
              Página de tu evento (Opcional)
            </label>
            <input
              type="url"
              className="form-control"
              id="paginaEvento"
              name="paginaEvento"
              placeholder="Proporcionanos el link de tu evento"
              value={formData.paginaEvento}
              onChange={handleChange}
            />
          </div>

          {/* Botón */}
          <button 
            type="submit" 
            className="btn"
            style={{ backgroundColor: '#f2f2f2', color: '#000', border: '1px solid #ccc' }}
          >
            Siguiente
          </button>
        </form>

        <br /><br /><br />
      </div>
      <Footer />
    </>
  );
}

export default PrimerFormulario;
