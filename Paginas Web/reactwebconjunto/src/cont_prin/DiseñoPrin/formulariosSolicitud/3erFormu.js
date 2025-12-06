import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import './formulario.css';
import Footer from '../Footer/Footer';

function TercerFormulario() {
  const [validado, setValidado] = useState(false);
  const [cantidadVehiculos, setCantidadVehiculos] = useState(0);
  const [vehiculos, setVehiculos] = useState([]);
  const [aceptaTerminos, setAceptaTerminos] = useState(false);

  const navigate = useNavigate();

  const handleCantidadChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    setCantidadVehiculos(count);
    
    // Crear array de vehículos con la cantidad especificada
    const nuevosVehiculos = [];
    for (let i = 0; i < count; i++) {
      nuevosVehiculos.push({
        tipo: "",
        placa: ""
      });
    }
    setVehiculos(nuevosVehiculos);
  };

  const handleVehiculoChange = (index, campo, valor) => {
    const nuevosVehiculos = [...vehiculos];
    nuevosVehiculos[index][campo] = valor;
    setVehiculos(nuevosVehiculos);
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
    
    // Guardar datos del paso 3
    const paso3Data = {
      cantidadVehiculos,
      vehiculos,
      aceptaTerminos
    };
    
    localStorage.setItem('paso3Data', JSON.stringify(paso3Data));
    
    // Navegar a la página de confirmación
    navigate('/solicitud-espacios-confirmacion');
  };

  return (
    <>
      <br />
      <div className="container">
        {/* Botón de regreso */}
        <button 
          type="button"
          onClick={() => navigate('/solicitud-espacios-paso2')}
          className="btn mb-3"
          style={{ 
            backgroundColor: 'transparent', 
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '0',
            marginBottom: '10px'
          }}
          title="Regresar al paso anterior"
        >
          ← Regresar
        </button>

        <form 
          onSubmit={validar} 
          name="formu3" 
          className={`needs-validation ${validado ? 'was-validated' : ''}`} 
          noValidate
        >
          <h2>¡Gracias por tu interés en el Conjunto Santander!</h2>
          <br />

          {/* Cantidad de vehículos */}
          <div className="form-group mb-3">
            <label htmlFor="cantidadVehiculos">Cantidad de vehículos</label>
            <input 
              type="number" 
              className="form-control" 
              id="cantidadVehiculos" 
              name="cantidad_vehiculos" 
              min="1" 
              max="5"
              placeholder="Número de vehículos que ingresarán" 
              value={cantidadVehiculos || ''}
              onChange={handleCantidadChange}
              required 
            />
            <div className="invalid-feedback">Ingresa una cantidad válida (1 o más).</div>
            <small className="form-text text-muted">Cantidad máxima de 5 vehículos</small>
          </div>

          {/* Contenedor dinámico para campos de vehículos */}
          {cantidadVehiculos > 0 && (
            <div id="vehiculosContainer">
              {vehiculos.map((vehiculo, index) => (
                <div key={index} className="form-group mb-4" style={{ 
                  padding: '15px', 
                  border: '1px solid #ddd', 
                  borderRadius: '5px',
                  marginBottom: '15px'
                }}>
                  <h5>Vehículo {index + 1}</h5>
                  
                  {/* Tipo de vehículo */}
                  <label htmlFor={`vehiculos_tipo_${index}`}>Tipo de vehículo</label>
                  <select 
                    className="form-control mb-2" 
                    id={`vehiculos_tipo_${index}`} 
                    name={`vehiculos[${index}][tipo]`}
                    value={vehiculo.tipo}
                    onChange={(e) => handleVehiculoChange(index, 'tipo', e.target.value)}
                    required
                  >
                    <option value="" disabled>Seleccione tipo de vehículo</option>
                    <option value="bus">Camión/bus</option>
                    <option value="camioneta">Camioneta</option>
                    <option value="sedan">Automóvil</option>
                  </select>
                  <div className="invalid-feedback">Selecciona el tipo de vehículo.</div>
                  
                  {/* Placa del vehículo */}
                  <label htmlFor={`vehiculos_placa_${index}`}>Ingrese la placa del vehículo</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id={`vehiculos_placa_${index}`} 
                    name={`vehiculos[${index}][placa]`}
                    placeholder="Ej: ABC-1234" 
                    value={vehiculo.placa}
                    onChange={(e) => handleVehiculoChange(index, 'placa', e.target.value.toUpperCase())}
                    required 
                  />
                  <div className="invalid-feedback">Ingresa la placa del vehículo.</div>
                </div>
              ))}
            </div>
          )}

          {/* Términos y privacidad */}
          <div className="form-check mb-3">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="aceptaTerminos" 
              name="aceptaTerminos"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
              required 
            />
            <label className="form-check-label" htmlFor="aceptaTerminos">
              Usted acepta nuestros términos de servicio y declaración de privacidad.
            </label>
            <br />
            <small id="checkboxHelp" className="form-text text-muted">
              Acá puedes ver nuestras políticas{' '}
              <Link to="/declaracion-privacidad" style={{ color: '#000', textDecoration: 'underline' }}>
                Declaración de privacidad
              </Link>
            </small>
            <div className="valid-feedback">¡No te arrepentirás!</div>
            <div className="invalid-feedback">¡No sabes de lo que te pierdes!</div>
          </div>

          <button 
            type="submit" 
            className="btn"
            style={{ backgroundColor: '#f2f2f2', color: '#000', border: '1px solid #ccc' }}
          >
            Continuar
          </button>
        </form>

        <br /><br /><br />
      </div>
      <Footer />
    </>
  );
}

export default TercerFormulario;
