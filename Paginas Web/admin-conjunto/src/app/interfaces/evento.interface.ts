export interface Evento {
  id_evento?: number;
  id_responsable?: number;
  nombre_evento?: string;
  descripcion?: string;
  categoria_evento?: string;
  // Algunas APIs usan "tipo_admision" o "tipo_de_admision" — aceptar ambas opciones
  tipo_de_admision?: string;
  tipo_admision?: string;
  qr_evento?: string;
  qr_imagen?: string;
  estado?: string; // Programado, En curso, Finalizado, Cancelado
  folio_evento?: string;
  // Reserva opcional asociada (se carga desde ReservaService)
  reserva?: import('./reserva.interface').Reserva_evento;
}
