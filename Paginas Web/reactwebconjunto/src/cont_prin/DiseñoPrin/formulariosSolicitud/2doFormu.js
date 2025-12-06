import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './formulario.css'; 
import moment from 'moment';
import Footer from '../Footer/Footer'; 

const API_URL = 'http://localhost:5000/pg/disponibilidad'; 

// Helper para formatear hora (de ISO a HH:MM) para la vista
const obtenerHoraLegible = (fechaISO) => {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleTimeString('es-MX', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
};

function SegundoFormulario() {
  const [validado, setValidado] = useState(false);
  const [mostrarExtra, setMostrarExtra] = useState(false);
  const [fechaActiva, setFechaActiva] = useState(new Date());
  const [resumenMes, setResumenMes] = useState({});
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [disponibilidadSalas, setDisponibilidadSalas] = useState([]);
  const [salaSeleccionada, setSalaSeleccionada] = useState(null); 
  
  const navigate = useNavigate();

  const validar = (event) => {
    event.preventDefault();
    const formu = event.currentTarget;
    
    if(formu.checkValidity() === false){
        event.stopPropagation();
        setValidado(true);
        return;
    }
    setValidado(true);
    
    const formData = new FormData(formu);
    
    // VALIDACIÓN
    if (!diaSeleccionado) {
        alert("Por favor selecciona una fecha en el calendario");
        return;
    }
    if (!salaSeleccionada) {
        alert("Por favor selecciona una sala");
        return;
    }

    // --- ESTRATEGIA DE HORARIO PLACEHOLDER ---
    // Asignamos horas por defecto. El admin ajustará esto a la hora real.
    const horaInicioStr = "09:00"; 
    const horaFinStr = "23:00";    
    
    // Construimos las fechas ISO para Postgres
    const fechaBase = moment(diaSeleccionado).format('YYYY-MM-DD'); 
    const periodoStartISO = moment(`${fechaBase}T${horaInicioStr}:00`).toISOString();
    const periodoEndISO = moment(`${fechaBase}T${horaFinStr}:00`).toISOString();

    // Calculamos intervalos de montaje/desmontaje
    const horasExtraMontaje = mostrarExtra ? (parseInt(formData.get('tiempoExtraMontaje')) || 0) : 0;
    const horasExtraDesmontaje = mostrarExtra ? (parseInt(formData.get('tiempoExtraDesmontaje')) || 0) : 0;

    const totalMontaje = 2 + horasExtraMontaje;
    const totalDesmontaje = 2 + horasExtraDesmontaje;

    // Postgres INTERVAL format: "HH:mm:ss"
    const duracionMontajeStr = `${totalMontaje.toString().padStart(2, '0')}:00:00`;
    const duracionDesmontajeStr = `${totalDesmontaje.toString().padStart(2, '0')}:00:00`;

    const paso2Data = {
      nombreEvento: formData.get('nombre_evento'),
      descripcion: formData.get('descripcion'),
      categoriaEvento: formData.get('categoria_evento'),
      tipoAdmision: formData.get('tipo_de_admision'),
      salaSeleccionada: salaSeleccionada?.salaId,
      
      // Datos listos para BD
      periodoStart: periodoStartISO,       
      periodoEnd: periodoEndISO,           
      duracionMontaje: duracionMontajeStr, 
      duracionDesmontaje: duracionDesmontajeStr, 
      
      // Datos visuales
      fechaTexto: moment(diaSeleccionado).format('DD/MM/YYYY'),
      tiempoExtraMontaje: horasExtraMontaje,
      tiempoExtraDesmontaje: horasExtraDesmontaje,
      rawHoraInicio: horaInicioStr,
      rawHoraFin: horaFinStr
    };
    
    localStorage.setItem('paso2Data', JSON.stringify(paso2Data));
    
    navigate('/solicitud-espacios-paso3'); 
  }

  const tiempoExtra = (event) =>{
    setMostrarExtra(event.target.checked);
  }

  // --- EFECTO 1: Cargar Resumen del Mes ---
  useEffect(() =>{
    const mes = fechaActiva.getMonth() + 1; 
    const anio = fechaActiva.getFullYear();
    fetch(`${API_URL}/resumen-mes?mes=${mes}&anio=${anio}`)
      .then(res => res.json())
      .then(datos => {
        if (datos && datos.resumen) setResumenMes(datos.resumen);
        else setResumenMes({});
      })
      .catch(err => console.error("Error cargando resumen:", err));
  }, [fechaActiva]); 

  // --- EFECTO 2: Cargar Detalle del Día ---
  useEffect(() => {
    if (!diaSeleccionado) {
      setDisponibilidadSalas([]); 
      setSalaSeleccionada(null); 
      return;
    }
    
    const fechaISO = diaSeleccionado.toISOString().split('T')[0];
    
    fetch(`${API_URL}/detalle-dia?fecha=${fechaISO}`)
      .then(res => res.json())
      .then(datos => {
        // Desenvolvemos el objeto 'resultado' que envía tu backend actualizado
        if (datos && Array.isArray(datos.resultado)) {
            setDisponibilidadSalas(datos.resultado);
        } else {
            setDisponibilidadSalas([]);
        }
      })
      .catch(err => {
        console.error("Error cargando detalle:", err);
        setDisponibilidadSalas([]);
      });
  }, [diaSeleccionado]); 

  const alCambiarMes = (props) => setFechaActiva(props.activeStartDate);
  
  const alSeleccionarDia = (fecha) => {
    setDiaSeleccionado(fecha);
    setSalaSeleccionada(null);
  };
  
  // Colores del calendario según disponibilidad
  const colorearDias = ({ date, view }) => {
    if (view === 'month') {
      const fechaISO = date.toISOString().split('T')[0];
      const estado = resumenMes[fechaISO];

      if (estado === 'lleno') return 'dia-lleno';      // Rojo
      if (estado === 'parcial') return 'dia-parcial';  // Naranja/Amarillo (Definir en CSS)
      // Disponible no lleva clase (se ve normal)
    }
  };

  return(
    <>
      <br />
      <div className="container">
        <form 
          onSubmit={validar} 
          name="nameForm2" 
          className={`needs-validation ${validado ? 'was-validated' : ''}`} 
          noValidate
        >
          <h2>¡Gracias por tu interés en el Conjunto Santander!</h2>
          <br />

          {/* Campos de Texto */}
          <div className="form-group mb-3">
            <label htmlFor="nombreEvento">Nombre del evento</label>
            <input type="text" className="form-control" id="nombreEvento" name="nombre_evento" required />
          </div>
          
          <div className="form-group mb-3">
            <label htmlFor="descripcionEvento">Descríbenos de qué tratará tu evento</label>
            <textarea className="form-control" id="descripcionEvento" rows="4" name="descripcion" required></textarea>
          </div>
          
          <div className="form-group mb-3">
            <label htmlFor="categoriaEvento">Selecciona la categoría</label>
            <select className="form-control" id="categoriaEvento" name="categoria_evento" required>
              <option value="">Selecciona una categoría</option>
              <option value="Concierto">Concierto</option>
              <option value="Teatro">Teatro</option>
              <option value="Danza">Danza</option>
              <option value="Conferencia">Conferencia</option>
            </select>
          </div>
          
          <div className="form-group mb-3">
            <label htmlFor="tipoAdmision">Tipo de admisión</label>
            <select className="form-control" id="tipoAdmision" name="tipo_de_admision" required>
              <option value="">Seleccione una opción</option>
              <option value="Público">Público</option>
              <option value="Privado">Privado</option>
              <option value="Invitación">Por invitación</option>
            </select>
          </div>

          {/* Calendario */}
          <div className="form-group mb-3">
            <label>Selecciona la fecha deseada</label>
            <div className="d-flex align-items-center mb-2 text-muted" style={{fontSize: '0.85rem'}}>
                <span className="badge bg-success rounded-circle p-1 me-1"> </span> Libre &nbsp;
                <span className="badge bg-warning text-dark rounded-circle p-1 me-1"> </span> Parcial &nbsp;
                <span className="badge bg-danger rounded-circle p-1 me-1"> </span> Lleno
            </div>
            <Calendar
              onChange={alSeleccionarDia}
              value={diaSeleccionado}
              onActiveStartDateChange={alCambiarMes}
              tileClassName={colorearDias}
              minDate={new Date()} 
            />
            <input 
              type="hidden" 
              value={diaSeleccionado ? diaSeleccionado.toISOString() : ""} 
              required 
            />
            <div className="invalid-feedback">Por favor selecciona una fecha.</div>
          </div>

          {/* Selector de Salas con Visualización de Ocupación */}
          {diaSeleccionado && disponibilidadSalas.length > 0 && (
            <div className="form-group mb-3">
              <label>Salas disponibles para el {diaSeleccionado.toLocaleDateString()}</label>
              <div className="sala-selector-list">
                {disponibilidadSalas.map(sala => (
                  <div 
                    key={sala.salaId} 
                    className={`form-check sala-card ${sala.estado === 'lleno' ? 'sala-llena' : ''}`}
                    style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}
                  >
                    <div className="d-flex flex-column">
                        <div className="d-flex align-items-center">
                            <input 
                              className="form-check-input mt-0" 
                              type="radio" 
                              name="salaEvento" 
                              id={`sala-${sala.salaId}`}
                              value={sala.salaId}
                              onChange={() => setSalaSeleccionada(sala)} 
                              disabled={sala.estado === 'lleno'}
                              required 
                              style={{ marginRight: '10px' }}
                            />
                            
                            <label className="form-check-label w-100" htmlFor={`sala-${sala.salaId}`} style={{cursor: 'pointer'}}>
                              <div className="d-flex justify-content-between flex-wrap align-items-center">
                                <span><strong>{sala.nombreSala}</strong> | Cap: {sala.capacidad}</span>
                                
                                <span className="ms-2">
                                    {sala.estado === 'lleno' && <span className="badge bg-danger">Ocupado</span>}
                                    {sala.estado === 'parcialmente_ocupado' && <span className="badge bg-warning text-dark">Parcial</span>}
                                    {sala.estado === 'libre' && <span className="badge bg-success">Libre</span>}
                                </span>
                              </div>
                            </label>
                        </div>

                        {/* Mostrar lista de horarios ocupados si es parcial */}
                        {sala.estado === 'parcialmente_ocupado' && sala.bloquesOcupados.length > 0 && (
                             <div className="ms-4 mt-2 p-2 bg-light rounded" style={{ fontSize: '0.85em', borderLeft: '3px solid #ffc107' }}>
                                <strong className="text-muted">Horarios ocupados (Confirmados):</strong>
                                <ul className="mb-0 ps-3 mt-1">
                                    {sala.bloquesOcupados.map((bloque, idx) => (
                                    <li key={idx} className="text-danger">
                                        {obtenerHoraLegible(bloque.inicio)} - {obtenerHoraLegible(bloque.fin)}
                                    </li>
                                    ))}
                                </ul>
                             </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tiempo Extra */}
          <div className="form-group mb-3">
            <div className="custom-control custom-checkbox">
              <input type="checkbox" className="custom-control-input" id="customControlTiempoExtra" onChange={tiempoExtra} />
              <label className="custom-control-label" htmlFor="customControlTiempoExtra">Quiero tiempo extra</label>
            </div>
            <small className="form-text text-muted">
               Tu evento incluye 2 horas de montaje y desmontaje. Si necesitas más, márcalo.
            </small>
          </div>
          
          {mostrarExtra && (
            <div id="camposTiempoExtra">
              <div className="form-group mb-3">
                <label>Horas extra montaje</label>
                <input type="number" className="form-control" name="tiempoExtraMontaje" min="1" required />
              </div>
              <div className="form-group mb-3">
                <label>Horas extra desmontaje</label>
                <input type="number" className="form-control" name="tiempoExtraDesmontaje" min="1" required />
              </div>
            </div>
          )}
     
         <button type="submit" className="btn btn-primary">Siguiente</button>
        </form>
        <br /><br />
      </div>
      <Footer />
    </>
  );
}

export default SegundoFormulario;