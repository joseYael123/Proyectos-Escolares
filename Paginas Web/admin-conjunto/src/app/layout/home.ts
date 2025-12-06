import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  constructor(public authService: AuthService) {}

  get isSuperAdmin() {
    const user = this.authService.getCurrentUser();
    return user?.rol === 'super admin' || user?.rol === 'super_admin';
  }

  get isLogistica() {
    return this.authService.isLogistica();
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }
}
