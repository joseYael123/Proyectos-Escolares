import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

/**
 * Servicio base que maneja la lógica de failover entre PostgreSQL y MongoDB
 */
@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  protected readonly BASE_URL_PG = 'http://localhost:5000/pg';
  protected readonly BASE_URL_MG = 'http://localhost:5000/mg';
  
  constructor(protected http: HttpClient) {}

  /**
   * Realiza una petición GET con failover automático
   */
  protected getWithFailover<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.BASE_URL_PG}${endpoint}`)
      .pipe(
        catchError(() => {
          console.warn(`Failover: usando MongoDB para GET ${endpoint}`);
          return this.http.get<T>(`${this.BASE_URL_MG}${endpoint}`);
        })
      );
  }

  /**
   * Realiza una petición POST con failover automático
   * Si PostgreSQL está disponible, inserta en ambas BD
   */
  protected postWithFailover<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.BASE_URL_PG}${endpoint}`, data)
      .pipe(
        catchError(() => {
          console.warn(`Failover: usando solo MongoDB para POST ${endpoint}`);
          return this.http.post<T>(`${this.BASE_URL_MG}${endpoint}`, data);
        })
      );
  }

  /**
   * Realiza una petición PUT con failover automático
   */
  protected putWithFailover<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.BASE_URL_PG}${endpoint}`, data)
      .pipe(
        catchError(() => {
          console.warn(`Failover: usando MongoDB para PUT ${endpoint}`);
          return this.http.put<T>(`${this.BASE_URL_MG}${endpoint}`, data);
        })
      );
  }

  /**
   * Realiza una petición DELETE con failover automático
   */
  protected deleteWithFailover<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.BASE_URL_PG}${endpoint}`)
      .pipe(
        catchError(() => {
          console.warn(`Failover: usando MongoDB para DELETE ${endpoint}`);
          return this.http.delete<T>(`${this.BASE_URL_MG}${endpoint}`);
        })
      );
  }

  /**
   * Obtiene el tipo de base de datos actualmente en uso
   */
  getActiveDatabase(): string {
    return localStorage.getItem('db_type') || 'postgresql';
  }
}
