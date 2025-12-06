import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  protected readonly title = signal('admin-conjunto');
  showMenu = false;
  activeDropdown: string | null = null;

  constructor(public authService: AuthService) {
    console.log('App component constructed');
  }

  ngOnInit() {
    // Suscribirse a cambios en el usuario
    this.authService.currentUser$.subscribe(user => {
      console.log('Usuario actual:', user);
      console.log('Es super admin:', this.isSuperAdmin);
      console.log('Es logística:', this.isLogistica);
    });
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }

  toggleDropdown(dropdown: string) {
    if (this.activeDropdown === dropdown) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = dropdown;
    }
  }

  closeDropdowns() {
    this.activeDropdown = null;
  }

  logout() {
    this.authService.logout();
    this.closeDropdowns();
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  get isAuthenticated() {
    return this.authService.isAuthenticated();
  }

  get isSuperAdmin() {
    const user = this.authService.getCurrentUser();
    console.log('Verificando super admin, rol:', user?.rol);
    return user?.rol === 'super admin' || user?.rol === 'super_admin';
  }

  get isLogistica() {
    const user = this.authService.getCurrentUser();
    return user?.rol === 'logistica';
  }
}
