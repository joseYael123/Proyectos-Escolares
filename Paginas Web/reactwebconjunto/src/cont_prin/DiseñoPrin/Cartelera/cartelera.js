import React from "react";
import '../../imagenes/imagenes';
import './cartelera.css';
import Footer from '../Footer/Footer';

import { useEffect, useState } from "react";
import imagenes from "../../imagenes/imagenes";

function Cartelera(){

const [cargado, setCargado] = useState(false);

useEffect(() =>{
setCargado(true);
}, [])

    return(
<>
<div className={`cartelera-container ${cargado ? "cargado" : "" }`}> 
      <h2 className="section-title">PRÓXIMOS EVENTOS</h2>
      
      <div className="event-grid">
        
        <div className="event-card">
          {/* 2. Usa la variable importada en 'src' */}
          <img src={imagenes[0]} alt="Sara Baras Event" />
          <h3>SARA BARAS A PACO DE LUCÍA</h3>
          <p className="event-tag">NUEVA</p>
        </div>
        
        <div className="event-card">
          <img src={imagenes[1]} alt="44 Gatos Event" />
          <h3>44 Gatos EN VIVO</h3>
        </div>
        
        <div className="event-card">
          <img src={imagenes[2]} alt="The Space Ocean Event" />
          <h3>THE SPACE OCEAN</h3>
        </div>
        
        <div className="event-card">
            <img src={imagenes[3]} alt="Expresiones Alice 2025 Event" />
          <h3>SINFONÍA MEXICANA</h3>
        </div>
        
        {/* Nuevos eventos agregados */}
        <div className="event-card">
          <img src={imagenes[4]} alt="Un tranvía llamado deseo" />
          <h3>UN TRANVÍA LLAMADO DESEO</h3>
          <p className="event-tag">TEATRO</p>
          <p>DE TENNESSEE WILLIAMS</p>
          <p>DIRECCIÓN ESCÉNICA DE JAN PABLO CONTREBAS</p>
        </div>
        
        <div className="event-card">
          <img src={imagenes[5]} alt="Vaciar la noche" />
          <h3>VACIAR LA NOCHE</h3>
          <p className="event-tag">DANZA</p>
        </div>
        
        <div className="event-card">
          <img src={imagenes[6]} alt="Gala de la Revolución" />
          <h3>GALA DE LA REVOLUCIÓN</h3>
          <p className="event-tag">MÚSICA</p>
          <p>MÉXICO COMO FUERZA Y JUSTICIA</p>
        </div>
        
        <div className="event-card">
          <img src={imagenes[7]} alt="Noche de Zarzuela" />
          <h3>NOCHE DE ZARZUELA</h3>
          <p className="event-tag">MÚSICA</p>
          <p>El mejor repertorio de la zarzuela española</p>
        </div>
        
        <div className="event-card">
          <img src={imagenes[8]} alt="El Cascanueces" />
          <h3>EL CASCANUECES</h3>
          <p className="event-tag">BALLET</p>
          <p>Compañía Nacional de Danza</p>
        </div>
        
        <div className="event-card">
          <img src={imagenes[9]} alt="Circo del Sol" />
          <h3>CIRCO DEL SOL</h3>
          <p className="event-tag">CIRCO</p>
          <p>Nueva temporada</p>
        </div>
        
        <div className="event-card">
          <img src={imagenes[10]} alt="Taller de Actuación" />
          <h3>TALLER DE ACTUACIÓN</h3>
          <p className="event-tag">TALLER</p>
          <p>Con el maestro Juan Carlos Barreto</p>
        </div>
        
        <div className="event-card">
          <img src={imagenes[11]} alt="Festival Internacional" />
          <h3>FESTIVAL INTERNACIONAL</h3>
          <p className="event-tag">FESTIVAL</p>
          <p>3 días de arte y cultura</p>
        </div>
        
      </div>
    </div>
      <Footer />
    </>
    );
}

export default Cartelera;