import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Admin } from '../../interfaces/admin.interface';

@Component({
  selector: 'app-formulario-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario.html',
  styleUrl: './formulario.css'
})
export class FormularioAdmin {
  nuevoAdmin: Admin = {
    nom_admin: '',
    app_admin: '',
    apm_admin: '',
    correo: '',
    usuario_admin: '',
    contra_admin: '',
    rol: 'logistica',
    imagen: '',
    estado: 'ACTIVO'
  };

  archivoImagen: File | null = null;

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tamaño (máx 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe superar 2MB');
        event.target.value = '';
        return;
      }
      
      // Validar tipo de archivo
      const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!tiposPermitidos.includes(file.type)) {
        alert('Solo se permiten imágenes JPG, PNG, GIF o WEBP');
        event.target.value = '';
        return;
      }
      
      this.archivoImagen = file;
      console.log('Archivo seleccionado:', file.name);
    }
  }

  agregarAdmin() {
    if (this.validarFormulario()) {
      console.log('Datos a enviar:', this.nuevoAdmin);
      this.adminService.crearAdmin(this.nuevoAdmin, this.archivoImagen).subscribe({
        next: (data) => {
          console.log('Administrador creado:', data);
          alert('Administrador creado exitosamente');
          this.router.navigate(['/admin']);
        },
        error: (error) => {
          console.error('Error al crear administrador:', error);
          console.error('Detalles del error:', error.error);
          if (error.error && error.error.errors) {
            const errores = error.error.errors.map((e: any) => e.msg).join('\n');
            alert('Errores de validación:\n' + errores);
          } else {
            alert('Error al crear el administrador. Verifica los datos.');
          }
        }
      });
    }
  }

  validarFormulario(): boolean {
    if (!this.nuevoAdmin.nom_admin || !this.nuevoAdmin.app_admin || 
        !this.nuevoAdmin.correo || !this.nuevoAdmin.usuario_admin || 
        !this.nuevoAdmin.contra_admin) {
      alert('Por favor completa todos los campos obligatorios');
      return false;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.nuevoAdmin.correo)) {
      alert('Por favor ingresa un correo válido');
      return false;
    }
    
    return true;
  }

  cancelar() {
    if (confirm('¿Estás seguro de que deseas cancelar? Se perderán los datos ingresados.')) {
      this.router.navigate(['/admin']);
    }
  }
}
