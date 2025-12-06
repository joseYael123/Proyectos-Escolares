import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../services/reserva.service';
import { Reserva_evento } from '../../interfaces/reserva.interface';

@Component({
  selector: 'app-asignacion-horarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './horarios.html',
  styleUrls: ['./horarios.css']
})
export class AsignacionHorariosComponent implements OnInit {

  @Input() evento: any; 
  @Input() eventosDelDia: any[] = []; // Lista de eventos para validar colisiones
  @Output() onClose = new EventEmitter<void>();

  // Configuración
  horaApertura: number = 9;
  horaCierre: number = 23;
  
  // Opciones
  bloquesHoras: number[] = [2, 3, 4, 5, 6];
  bloquesLogistica: number[] = [0, 1, 2, 3];

  // Modelos
  horaInicio: string = '09:00';
  
  // Control de Duración
  modoDuracion: 'fijo' | 'custom' = 'fijo';
  duracionSeleccionada: number = 2; // Para el select
  duracionCustom: number = 2.5;     // Para el input manual (admite decimales)
  
  horasMontaje: number = 2; 
  horasDesmontaje: number = 1;

  reservaActiva: Reserva_evento | null = null;
  isLoading: boolean = false;
  
  // Estado de conflicto
  mensajeConflicto: string = '';

  constructor(private reservaService: ReservaService) {}

  ngOnInit(): void {
    if (this.evento && this.evento.reserva) {
      this.reservaActiva = this.evento.reserva;
      
      if (this.reservaActiva?.periodo_start) {
        this.determinarLimitesHorarios(this.reservaActiva.periodo_start);
        this.horaInicio = this.extraerHora(this.reservaActiva.periodo_start);
      }

      // Calcular duración previa y decidir modo
      if (this.reservaActiva?.periodo_start && this.reservaActiva?.periodo_end) {
          const inicio = new Date(this.reservaActiva.periodo_start);
          const fin = new Date(this.reservaActiva.periodo_end);
          const diffMs = fin.getTime() - inicio.getTime();
          const diffHoras = diffMs / (1000 * 60 * 60); // Puede ser decimal (ej. 2.5)
          
          // Si es un entero y está en la lista, usamos modo fijo, si no, custom
          if (Number.isInteger(diffHoras) && this.bloquesHoras.includes(diffHoras)) {
              this.modoDuracion = 'fijo';
              this.duracionSeleccionada = diffHoras;
          } else {
              this.modoDuracion = 'custom';
              this.duracionCustom = parseFloat(diffHoras.toFixed(2));
          }
      }

      // Parsear tiempos logística
      if (this.reservaActiva?.duracion_montaje) {
          const parts = this.reservaActiva.duracion_montaje.split(':');
          this.horasMontaje = parseInt(parts[0], 10) || 0;
      }
      if (this.reservaActiva?.duracion_desmontaje) {
          const parts = this.reservaActiva.duracion_desmontaje.split(':');
          this.horasDesmontaje = parseInt(parts[0], 10) || 0;
      }
    }
  }

  private determinarLimitesHorarios(fechaIso: string | Date) {
      const fecha = new Date(fechaIso);
      const dia = fecha.getDay();
      if (dia >= 1 && dia <= 5) { this.horaApertura = 9; this.horaCierre = 23; } 
      else if (dia === 6) { this.horaApertura = 9; this.horaCierre = 22; } 
      else if (dia === 0) { this.horaApertura = 10; this.horaCierre = 18; }
  }

  // --- GETTERS Y CÁLCULOS ---

  // Retorna la duración real según el modo seleccionado
  get duracionReal(): number {
      return this.modoDuracion === 'fijo' ? this.duracionSeleccionada : this.duracionCustom;
  }

  get horaFinCalculada(): string {
    if (!this.horaInicio) return '--:--';
    const [h, m] = this.horaInicio.split(':').map(Number);
    
    const totalMinutosInicio = (h * 60) + m;
    const duracionMinutos = this.duracionReal * 60;
    const totalMinutosFin = totalMinutosInicio + duracionMinutos;
    
    const hFin = Math.floor(totalMinutosFin / 60);
    const mFin = Math.round(totalMinutosFin % 60);
    
    const hFinVisual = hFin >= 24 ? hFin - 24 : hFin;
    return `${hFinVisual.toString().padStart(2, '0')}:${mFin.toString().padStart(2, '0')}`;
  }

