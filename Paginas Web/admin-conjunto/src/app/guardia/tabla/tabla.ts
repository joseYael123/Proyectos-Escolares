import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { GuardiaService } from '../../services/guardia.service';
import { Guardia } from '../../interfaces/guardia.interface';

@Component({
  selector: 'app-tabla-guardia',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tabla.html',
  styleUrl: './tabla.css'
})
export class TablaGuardia implements OnInit {
  datos: Guardia[] = [];
  guardiaSeleccionado: Guardia | null = null;
  modoEdicion: boolean = false;

  constructor(
    private guardiaService: GuardiaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarGuardias();
  }

  cargarGuardias() {
    this.guardiaService.obtenerGuardias().subscribe({
      next: (data) => {
        this.datos = data;
        console.log('Guardias cargados:', data);
        console.log('Longitud del array datos:', this.datos.length);
        console.log('¿Es array?:', Array.isArray(this.datos));
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar guardias:', error);
        alert('Error al cargar los guardias. Verifica la conexión con el servidor.');
      }
    });
  }

  editarGuardia(guardia: Guardia) {
    this.guardiaSeleccionado = { ...guardia };
    this.modoEdicion = true;
  }

  cancelarEdicion() {
    this.guardiaSeleccionado = null;
    this.modoEdicion = false;
  }

  actualizarGuardia() {
    if (this.guardiaSeleccionado && this.guardiaSeleccionado.id_guardia) {
      this.guardiaService.actualizarGuardia(this.guardiaSeleccionado.id_guardia, this.guardiaSeleccionado).subscribe({
        next: (data) => {
          console.log('Guardia actualizado:', data);
          alert('Guardia actualizado exitosamente');
          this.cargarGuardias();
          this.cancelarEdicion();
        },
        error: (error) => {
          console.error('Error al actualizar:', error);
          
          // Verificar si es error de número duplicado
          if (error.error && error.error.error === 'NUMERO_DUPLICADO') {
            alert('⚠️ El número de guardia ya está registrado.\nPor favor, cambia el número de guardia e intenta nuevamente.');
            return;
          }
          
          if (error.error && error.error.msg) {
            alert(error.error.msg);
          } else {
            alert('Error al actualizar el guardia');
          }
        }
      });
    }
  }

  eliminarGuardia(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este guardia?')) {
      this.guardiaService.eliminarGuardia(id).subscribe({
        next: () => {
          alert('Guardia eliminado exitosamente');
          this.cargarGuardias();
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          alert('Error al eliminar el guardia');
        }
      });
    }
  }

  obtenerImagenUrl(guardia: Guardia): string {
    console.log('🖼️ Obteniendo URL de imagen para guardia:', guardia.id_guardia, 'Imagen:', guardia.imagen);
    
    if (guardia.imagen) {
      if (guardia.imagen.startsWith('http')) {
        console.log('✅ URL completa detectada:', guardia.imagen);
        return guardia.imagen;
      }
      const urlCompleta = `http://localhost:5000${guardia.imagen}`;
      console.log('✅ URL construida:', urlCompleta);
      return urlCompleta;
    }
    console.log('⚠️ Sin imagen, usando placeholder');
    return 'https://via.placeholder.com/40';
  }
}
