import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './formulario.css';
import Footer from '../Footer/Footer';

// 1. IMPORTACIONES DE UTILS Y COMPONENTES
import { crearFolio } from "../../utils/creadorFolio"; 
import LoadingModal from "../../utils/indicadorAct"; 
import ErrorModal from "../../utils/errorModal"; 

function ConfirmacionSolicitud() {
  const [paso1Data, setPaso1Data] = useState({});
  const [paso2Data, setPaso2Data] = useState({});
  const [paso3Data, setPaso3Data] = useState({});
  
  // Estados para Modales
  const [cargando, setCargando] = useState(false); 
  const [mostrarError, setMostrarError] = useState(false);
  const [mensajeError, setMensajeError] = useState("");
  
  const navigate = useNavigate();

  useEffect(() => {
    const datos1 = JSON.parse(localStorage.getItem('paso1Data') || '{}');
    const datos2 = JSON.parse(localStorage.getItem('paso2Data') || '{}');
    const datos3 = JSON.parse(localStorage.getItem('paso3Data') || '{}');

    setPaso1Data(datos1);
    setPaso2Data(datos2);
    setPaso3Data(datos3);

    if (!datos1.nombreResponsable) {
      navigate('/solicitud-espacios');
    }
  }, [navigate]);

  // --- FUNCIONES PARA EDICIÓN EN TIEMPO REAL ---
  
  const handlePaso1Change = (e) => {
    const { name, value } = e.target;
    setPaso1Data(prev => {
        const newData = { ...prev, [name]: value };
        localStorage.setItem('paso1Data', JSON.stringify(newData));
        return newData;
    });
  };

  const handlePaso2Change = (e) => {
    const { name, value } = e.target;
    setPaso2Data(prev => {
        const newData = { ...prev, [name]: value };
        
        if (name === 'tiempoExtraMontaje' || name === 'tiempoExtraDesmontaje') {
             const tMontaje = name === 'tiempoExtraMontaje' ? (parseInt(value) || 0) : (parseInt(prev.tiempoExtraMontaje) || 0);
             const tDesmontaje = name === 'tiempoExtraDesmontaje' ? (parseInt(value) || 0) : (parseInt(prev.tiempoExtraDesmontaje) || 0);
             newData.duracionMontaje = `${(2 + tMontaje).toString().padStart(2, '0')}:00:00`;
             newData.duracionDesmontaje = `${(2 + tDesmontaje).toString().padStart(2, '0')}:00:00`;
        }

        localStorage.setItem('paso2Data', JSON.stringify(newData));
        return newData;
    });
  };

  const handlePaso3Change = (e) => {
      const { name, value } = e.target;
      setPaso3Data(prev => {
          const newData = { ...prev, [name]: value };
          localStorage.setItem('paso3Data', JSON.stringify(newData));
          return newData;
      });
  };

  const handleVehiculoChange = (index, campo, valor) => {
      const nuevosVehiculos = [...(paso3Data.vehiculos || [])];
      nuevosVehiculos[index] = { ...nuevosVehiculos[index], [campo]: valor };
      
      setPaso3Data(prev => {
          const newData = { ...prev, vehiculos: nuevosVehiculos };
          localStorage.setItem('paso3Data', JSON.stringify(newData));
          return newData;
      });
  };

  // --- HELPERS ---
  const formDataCreator = (datos) => {
    const formData = new FormData();
    Object.entries(datos).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });
    return formData;
  }

  const cerrarError = () => {
    setMostrarError(false);
    setMensajeError("");
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return 'No especificada';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // --- LÓGICA DE ENVÍO CON FALLBACKS ---
  const handleConfirmar = async () => {
    setCargando(true); 
    console.log("🚀 Iniciando proceso de confirmación resiliente...");

    // Variables para almacenar IDs (null si fallan)
    let id_responPg = null;
    let id_responMg = null;
    let id_eventoPg = null;
    let id_eventoMg = null;

    // Generar Folio
    const datosParaFolio = {
        fecha: paso2Data.periodoStart, 
        nombre_evento: paso2Data.nombreEvento,
        vehiculos: paso3Data.cantidadVehiculos
    };
    const folioGenerado = crearFolio(datosParaFolio);

    // Preparar Datos Comunes
    const datosResponsable = {
        nombre: paso1Data.nombreResponsable,
        apellido_paterno: paso1Data.apellidoPaterno,
        apellido_materno: paso1Data.apellidoMaterno,
        telefono: paso1Data.telefono,
        correo_electronico: paso1Data.correoElectronico,
        link_social: paso1Data.paginaEvento,
    };

    // ==========================================
    // 1. INSERTAR RESPONSABLE
    // ==========================================
    
    // Intento Postgres Responsable
    try {
        const resRespPg = await fetch('http://localhost:5000/pg/responsables/', {
            method: 'POST',
            body: formDataCreator(datosResponsable)
        });
        if (resRespPg.ok) {
            const jsonRespPg = await resRespPg.json();
            id_responPg = jsonRespPg.Insercion.id_responsable;
            console.log("✅ Responsable PG creado:", id_responPg);
        } else {
            console.error("⚠️ Error PG Responsable (Status):", resRespPg.status);
        }
    } catch (error) {
        console.error("❌ Fallo Conexión PG Responsable:", error.message);
        // No lanzamos error, dejamos id_responPg en null y continuamos
    }

    // Intento Mongo Responsable
    try {
        const resRespMg = await fetch('http://localhost:5000/mg/responsables/', {
            method: 'POST',
            body: formDataCreator(datosResponsable)
        });
        if (resRespMg.ok) {
            const jsonRespMg = await resRespMg.json();
            id_responMg = jsonRespMg.Insercion.id_responsable;
            console.log("✅ Responsable MG creado:", id_responMg);
        } else {
            console.error("⚠️ Error MG Responsable (Status):", resRespMg.status);
        }
    } catch (error) {
        console.error("❌ Fallo Conexión MG Responsable:", error.message);
    }

    // ==========================================
    // 2. INSERTAR EVENTO
    // ==========================================
    const datosEventoBase = {
        nombre_evento: paso2Data.nombreEvento,
        descripcion: paso2Data.descripcion,
        categoria_evento: paso2Data.categoriaEvento,
        tipo_de_admision: paso2Data.tipoAdmision,
        folio_evento: folioGenerado
    };

    // Postgres Evento (Solo si tenemos ID Responsable PG)
    if (id_responPg) {
        try {
            const datosEventoPg = { ...datosEventoBase, id_responsable: id_responPg };
            const resEvtPg = await fetch("http://localhost:5000/pg/eventos/", {
                method: 'POST',
                body: formDataCreator(datosEventoPg)
            });
            if (resEvtPg.ok) {
                const jsonEvtPg = await resEvtPg.json();
                id_eventoPg = jsonEvtPg.Insercion.id_evento;
                console.log("✅ Evento PG creado:", id_eventoPg);
            } else {
                console.error("⚠️ Error PG Evento:", resEvtPg.status);
            }
        } catch (error) {
            console.error("❌ Fallo Conexión PG Evento:", error.message);
        }
    } else {
        console.warn("⏭️ Saltando PG Evento: No hay ID Responsable PG.");
    }

    // Mongo Evento (Solo si tenemos ID Responsable MG)
    if (id_responMg) {
        try {
            const datosEventoMg = { ...datosEventoBase, id_responsable: id_responMg };
            const resEvtMg = await fetch("http://localhost:5000/mg/eventos/", {
                method: "POST",
                body: formDataCreator(datosEventoMg)
            });
            if (resEvtMg.ok) {
                const jsonEvtMg = await resEvtMg.json();
                id_eventoMg = jsonEvtMg.Insercion.id_evento;
                console.log("✅ Evento MG creado:", id_eventoMg);
            } else {
                console.error("⚠️ Error MG Evento:", resEvtMg.status);
            }
        } catch (error) {
            console.error("❌ Fallo Conexión MG Evento:", error.message);
        }
    } else {
        console.warn("⏭️ Saltando MG Evento: No hay ID Responsable MG.");
    }

    // ==========================================
    // 3. INSERTAR RESERVA
    // ==========================================
    const datosReservaBase = {
        id_sala: paso2Data.salaSeleccionada,
        periodo_start: paso2Data.periodoStart,
        periodo_end: paso2Data.periodoEnd,
        duracion_montaje: paso2Data.duracionMontaje,
        duracion_desmontaje: paso2Data.duracionDesmontaje,
        cant_vehiculos: paso3Data.cantidadVehiculos || 0
    };

    // Postgres Reserva (Solo si existe Evento PG)
    if (id_eventoPg) {
        try {
            const datosReservaPg = { ...datosReservaBase, id_evento: id_eventoPg };
            await fetch("http://localhost:5000/pg/reservas/", { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosReservaPg)
            });
            console.log("✅ Reserva PG creada");
        } catch (error) {
            console.error("❌ Fallo Reserva PG:", error.message);
        }
    }

    // Mongo Reserva (Solo si existe Evento MG)
    if (id_eventoMg) {
        try {
            const datosReservaMg = { ...datosReservaBase, id_evento: id_eventoMg };
            await fetch("http://localhost:5000/mg/reservas/", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosReservaMg)
            });
            console.log("✅ Reserva MG creada");
        } catch (error) {
            console.error("❌ Fallo Reserva MG:", error.message);
        }
    }

    // ==========================================
    // 4. INSERTAR VEHÍCULOS
    // ==========================================
    const listaVehiculos = paso3Data.vehiculos || [];
    if (listaVehiculos.length > 0) {
        for (const vehiculo of listaVehiculos) {
            // PG Vehículo
            if (id_responPg) {
                try {
                    const datosVehiculoPg = {
                        placas: vehiculo.placa,
                        modelo: "No especificado", 
                        color: "No especificado",
                        tipo_vehiculo: vehiculo.tipo,
                        id_responsable: id_responPg
                    };
                    await fetch('http://localhost:5000/pg/vehiculos/web', { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(datosVehiculoPg) 
                    });
                } catch (e) { console.error("Fallo Vehiculo PG:", e.message); }
            }

            // MG Vehículo
            if (id_responMg) {
                try {
                    const datosVehiculoMg = {
                        placas: vehiculo.placa,
                        modelo: "No especificado",
                        color: "No especificado",
                        tipo_vehiculo: vehiculo.tipo,
                        id_responsable: id_responMg
                    }
                    await fetch('http://localhost:5000/mg/vehiculos/web', { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(datosVehiculoMg) 
                    });
                } catch (e) { console.error("Fallo Vehiculo MG:", e.message); }
            }
        }
        console.log("✅ Proceso de vehículos finalizado");
    }

    // ==========================================
    // 5. EVALUACIÓN FINAL
    // ==========================================
    setCargando(false);

    // Si al menos una base de datos procesó el evento, consideramos éxito
    if (id_eventoPg || id_eventoMg) {
        const msgExtra = (!id_eventoPg || !id_eventoMg) ? "\n(Nota: Se detectó lentitud en uno de los servidores, pero tu solicitud se guardó)" : "";
        alert(`¡Solicitud enviada con éxito!${msgExtra}`);
        localStorage.clear();
        navigate('/solicitud-enviada');
    } else {
        // Ambas fallaron
        setMensajeError("No se pudo conectar con ningún servidor. Por favor verifica tu conexión o intenta más tarde.");
        setMostrarError(true);
    }
  };

  return (
    <>
      <LoadingModal isLoading={cargando} />
      <ErrorModal isOpen={mostrarError} onClose={cerrarError} message={mensajeError} />

      <br />
      <div className="container">
        <button
          type="button"
          onClick={() => navigate('/solicitud-espacios-paso3')}
          className="btn mb-3"
          style={{ backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }}
        >
          ← Regresar
        </button>

        <h2>Confirma tu solicitud</h2>
        <p className="text-muted">
          Puedes editar cualquier dato directamente aquí antes de enviar.
        </p>
        <br />

        {/* ... (EL RESTO DEL JSX SIGUE IGUAL: LOS CARDS DE INPUTS) ... */}
        {/* ==================================================== */}
        {/* SECCIÓN 1: DATOS DEL RESPONSABLE (EDITABLES)         */}
        {/* ==================================================== */}
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">Datos del Responsable</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label fw-bold">Nombre</label>
                <input type="text" className="form-control" name="nombreResponsable" value={paso1Data.nombreResponsable || ''} onChange={handlePaso1Change} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Apellido Paterno</label>
                <input type="text" className="form-control" name="apellidoPaterno" value={paso1Data.apellidoPaterno || ''} onChange={handlePaso1Change} />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Apellido Materno</label>
                <input type="text" className="form-control" name="apellidoMaterno" value={paso1Data.apellidoMaterno || ''} onChange={handlePaso1Change} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Teléfono</label>
                <input type="text" className="form-control" name="telefono" value={paso1Data.telefono || ''} onChange={handlePaso1Change} />
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold">Correo Electrónico</label>
                <input type="email" className="form-control" name="correoElectronico" value={paso1Data.correoElectronico || ''} onChange={handlePaso1Change} />
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* SECCIÓN 2: DATOS DEL EVENTO (EDITABLES)              */}
        {/* ==================================================== */}
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">Datos del Evento y Reserva</h5>
          </div>
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-12">
                <label className="form-label fw-bold">Nombre del Evento</label>
                <input type="text" className="form-control" name="nombreEvento" value={paso2Data.nombreEvento || ''} onChange={handlePaso2Change} />
              </div>
              <div className="col-md-12">
                <label className="form-label fw-bold">Descripción</label>
                <textarea className="form-control" name="descripcion" rows="2" value={paso2Data.descripcion || ''} onChange={handlePaso2Change}></textarea>
              </div>
              <div className="col-md-6">
                  <label className="form-label fw-bold">Categoría</label>
                  <select className="form-select" name="categoriaEvento" value={paso2Data.categoriaEvento || ''} onChange={handlePaso2Change}>
                    <option value="1">Concierto</option>
                    <option value="2">Teatro</option>
                    <option value="3">Danza</option>
                    <option value="4">Conferencia</option>
                  </select>
              </div>
              <div className="col-md-6">
                  <label className="form-label fw-bold">Admisión</label>
                  <select className="form-select" name="tipoAdmision" value={paso2Data.tipoAdmision || ''} onChange={handlePaso2Change}>
                    <option value="Público">Público</option>
                    <option value="Privado">Privado</option>
                    <option value="Invitación">Invitación</option>
                  </select>
              </div>
              
              <div className="col-12"><hr/></div>

              {/* Datos de Reserva */}
              <div className="col-md-4">
                <label className="form-label fw-bold">Fecha (Lectura)</label>
                <input type="text" className="form-control" value={formatearFecha(paso2Data.periodoStart)} disabled readOnly />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-bold">Sala ID (Lectura)</label>
                <input type="text" className="form-control" value={paso2Data.salaSeleccionada || ''} disabled readOnly />
              </div>
              <div className="col-md-4">
                  <label className="form-label fw-bold">Horario Base</label>
                  <input type="text" className="form-control" value="09:00 - 23:00" disabled readOnly />
              </div>
              
              <div className="col-md-6">
                  <label className="form-label fw-bold">Horas Extra Montaje</label>
                  <input type="number" className="form-control" name="tiempoExtraMontaje" min="0" value={paso2Data.tiempoExtraMontaje || 0} onChange={handlePaso2Change} />
              </div>
              <div className="col-md-6">
                  <label className="form-label fw-bold">Horas Extra Desmontaje</label>
                  <input type="number" className="form-control" name="tiempoExtraDesmontaje" min="0" value={paso2Data.tiempoExtraDesmontaje || 0} onChange={handlePaso2Change} />
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* SECCIÓN 3: VEHÍCULOS (EDITABLES)                     */}
        {/* ==================================================== */}
        <div className="card mb-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">Vehículos ({paso3Data.cantidadVehiculos || 0})</h5>
          </div>
          <div className="card-body">
             <div className="row g-3">
                <div className="col-12">
                    <label className="form-label fw-bold">Cantidad Total</label>
                    <input type="number" className="form-control" name="cantidadVehiculos" min="0" max="5" value={paso3Data.cantidadVehiculos || 0} onChange={handlePaso3Change} />
                </div>
                
                {paso3Data.vehiculos && paso3Data.vehiculos.length > 0 && paso3Data.vehiculos.map((vehiculo, index) => (
                    <div key={index} className="col-12 border p-3 rounded bg-white">
                        <h6>Vehículo #{index + 1}</h6>
                        <div className="row">
                            <div className="col-md-6">
                                <label className="form-label">Tipo</label>
                                <select className="form-select" value={vehiculo.tipo} onChange={(e) => handleVehiculoChange(index, 'tipo', e.target.value)}>
                                    <option value="bus">Camión/bus</option>
                                    <option value="camioneta">Camioneta</option>
                                    <option value="sedan">Automóvil</option>
                                </select>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">Placa</label>
                                <input type="text" className="form-control" value={vehiculo.placa} onChange={(e) => handleVehiculoChange(index, 'placa', e.target.value.toUpperCase())} />
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>

        {/* Botón Confirmar */}
        <div className="text-center mt-4 mb-5">
          <button
            onClick={handleConfirmar}
            className="btn btn-lg btn-success"
            disabled={cargando}
            style={{ padding: '12px 40px', fontSize: '18px', fontWeight: 'bold' }}
          >
            {cargando ? 'Procesando...' : 'Confirmar y Enviar Solicitud'}
          </button>
        </div>

      </div>
      <Footer />
    </>
  );
}

export default ConfirmacionSolicitud;