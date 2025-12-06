import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ResponsableService } from '../../services/responsable.service';
import { Responsable } from '../../interfaces/responable.interface'; 

@Component({
  selector: 'app-tabla-responsable',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tabla.html',
  styleUrl: './tabla.css'
})
export class TablaResponsable implements OnInit {
  
  datos: Responsable[] = [];
  responsableSeleccionado: any | null = null;
  modoEdicion: boolean = false;
  isLoading: boolean = false;

  constructor(
    private responsableService: ResponsableService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarResponsables();
  }

  cargarResponsables() {
    this.isLoading = true;
    this.responsableService.listarResponsables().subscribe({
      next: (response: any) => {
        this.datos = this.extraerDatos(response);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar responsables:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private extraerDatos(payload: any): any[] {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload.Datos) return Array.isArray(payload.Datos) ? payload.Datos : [payload.Datos];
    if (payload.data) return Array.isArray(payload.data) ? payload.data : [payload.data];
    return [];
  }

  editarResponsable(responsable: Responsable) {
    // Usamos una copia y asumimos que campos como 'estado' o 'imagen' vienen en el objeto completo.
    this.responsableSeleccionado = { ...responsable };
    this.modoEdicion = true;
  }

  cancelarEdicion() {
    this.responsableSeleccionado = null;
    this.modoEdicion = false;
  }

  actualizarResponsable() {
    if (this.responsableSeleccionado && this.responsableSeleccionado.id_responsable) {
      
      this.responsableService.actualizarResponsable(this.responsableSeleccionado.id_responsable, this.responsableSeleccionado).subscribe({
        next: (data) => {
          alert('Responsable actualizado exitosamente');
          this.cargarResponsables();
          this.cancelarEdicion();
        },
        error: (error) => {
          console.error('Error al actualizar:', error);   
          alert('Error al actualizar el responsable');
        }
      });
    }
  }

  eliminarResponsable(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este Responsable?')) {
      this.responsableService.borrarResponsable(id).subscribe({
        next: () => {
          alert('Responsable eliminado exitosamente');
          this.cargarResponsables();
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          alert('Error al eliminar el responsable');
        }
      });
    }
  }
  
  // --- FUNCIONES DE TEMPLATE RESTAURADAS ---

  obtenerImagenUrl(ruta?: string): string {
    if (!ruta) return 'assets/no-image.png'; 
    if (ruta.startsWith('http')) return ruta;
    return `http://localhost:5000${ruta}`; 
  }
}