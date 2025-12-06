import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginResponse } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  credentials = {
    usuario_admin: '',
    contra_admin: ''
  };

  errorMessage = '';
  isLoading = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    // Si ya está autenticado, redirigir al home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit() {
    if (!this.credentials.usuario_admin || !this.credentials.contra_admin) {
      this.errorMessage = 'Por favor, complete todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    console.log('Iniciando login...');

    this.authService.login(this.credentials).subscribe({
      next: (response: LoginResponse) => {
        console.log('Login exitoso:', response);
        console.log('Rol del usuario:', this.authService.getUserRole());
        this.isLoading = false;
        // Redirigir al home independientemente del rol
        this.router.navigate(['/home']);
      },
      error: (error: any) => {
        console.error('Error capturado en componente:', error);
        console.log('Status del error:', error.status);
        console.log('Deteniendo carga...');
        this.isLoading = false;
        
        // Manejar diferentes tipos de errores
        if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión.';
        } else if (error.status === 401) {
          this.errorMessage = error.error?.msg || 'Usuario o contraseña incorrectos';
        } else if (error.status === 400) {
          this.errorMessage = error.error?.msg || 'Datos inválidos';
        } else {
          this.errorMessage = error.error?.msg || 'Error al iniciar sesión. Intente nuevamente.';
        }
        
        console.log('Mensaje de error establecido:', this.errorMessage);
        // Forzar detección de cambios
        this.cdr.detectChanges();
      },
      complete: () => {
        console.log('Observable completado');
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
