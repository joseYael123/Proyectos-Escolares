export interface Movimiento_vehiculo{
    id_movimiento: number;
    id_vehiculo: number;
    id_evento: number;
    tipo_operacion: string;
    direccion_vehiculo: string;
    fecha_hora: Date;
    observaciones: string;
}