import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventoService } from '../services/evento.service';
import { ReservaService } from '../services/reserva.service';
import { AsignacionEspaciosComponent } from './asignacionAux/espacios';
import { AsignacionHorariosComponent } from './asignacionHorario/horarios';
import { forkJoin, timeout } from 'rxjs';

@Component({
  selector: 'app-asignacion',
  standalone: true,
  imports: [CommonModule, FormsModule, AsignacionEspaciosComponent, AsignacionHorariosComponent], 
  templateUrl: './asignacion.html',
  styleUrls: ['./asignacion.css']
})
export class AsignacionComponent implements OnInit {
  
  fechaFiltro: string = new Date().toISOString().split('T')[0];
  eventosDelDia: any[] = [];
  isLoading: boolean = false;
  vistaActual: 'lista' | 'espacios' | 'horarios' = 'lista';
  eventoSeleccionado: any = null;
  modalAccionesVisible: boolean = false;

  constructor(
    private eventoService: EventoService,
    private reservaService: ReservaService,
    private cd: ChangeDetectorRef // <--- Inyectar detector de cambios
  ) {}

  ngOnInit(): void {
    this.cargarEventos();
  }

  cargarEventos() {
    this.isLoading = true;
    this.eventosDelDia = [];

    forkJoin({
      eventosResp: this.eventoService.obtenerEventos(),
      reservasResp: this.reservaService.obtenerReservas()
    }).subscribe({
      next: ({ eventosResp, reservasResp }) => {
        
        const rawEventos = this.extraerDatos(eventosResp);
        const rawReservas = this.extraerDatos(reservasResp);

        const mapaReservas = new Map<number, any>();
        rawReservas.forEach((r: any) => {
             if (r.id_evento) mapaReservas.set(r.id_evento, r);
        });

        const eventosUnificados = rawEventos.map((ev: any) => {
            const reserva = mapaReservas.get(ev.id_evento);
            return {
                ...ev,
                reserva: reserva || null 
            };
        });

        this.eventosDelDia = eventosUnificados.filter((e: any) => {
            const fechaRaw = e.reserva?.periodo_start;
            if (!fechaRaw) return false; 
            
            const fechaEvento = new Date(fechaRaw).toISOString().split('T')[0];
            return fechaEvento === this.fechaFiltro;
        });

        this.isLoading = false;
        this.cd.detectChanges(); // <--- FORZAR RENDERIZADO AQUI
      },
      error: (err) => {
        console.error('Error cargando datos:', err);
        this.isLoading = false;
        this.cd.detectChanges(); // <--- También en error para quitar spinner
      }
    });
  }

  private extraerDatos(payload: any): any[] {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.Datos)) return payload.Datos;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  }

  abrirModalAcciones(evento: any) {
    this.eventoSeleccionado = evento;
    this.modalAccionesVisible = true;
  }

  cerrarModalAcciones() {
    this.modalAccionesVisible = false;
  }

  irAAsignarEspacios() {
    this.cerrarModalAcciones();
    this.vistaActual = 'espacios';
    // Forzamos detección al cambiar de vista por si acaso
    setTimeout(() => this.cd.detectChanges(), 0);
  }

  irAAsignarHoras() {
    this.vistaActual = 'horarios'
    this.cerrarModalAcciones();
    setTimeout(() => this.cd.detectChanges(), 0);
  }

  volverALista() {
    this.vistaActual = 'lista';
    this.eventoSeleccionado = null;
    this.cargarEventos();
  }
}