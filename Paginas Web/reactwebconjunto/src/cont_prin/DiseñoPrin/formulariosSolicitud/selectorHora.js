import React, { useState } from 'react'; // 1. Importamos useState
import moment from 'moment';

// --- (Las funciones generarHorarios y estaOcupado se quedan igual) ---
const HORA_INICIO = 8;
const HORA_FIN = 22; 
const INCREMENTO_MINUTOS = 30; 

function generarHorarios() {
 const horarios = [];
 let horaActual = moment().startOf('day').hour(HORA_INICIO);
 const horaFin = moment().startOf('day').hour(HORA_FIN);
 while (horaActual.isBefore(horaFin)) {
  horarios.push(horaActual.format('HH:mm'));
  horaActual.add(INCREMENTO_MINUTOS, 'minutes');
 }
 return horarios;
}

function estaOcupado(hora, bloquesOcupados, fechaSeleccionada) {
 if (!fechaSeleccionada) return false;
 const [h, m] = hora.split(':');
 const horaSeleccionada = moment(fechaSeleccionada)
              .hour(h)
              .minute(m)
              .second(0);
 for (const bloque of bloquesOcupados) {
  const inicio = moment(bloque.inicio);
  const fin = moment(bloque.fin);
  if (horaSeleccionada.isSameOrAfter(inicio) && horaSeleccionada.isBefore(fin)) {
   return true; 
  }
 }
 return false; 
}


// --- El Componente (Modificado) ---
function SelectorDeHora({ bloquesOcupados, name, fechaSeleccionada }) {
 const todosLosHorarios = generarHorarios();

  // 2. Añadimos estado para guardar la hora de INICIO seleccionada
  const [horaInicio, setHoraInicio] = useState('');

  // 3. Creamos un manejador para actualizar el estado
  const handleInicioChange = (e) => {
    setHoraInicio(e.target.value);
    // TODO: Aquí también deberías actualizar tu formulario principal (usando Context o una función prop)
  };

 return (
  <>
      {/* --- SELECTOR 1: HORA DE INICIO --- */}
    <select 
     className="form-control" 
     id={name} 
     name={name} // Este será "horarioEvento"
        value={horaInicio} // Controlamos el valor con el estado
        onChange={handleInicioChange} // Actualizamos el estado al cambiar
     required
    >
     <option value="">Selecciona una hora de inicio</option>
   
     {todosLosHorarios.map(hora => {
      const ocupado = estaOcupado(hora, bloquesOcupados, fechaSeleccionada);
      
      return (
       <option 
        key={hora} 
        value={hora}
        disabled={ocupado}
       >
        {hora} {ocupado ? ' (Ocupado)' : ''}
       </option>
      );
     })}
    </select>

      {/* --- SELECTOR 2: HORA DE FIN --- */}
      {/* 4. Solo mostramos este select SI ya se eligió una hora de inicio */}
      {horaInicio && (
        <select 
          className='form-control mt-2' // 5. Añadimos un margen
          id="horarioFin" // 6. Damos un ID y Name únicos
          name="horarioFin"
          required
        >
          <option value="">Selecciona una hora de fin</option>
          
          {/* 7. Filtramos los horarios para mostrar solo los que son POSTERIORES a la hora de inicio */}
          {todosLosHorarios
            .filter(hora => hora > horaInicio) 
            .map(horafin => { // 8. Usamos la variable 'horafin'
              
              // 9. Usamos 'horafin' en la lógica
              const ocupado = estaOcupado(horafin, bloquesOcupados, fechaSeleccionada);
                  
              return (
                <option
                  key={horafin} // 10. Usamos 'horafin' en el key, value y texto
                  value={horafin}
                  disabled={ocupado}
                >
                  {horafin} {ocupado ? ' (Ocupado)' : ''}
                </option>
              );
          })}
        </select>
      )}
  </>
 );
}

export default SelectorDeHora;