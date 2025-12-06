import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GuardiaService } from '../../services/guardia.service';
import { Guardia } from '../../interfaces/guardia.interface';

@Component({
  selector: 'app-formulario-guardia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './formulario.html',
  styleUrl: './formulario.css'
})
export class FormularioGuardia {
  nuevoGuardia: Guardia = {
    nom_guardia: '',
    app_guardia: '',
    apm_guardia: '',
    numero_guardia: '',
    contra_guardia: '',
    estado: 'Activo',
    imagen: ''
  };

  archivoImagen: File | null = null;

  constructor(
    private guardiaService: GuardiaService,
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

  agregarGuardia() {
    if (this.validarFormulario()) {
      console.log('Datos a enviar:', this.nuevoGuardia);
      this.guardiaService.crearGuardia(this.nuevoGuardia, this.archivoImagen).subscribe({
        next: (data) => {
          console.log('Guardia creado:', data);
          alert('Guardia creado exitosamente');
          this.router.navigate(['/guardia']);
        },
        error: (error) => {
          console.error('Error al crear guardia:', error);
          console.error('Detalles del error:', error.error);
          
          // Verificar si es error de número duplicado
          if (error.error && error.error.error === 'NUMERO_DUPLICADO') {
            alert('⚠️ El número de guardia ya está registrado.\nPor favor, cambia el número de guardia e intenta nuevamente.');
            return;
          }
          
          if (error.error && error.error.errors) {
            const errores = error.error.errors.map((e: any) => e.msg).join('\n');
            alert('Errores de validación:\n' + errores);
          } else if (error.error && error.error.msg) {
            alert(error.error.msg);
          } else {
            alert('Error al crear el guardia. Verifica los datos.');
          }
        }
      });
    }
  }

  validarFormulario(): boolean {
    if (!this.nuevoGuardia.nom_guardia || !this.nuevoGuardia.app_guardia || 
        !this.nuevoGuardia.numero_guardia || !this.nuevoGuardia.contra_guardia) {
      alert('Por favor completa todos los campos obligatorios');
      return false;
    }
    
    return true;
  }

  cancelar() {
    if (confirm('¿Estás seguro de que deseas cancelar? Se perderán los datos ingresados.')) {
      this.router.navigate(['/guardia']);
    }
  }
}