  // --- VALIDACIÓN DE COLISIÓN (CRÍTICO) ---
  get tieneConflicto(): boolean {
      this.mensajeConflicto = '';
      if (!this.horaInicio) return false;

      const [hInicio, mInicio] = this.horaInicio.split(':').map(Number);
      
      // 1. Convertir mi horario propuesto a minutos del día (0 - 1440)
      // NOTA: Para ser seguros, el bloqueo debería ser el evento puro. 
      // Si quieres bloquear también montaje/desmontaje, ajusta las restas aquí.
      // Por ahora validaremos colisión de EVENTO a EVENTO.
      const miInicioMin = (hInicio * 60) + mInicio;
      const miFinMin = miInicioMin + (this.duracionReal * 60);

      // 2. Comparar contra otros eventos del día
      if (!this.eventosDelDia) return false;

      for (const otroEvento of this.eventosDelDia) {
          // Nos saltamos a nosotros mismos
          if (otroEvento.id_evento === this.evento.id_evento) continue;

          // REGLA: Si el otro evento tiene horario placeholder (todo el día), lo ignoramos
          // porque asumimos que aún no se le asigna hora real.
          if (this.esHorarioPlaceholder(otroEvento)) continue;

          // Extraer horarios del otro evento
          if (!otroEvento.reserva?.periodo_start || !otroEvento.reserva?.periodo_end) continue;

          const otroInicioDate = new Date(otroEvento.reserva.periodo_start);
          const otroFinDate = new Date(otroEvento.reserva.periodo_end);

          let otroInicioMin = (otroInicioDate.getHours() * 60) + otroInicioDate.getMinutes();
          let otroFinMin = (otroFinDate.getHours() * 60) + otroFinDate.getMinutes();

          // Lógica de intersección de rangos: (StartA < EndB) && (EndA > StartB)
          if (miInicioMin < otroFinMin && miFinMin > otroInicioMin) {
              const hInicioStr = otroInicioDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              const hFinStr = otroFinDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              this.mensajeConflicto = `Choque con evento: "${otroEvento.nombre_evento}" (${hInicioStr} - ${hFinStr})`;
              return true;
          }
      }

      return false;
  }

  // Helper para detectar si un evento tiene horario default (9-23)
  private esHorarioPlaceholder(ev: any): boolean {
      if (!ev.reserva?.periodo_start || !ev.reserva?.periodo_end) return true;
      const i = new Date(ev.reserva.periodo_start);
      const f = new Date(ev.reserva.periodo_end);
      // Ajusta esto si tu placeholder es diferente (ej. 09:00 a 23:00)
      return i.getHours() === 9 && f.getHours() === 23;
  }

  get esHoraValida(): boolean {
    if (!this.horaInicio) return false;
    const [h, m] = this.horaInicio.split(':').map(Number);

    // 1. Validar Apertura
    if (h < this.horaApertura) return false;

    // 2. Validar Cierre
    const horaFinReal = h + this.duracionReal; // Duración en decimales
    // Permitimos terminar exactamente a la hora de cierre
    if (horaFinReal > this.horaCierre) return false;

    return true;
  }

  get mensajeError(): string {
      if (this.tieneConflicto) return this.mensajeConflicto;
      if (!this.horaInicio) return '';
      
      const [h] = this.horaInicio.split(':').map(Number);
      if (h < this.horaApertura) return `El evento inicia antes de la apertura (${this.horaApertura}:00).`;
      
      const hFin = h + this.duracionReal;
      if (hFin > this.horaCierre) return `El evento termina después del cierre (${this.horaCierre}:00).`;

      return '';
  }

  // --- GUARDAR ---

  guardarHorario() {
    if (!this.reservaActiva?.id_reserva) return;

    if (!this.esHoraValida || this.tieneConflicto) {
        alert('Error: ' + this.mensajeError);
        return;
    }

    this.isLoading = true;
    const fechaBase = this.evento.reserva.periodo_start; 
    
    // Construir fechas
    const fechaInicioISO = this.construirFecha(fechaBase, this.horaInicio);
    
    const dFin = new Date(fechaInicioISO);
    // Sumar minutos para soportar decimales (ej. 2.5 horas = 150 min)
    dFin.setMinutes(dFin.getMinutes() + (this.duracionReal * 60));
    const fechaFinISO = dFin.toISOString();

    const fmtHoras = (h: number) => `${h.toString().padStart(2, '0')}:00:00`;

    const payload: Reserva_evento = {
        ...this.reservaActiva,
        periodo_start: fechaInicioISO,
        periodo_end: fechaFinISO,
        duracion_montaje: fmtHoras(this.horasMontaje),
        duracion_desmontaje: fmtHoras(this.horasDesmontaje)
    };

    this.reservaService.actualizarReserva(this.reservaActiva.id_reserva, payload).subscribe({
        next: (res) => {
            alert('Horario asignado correctamente.');
            this.isLoading = false;
            this.cerrar(true); 
        },
        error: (err) => {
            console.error(err);
            alert('Error al actualizar.');
            this.isLoading = false;
        }
    });
  }

  // --- HELPERS ---
  private extraerHora(fecha: string | Date): string {
    const d = new Date(fecha);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  private construirFecha(fechaOriginal: string | Date, horaStr: string): string {
      const d = new Date(fechaOriginal);
      const [h, m] = horaStr.split(':').map(Number);
      d.setHours(h);
      d.setMinutes(m);
      d.setSeconds(0);
      return d.toISOString();
  }

  cerrar(recargar: boolean = false) {
    this.onClose.emit();
  }
}