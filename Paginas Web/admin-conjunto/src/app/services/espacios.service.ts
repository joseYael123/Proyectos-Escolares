import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { Espacio_esta } from '../interfaces/espacio.interface';

@Injectable({
  providedIn: "root"
})
export class Espacios_estacionamiento{
  private apiUrlPg = "http://localhost:5000/pg/espacios";
  private apiUrlMg = "http://localhost:5000/mg/espacios"; // Mongo

  constructor(private http: HttpClient){}

  listarEspacios(): Observable<Espacio_esta[]>{
    return this.http.get<Espacio_esta[]>(this.apiUrlPg)
  }

  listarEspaciosId(id: number): Observable<Espacio_esta[]>{
    return this.http.get<Espacio_esta[]>(this.apiUrlPg + id)
  }

  // Actualizar estado (Disponible/Ocupado) en ambos
  actualizarEspacios(id: number, espacio: Espacio_esta): Observable<Espacio_esta>{
    const reqPg = this.http.put<Espacio_esta>(`${this.apiUrlPg}/${id}`, espacio);
    const reqMg = this.http.put<Espacio_esta>(`${this.apiUrlMg}/${id}`, espacio);
    
    return forkJoin([reqPg, reqMg]).pipe(map(res => res[0]));
  }
}