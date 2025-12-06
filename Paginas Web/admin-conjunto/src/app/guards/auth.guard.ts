import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rutas que requieren autenticación
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirigir al login si no está autenticado
  router.navigate(['/login']);
  return false;
};

/**
 * Guard para proteger rutas que solo pueden acceder super admin
 */
export const superAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const userRole = authService.getUserRole();
  if (userRole === 'super admin' || userRole === 'super_admin') {
    return true;
  }

  // Redirigir al home si no es super admin
  router.navigate(['/home']);
  return false;
};

/**
 * Guard para proteger rutas que pueden acceder super admin y logística
 */
export const logisticaGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  const userRole = authService.getUserRole();
  if (userRole === 'super admin' || userRole === 'super_admin' || userRole === 'logistica') {
    return true;
  }

  // Redirigir al home si no tiene permisos
  router.navigate(['/home']);
  return false;
};

/**
 * Guard para redirigir si ya está autenticado (para la página de login)
 */
export const loginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Esperar un momento para que el servicio se inicialice
  if (authService.isAuthenticated()) {
    console.log('loginGuard - Usuario ya autenticado, redirigiendo a home');
    router.navigate(['/home']);
    return false;
  }

  return true;
};
