import React from "react";
import construccion from '../../imagenes/construcc.jpg';
import Footer from '../Footer/Footer';

function Educativa(){
    return(
        <>
              <div className="d-flex flex-column justify-content-center align-items-center h-100 w-100 p-5">        
                <p className="mb-5">En construccion pe causita</p>
                <img src={construccion} className="w-50 rounded"/>
                </div>
              <Footer />
        </>
    );
}

export default Educativa;