const {GoogleGenerativeAI} = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const gemini = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const modelo = gemini.getGenerativeModel({model: "gemini-2.5-flash"});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function helperImagen(rutaImagen){
    const ext = path.extname(rutaImagen);
    let mimeType = 'image/jpeg';
    if(ext == ".png") mimeType = 'image/png';
    if(ext == ".webp") mimeType = 'image/webp';

    return { 
        inlineData: {
        data: fs.readFileSync(rutaImagen).toString("base64"),
        mimeType
        }
    }
}

async function mandarPlaca(rutaImagen){
    const MAX_INTENTOS = 3;
for(const i = 0; i < MAX_INTENTOS; i++){
    try{
        const prompt = "Eres un experto profesional de rescatar datos de imagenes, de esta imagen que simula una placa de circulacion mexicana solo dame el texto de la placa pero nadamas solo eso";

        const imagen = helperImagen(rutaImagen);

        const resultado = await modelo.generateContent([prompt,imagen]);
        const respuesta = resultado.response;
        const text = respuesta.text();

        console.log("La placa extraida es:", text);

        return text.trim();
        } catch(error){
            if(error.status == 503){
                console.log("Error en servicio de google reintentando...");
                sleep(i + 1) * 2000;
           }
            console.error(error);
            throw new Error("Error en la api de google");        
        }
    }
}
module.exports = {
    mandarPlaca
}