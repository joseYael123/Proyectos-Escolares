import { Injectable, ɵisComponentDefPendingResolution } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, retry, throwError } from 'rxjs';
import { Router } from '@angular/router';

export interface LoginCredentials {
  usuario_admin: string;
  contra_admin: string;
}

export interface LoginResponse {
  msg: string;
  success: boolean;
  token: string;
  admin: {
    admin_id: number;
    nom_admin: string;
    app_admin: string;
    apm_admin?: string;
    usuario_admin: string;
    correo: string;
    rol: string;
    estado: string;
    imagen?: string;
  };
}

export interface User {
  admin_id: number;
  nom_admin: string;
  app_admin: string;
  apm_admin?: string;
  usuario_admin: string;
  correo: string;
  rol: string;
  estado: string;
  imagen?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Intentar PostgreSQL primero, si falla usar MongoDB
  private readonly API_URL_PG = 'http://localhost:5000/pg/auth';
  private readonly API_URL_MG = 'http://localhost:5000/mg/auth';
  private currentApiUrl: string; // Empezar con PG
  
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';
  private readonly DB_TYPE_KEY = 'db_type';

  // BehaviorSubject para mantener el estado de autenticación
  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
      ) {
        //Primero usamos la api de postgres
        this.currentApiUrl = this.API_URL_PG;
        console.log("Estamos usando la api de Postgres Primero", this.currentApiUrl);    
    // Verificar el token al iniciar
    this.verifyTokenOnInit();
  }

  /**
   * Login del usuario - Intenta MongoDB primero, luego PostgreSQL si falla
   */
  login(credentials: LoginCredentials): Observable<LoginResponse> {
    /**
     * Login del usuario - Primero Postgres, Luego mongo
     */
    return this.http.post<LoginResponse>(`${this.API_URL_MG}/login`, credentials)
      .pipe(
        tap(response => this.manejarRespuestas(response, this.API_URL_PG)),
        catchError((pgError: HttpErrorResponse) => {
          if(pgError.status === 0 || pgError.status >= 500){
            console.warn("Postgres no respondio por fallos en el server pasamos a mongo");
            this.currentApiUrl = this.API_URL_MG;
            return this.http.post<LoginResponse>(`${this.API_URL_MG}/login`, credentials).pipe(
              tap(response => this.manejarRespuestas(response, this.API_URL_MG)),
              catchError(mgError => throwError(() => mgError))
            );
          }
          return throwError(() => pgError);
        })
      );
  }

  private manejarRespuestas(response: LoginResponse, apiUrl: string) {
    if(response.success && response.token){
      const db_type = apiUrl.includes('/pg/') ? 'PostgresSql' : 'MongoDb';

      console.log(`Login exitoso con ${db_type}`);

      this.currentApiUrl = apiUrl;
      this.setToken(response.token);
      this.setUser(response.admin);
      this.currentUserSubject.next(response.admin);
      this.isAuthenticatedSubject.next(true);
    }
  }

  /**
   * Logout del usuario
   */
  logout(): void {
    this.removeToken();
    this.removeUser();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.hasValidToken();
  }

  /**
   * Obtener el token almacenado
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtener el usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtener el rol del usuario actual
   */
  getUserRole(): string | null {
    const user = this.getCurrentUser();
    return user ? user.rol : null;
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    const userRole = this.getUserRole();
    return userRole === role;
  }

  /**
   * Verificar si el usuario es super admin
   */
  isSuperAdmin(): boolean {
    const role = this.getUserRole();
    return role === 'super admin' || role === 'super_admin';
  }

  /**
   * Verificar si el usuario es logística
   */
  isLogistica(): boolean {
    return this.hasRole('logistica');
  }

  /**
   * Verificar el token con el servidor
   */
  verifyToken(): Observable<any> {
    return this.http.get(`${this.currentApiUrl}/verify`);
  }

  /**
   * Cambiar contraseña
   */
  changePassword(contra_actual: string, nueva_contra: string): Observable<any> {
    return this.http.put(`${this.currentApiUrl}/change-password`, {
      contra_actual,
      nueva_contra
    });
  }

  // Métodos privados

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  private setUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private removeUser(): void {
    localStorage.removeItem(this.USER_KEY);
  }

  private setDbType(dbType: string): void {
  // Eliminados métodos de tipo de BD
}
  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decodificar el token JWT para verificar la expiración
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationDate = new Date(payload.exp * 1000);
      return expirationDate > new Date();
    } catch (error) {
      return false;
    }
  }

  private verifyTokenOnInit(): void {
    const token = this.getToken();
    const user = this.getUserFromStorage();
    
    if (this.hasValidToken() && user) {
      console.log('AuthService - Token válido encontrado, restaurando sesión');
      console.log('AuthService - Usuario restaurado:', user);
      // Si hay token y usuario válidos, restaurar la sesión inmediatamente
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
      
      // Opcionalmente verificar con el servidor en segundo plano
      this.verifyToken().subscribe({
        next: (response) => {
          if (response.success && response.admin) {
            console.log('AuthService - Verificación con servidor exitosa');
            this.setUser(response.admin);
            this.currentUserSubject.next(response.admin);
          }
        },
        error: (err) => {
          console.warn('AuthService - Error verificando token con servidor:', err);
          // No hacer logout, mantener la sesión local si el token aún es válido
          if (!this.hasValidToken()) {
            this.logout();
          }
        }
      });
    } else if (!this.hasValidToken() && token) {
      // Si el token expiró, limpiar
      console.log('AuthService - Token expirado, limpiando sesión');
      this.logout();
    }
  }
}
