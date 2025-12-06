import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly TOKEN_KEY = 'auth_token';
  
  constructor(private router: Router) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Obtener el token directamente de localStorage
    const token = localStorage.getItem(this.TOKEN_KEY);

    // Si existe el token Y NO es una petición de login, agregarlo a los headers
    if (token && !request.url.includes('/login')) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Manejar errores de autenticación
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Solo hacer logout si es un error 401, NO es la ruta de login y hay un token
        if (error.status === 401 && !request.url.includes('/login') && token) {
          // Token expirado o inválido en rutas protegidas
          console.log('AuthInterceptor - Token inválido, cerrando sesión');
          localStorage.removeItem(this.TOKEN_KEY);
          localStorage.removeItem('current_user');
          this.router.navigate(['/login']);
        }
        // Siempre propagar el error para que el componente lo maneje
        return throwError(() => error);
      })
    );
  }
}
