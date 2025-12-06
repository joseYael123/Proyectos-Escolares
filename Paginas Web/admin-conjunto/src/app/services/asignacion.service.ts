import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { Asignacion_espacio } from '../interfaces/asignacion.interface';

@Injectable({
  providedIn: 'root'
})
export class Asignacion {
  private apiUrlPg = "http://localhost:5000/pg/asignaciones";
  private apiUrlMg = "http://localhost:5000/mg/asignaciones"; // Mongo

  constructor(private http: HttpClient){}

  obtenerAsignaciones(): Observable<Asignacion_espacio[]>{
    return this.http.get<Asignacion_espacio[]>(this.apiUrlPg)
  }

  obtenerAsignacionesId(id: number): Observable<Asignacion_espacio[]>{
    return this.http.get<Asignacion_espacio[]>(this.apiUrlPg + id) 
  }

  // Crear Asignación en ambos
  crearAsignaciones(asignacion: Asignacion_espacio): Observable<Asignacion_espacio>{
    const reqPg = this.http.post<Asignacion_espacio>(this.apiUrlPg, asignacion);
    const reqMg = this.http.post<Asignacion_espacio>(this.apiUrlMg, asignacion);
    return forkJoin([reqPg, reqMg]).pipe(map(res => res[0]));
  }

  // Actualizar (Liberar) en ambos
  actualizarAsignaciones(id: number, asignacion: Asignacion_espacio | FormData): Observable<Asignacion_espacio>{
    const reqPg = this.http.put<Asignacion_espacio>(`${this.apiUrlPg}/${id}`, asignacion);
    const reqMg = this.http.put<Asignacion_espacio>(`${this.apiUrlMg}/${id}`, asignacion);
    return forkJoin([reqPg, reqMg]).pipe(map(res => res[0]));
  }

  // Si usaras Delete físico
  borrarAsignacion(id: number): Observable<Asignacion_espacio>{
    const reqPg = this.http.delete<Asignacion_espacio>(`${this.apiUrlPg}/${id}`);
    const reqMg = this.http.delete<Asignacion_espacio>(`${this.apiUrlMg}/${id}`);
    return forkJoin([reqPg, reqMg]).pipe(map(res => res[0]));
  }
}