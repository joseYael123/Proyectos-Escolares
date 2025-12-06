import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EventoService } from '../../services/evento.service';
import { Evento } from '../../interfaces/evento.interface';

@Component({
  selector: 'app-tabla-evento',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tabla.html',
  styleUrl: './tabla.css'
})
export class TablaEvento implements OnInit {
  datos: Evento[] = [];
  eventoSeleccionado: Evento | null = null;
  modoEdicion: boolean = false;
  isLoading: boolean = false;

  constructor(
    private eventoService: EventoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarEventos();
  }

  cargarEventos() {
    this.isLoading = true;
    this.eventoService.obtenerEventos().subscribe({
      next: (response: any) => {
        this.datos = this.extraerDatos(response);
        console.log('Eventos cargados:', this.datos.length);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar eventos:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Helper para manejar respuestas de Mongo/Postgres uniformemente
  private extraerDatos(payload: any): any[] {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload.Datos) return Array.isArray(payload.Datos) ? payload.Datos : [payload.Datos];
    if (payload.data) return Array.isArray(payload.data) ? payload.data : [payload.data];
    return [];
  }

  editarEvento(evento: Evento) {
    // Crear una copia para no modificar la tabla en tiempo real antes de guardar
    this.eventoSeleccionado = { ...evento };
    this.modoEdicion = true;
  }

  cancelarEdicion() {
    this.eventoSeleccionado = null;
    this.modoEdicion = false;
  }

  actualizarEvento() {
    if (this.eventoSeleccionado && this.eventoSeleccionado.id_evento) {
      
      this.eventoService.actualizarEvento(this.eventoSeleccionado.id_evento, this.eventoSeleccionado).subscribe({
        next: (data) => {
          console.log('Evento actualizado:', data);
          alert('Evento actualizado exitosamente');
          this.cargarEventos();
          this.cancelarEdicion();
        },
        error: (error) => {
          console.error('Error al actualizar:', error);   
          if (error.error && error.error.msg) {
            alert(error.error.msg);
          } else {
            alert('Error al actualizar el evento');
          }
        }
      });
    }
  }

  eliminarEvento(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este Evento?')) {
      this.eventoService.eliminarEvento(id).subscribe({
        next: () => {
          alert('Evento eliminado exitosamente');
          this.cargarEventos();
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          alert('Error al eliminar el evento');
        }
      });
    }
  }

  // Opcional: Para mostrar la imagen del QR si existe
  obtenerImagenUrl(ruta?: string): string {
    if (!ruta) return 'assets/no-image.png'; 
    if (ruta.startsWith('http')) return ruta;
    return `http://localhost:5000${ruta}`; 
  }

  // =========================================================
  // FUNCIONES RESTAURADAS PARA EL TEMPLATE
  // =========================================================
  
  // 1. Badge de Estado
  getEstadoBadge(estado?: string): string {
    const e = (estado || '').toString().toLowerCase();
    if (e === 'pendiente') return 'bg-warning text-dark';
    if (e === 'confirmado') return 'bg-success';
    if (e === 'denegado' || e === 'denegar') return 'bg-danger';
    return 'bg-secondary';
  }

  // 2. Formato de Duración (Montaje/Desmontaje)
  formatDuracion(d: any): string {
    if (d == null) return '';
    // Asume que si viene en formato objeto (como de PostgreSQL INTERVAL), lo formatea
    if (typeof d === 'object' && d.hours) return `${d.hours} h`;
    return String(d);
  }

  // 3. Funciones de Acciones (Necesario para el componente EventosLogistica si se usa su template)
  isUpdating(id?: number): boolean {
    return false; // Implementación dummy
  }
  
  getEstadoActions(ev: Evento) {
    return { btn1: { cls: 'btn-warning', value: 'Pendiente', label: 'Pendiente' }, btn2: { cls: 'btn-danger', value: 'Denegado', label: 'Denegar' } };
  }

  private getPeriodoStart(e: Evento): number {
    const raw = (e as any).reserva?.periodo_start ?? (e as any).periodo_start;
    if (!raw) return 0;
    return new Date(raw).getTime();
  }
}