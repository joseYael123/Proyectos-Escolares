import { Injectable } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, forkJoin, of } from "rxjs"; // Importar 'of'
import { map, catchError } from 'rxjs/operators'; // Importar 'catchError'
import { Reserva_evento } from "../interfaces/reserva.interface";

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private apiUrlPg = 'http://localhost:5000/pg/reservas'; 
  private apiUrlMg = 'http://localhost:5000/mg/reservas';

  private apiDisponibilidad = 'http://localhost:5000/pg/disponibilidad';

  constructor(private http: HttpClient){}

  obtenerReservas(): Observable<Reserva_evento[]> {
      return this.http.get<Reserva_evento[]>(this.apiUrlPg);
  }

  obtenerReservasPorId(id: number): Observable<Reserva_evento[]> {
      return this.http.get<Reserva_evento[]>(`${this.apiUrlPg}/${id}`)
  }
  
  crearReservas(reserva: Reserva_evento): Observable<Reserva_evento> {
      const reqPg = this.http.post<Reserva_evento>(this.apiUrlPg, reserva);
      const reqMg = this.http.post<Reserva_evento>(this.apiUrlMg, reserva).pipe(
          catchError(err => {
              console.warn('⚠️ Error creando en Mongo (continuando con PG):', err);
              return of(null);
          })
      );
      return forkJoin([reqPg, reqMg]).pipe(map(res => res[0]));
  }

  // AQUÍ SE SINCRONIZAN LAS HORAS
  actualizarReserva(id: number, reserva: Reserva_evento) {
      const reqPg = this.http.put<Reserva_evento>(`${this.apiUrlPg}/${id}`, reserva);
      
      // "Soft Sync": Si falla Mongo, no rompemos el flujo
      const reqMg = this.http.put<Reserva_evento>(`${this.apiUrlMg}/${id}`, reserva).pipe(
          catchError(error => {
              console.warn(`⚠️ Falló la actualización en Mongo (ID: ${id}) - Probablemente desincronización de IDs.`);
              // Retornamos null para que forkJoin complete exitosamente
              return of(null); 
          })
      );

      return forkJoin([reqPg, reqMg]).pipe(map(res => res[0]));
  }

  borrarReserva(id: number): Observable<any> {
      const reqPg = this.http.delete<any>(`${this.apiUrlPg}/${id}`);
      const reqMg = this.http.delete<any>(`${this.apiUrlMg}/${id}`).pipe(
          catchError(err => of(null))
      );
      return forkJoin([reqPg, reqMg]).pipe(map(res => res[0]));
  }

  obtenerDetalleDia(fecha: string): Observable<any> {
      const params = new HttpParams().set('fecha', fecha);
      return this.http.get<any>(`${this.apiDisponibilidad}/dia`, { params });
  }
}