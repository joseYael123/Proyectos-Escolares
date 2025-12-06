export interface Reserva_evento{
    id_reserva?: number;
    id_evento?: number;
    id_sala?: number;
    // usamos strings o Date según cómo devuelva la API
    periodo_start?: string | Date;
    periodo_end?: string | Date; // corregido nombre
    cant_vehiculos?: number;
    duracion_montaje?: string;
    duracion_desmontaje?: string;
}