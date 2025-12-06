export interface Asignacion_espacio {
    id_asignacion?: number; // Opcional al crear
    id_vehiculo: number;
    id_espacio: number;
    id_evento: number;
    fecha_asignacion: string | Date;
    fecha_liberacion?: string | Date | null; // Puede ser nulo si sigue ocupado
    observaciones?: string;
}