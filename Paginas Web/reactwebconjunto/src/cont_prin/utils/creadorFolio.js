export const crearFolio = (datos) => {
    let folioConstruido = "";

    const fecha = datos.fecha || new Date().toISOString();
    const nombreEvento = datos.nombre_evento || "Evento X";
    const vehicu = datos.vehiculos

    const anio = fecha.substring(2,10);
    const nombre = nombreEvento.substring(0,3);

    const cadenaCompleta = `${anio}${nombre}${vehicu}`;

    const cadena_Limpia = cadenaCompleta.trim().toUpperCase().replace(/-/g, "");

    folioConstruido = cadena_Limpia;

    return folioConstruido;
}


