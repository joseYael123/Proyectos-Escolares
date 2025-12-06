import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators'; // Importar map
import { Evento } from '../interfaces/evento.interface';

@Injectable({
  providedIn: 'root'
})
export class EventoService {
  private apiUrlPg = 'http://localhost:5000/pg/eventos';
  private apiUrlMg = 'http://localhost:5000/mg/eventos'; // Mongo

  constructor(private http: HttpClient) { }

  obtenerEventos(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.apiUrlPg);
  }

  obtenerEventoPorId(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.apiUrlPg}/${id}`);
  }

  crearEvento(evento: Evento): Observable<Evento> {
    // Creación inicial: Si quieres replicarla también
    const reqPg = this.http.post<Evento>(this.apiUrlPg, evento);
    const reqMg = this.http.post<Evento>(this.apiUrlMg, evento);
    return forkJoin([reqPg, reqMg]).pipe(map(res => res[0]));
  }

  // ESTA ES LA IMPORTANTE (QR, Estado, etc.)
  actualizarEvento(id: number, evento: Evento | FormData): Observable<Evento> {
    const reqPg = this.http.put<Evento>(`${this.apiUrlPg}/${id}`, evento);
    const reqMg = this.http.put<Evento>(`${this.apiUrlMg}/${id}`, evento);
    
    return forkJoin([reqPg, reqMg]).pipe(map(res => res[0]));
  }

  eliminarEvento(id: number): Observable<any> {
    const reqPg = this.http.delete(`${this.apiUrlPg}/${id}`);
    const reqMg = this.http.delete(`${this.apiUrlMg}/${id}`);
    return forkJoin([reqPg, reqMg]).pipe(map(res => res[0]));
  }
}