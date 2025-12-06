import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Admin } from '../../interfaces/admin.interface';

@Component({
  selector: 'app-tabla-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tabla.html',
  styleUrl: './tabla.css'
})
export class TablaAdmin implements OnInit {
  datos: Admin[] = [];
  adminSeleccionado: Admin | null = null;
  modoEdicion: boolean = false;

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.cargarAdministradores();
  }

  cargarAdministradores() {
    this.adminService.obtenerAdmins().subscribe({
      next: (data) => {
        this.datos = data;
        console.log('Administradores cargados:', data);
        console.log('Longitud del array datos:', this.datos.length);
        console.log('¿Es array?:', Array.isArray(this.datos));
        this.cdr.detectChanges(); // Forzar detección de cambios
      },
      error: (error) => {
        console.error('Error al cargar administradores:', error);
        alert('Error al cargar los administradores. Verifica la conexión con el servidor.');
      }
    });
  }

  editarAdministrador(admin: Admin) {
    this.adminSeleccionado = { ...admin };
    this.modoEdicion = true;
  }

  cancelarEdicion() {
    this.adminSeleccionado = null;
    this.modoEdicion = false;
  }

  actualizarAdministrador() {
    if (this.adminSeleccionado && this.adminSeleccionado.admin_id) {
      this.adminService.actualizarAdmin(this.adminSeleccionado.admin_id, this.adminSeleccionado).subscribe({
        next: (data) => {
          console.log('Administrador actualizado:', data);
          alert('Administrador actualizado exitosamente');
          this.cargarAdministradores();
          this.cancelarEdicion();
        },
        error: (error) => {
          console.error('Error al actualizar:', error);
          alert('Error al actualizar el administrador');
        }
      });
    }
  }

  eliminarAdministrador(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este administrador?')) {
      this.adminService.eliminarAdmin(id).subscribe({
        next: () => {
          alert('Administrador eliminado exitosamente');
          this.cargarAdministradores();
        },
        error: (error) => {
          console.error('Error al eliminar:', error);
          alert('Error al eliminar el administrador');
        }
      });
    }
  }

  verDetallesAdministrador(id: number) {
    this.adminService.obtenerAdminPorId(id).subscribe({
      next: (admin) => {
        alert(`Detalles del Administrador:\n\nNombre: ${admin.nom_admin} ${admin.app_admin}\nCorreo: ${admin.correo}\nUsuario: ${admin.usuario_admin}\nRol: ${admin.rol}\nEstado: ${admin.estado}`);
      },
      error: (error) => {
        console.error('Error:', error);
      }
    });
  }

  obtenerImagenUrl(admin: Admin): string {
    console.log('🖼️ Obteniendo URL de imagen para admin:', admin.admin_id, 'Imagen:', admin.imagen);
    
    if (admin.imagen) {
      // Si la imagen empieza con http, es una URL completa
      if (admin.imagen.startsWith('http')) {
        console.log('✅ URL completa detectada:', admin.imagen);
        return admin.imagen;
      }
      // Si no, es una ruta relativa del servidor, agregar la URL base
      const urlCompleta = `http://localhost:5000${admin.imagen}`;
      console.log('✅ URL construida:', urlCompleta);
      return urlCompleta;
    }
    console.log('⚠️ Sin imagen, usando placeholder');
    return 'https://via.placeholder.com/40';
  }
}
