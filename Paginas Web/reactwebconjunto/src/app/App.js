import logo from '../logo.svg';
import DisPrin from '../cont_prin/DiseñoPrin/DisPrin';
import { Routes,Route, } from 'react-router-dom';
import Cartelera from '../cont_prin/DiseñoPrin/Cartelera/cartelera';
import Recinto from '../cont_prin/DiseñoPrin/enConstruccion/elRecinto';
import Educativa from '../cont_prin/DiseñoPrin/enConstruccion/vinculacionEducativa';
import Alquilar from '../cont_prin/DiseñoPrin/enConstruccion/Alquilar';
import Contacto from '../cont_prin/DiseñoPrin/Contacto/contacto';
import PrimerFormulario from '../cont_prin/DiseñoPrin/formulariosSolicitud/1erFormu';
import SegundoFormulario from '../cont_prin/DiseñoPrin/formulariosSolicitud/2doFormu';
import TercerFormulario from '../cont_prin/DiseñoPrin/formulariosSolicitud/3erFormu';
import ConfirmacionSolicitud from '../cont_prin/DiseñoPrin/formulariosSolicitud/Confirmacion';
import Agradecimiento from '../cont_prin/DiseñoPrin/formulariosSolicitud/Agradecimiento';
import DeclaracionPrivacidad from '../cont_prin/DiseñoPrin/Politicas/DeclaracionPrivacidad';

import {GoogleReCaptchaProvider} from 'react-google-recaptcha-v3';

function App() {
  return (
// src/App.js
<GoogleReCaptchaProvider reCaptchaKey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}>     
  <Routes>
      <Route path='/' element={<DisPrin/>}>
        <Route index element ={<Cartelera/>}></Route>
        <Route path="el-recinto" element={<Recinto/>}></Route>
        <Route path='vinculacion-educativa' element={<Educativa/>}></Route>
        <Route path='alquilar-comerciales' element={<Alquilar/>}></Route>
        <Route path='/contacto' element={<Contacto/>}></Route>
        <Route path='/solicitud-espacios' element={<PrimerFormulario/>}></Route>
        <Route path='/solicitud-espacios-paso2' element={<SegundoFormulario/>}></Route>
        <Route path='/solicitud-espacios-paso3' element={<TercerFormulario/>}></Route>
        <Route path='/solicitud-espacios-confirmacion' element={<ConfirmacionSolicitud/>}></Route>
        <Route path='/solicitud-enviada' element={<Agradecimiento/>}></Route>
        <Route path='/declaracion-privacidad' element={<DeclaracionPrivacidad/>}></Route>
       </Route>
    </Routes>
    </GoogleReCaptchaProvider>
  );
}

export default App;
