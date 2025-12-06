import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { Guardia } from '../interfaces/guardia.interface';

@Injectable({
  providedIn: 'root'
})
export class GuardiaService {
  private apiUrlPg = 'http://localhost:5000/pg/guardias';
  private apiUrlMg = 'http://localhost:5000/mg/guardias'; // Mongo

  constructor(private http: HttpClient) { }

  obtenerGuardias(): Observable<Guardia[]> {
    return this.http.get<any>(this.apiUrlPg).pipe(map((r: any) => r.Datos || []));
  }

  obtenerGuardiaPorId(id: number): Observable<Guardia> {
    return this.http.get<any>(`${this.apiUrlPg}/${id}`).pipe(map((r: any) => r.Datos || r));
  }

  crearGuardia(guardia: Guardia, imagen?: File | null): Observable<Guardia> {
    const formData = this.crearFormData(guardia, imagen);
    
    const reqPg = this.http.post<any>(this.apiUrlPg, formData);
    const reqMg = this.http.post<any>(this.apiUrlMg, formData);

    return forkJoin([reqPg, reqMg]).pipe(map(res => res[0].Insercion || res[0]));
  }

  actualizarGuardia(id: number, guardia: Partial<Guardia>, imagen?: File | null): Observable<Guardia> {
    const formData = this.crearFormData(guardia, imagen);

    const reqPg = this.http.put<any>(`${this.apiUrlPg}/${id}`, formData);
    const reqMg = this.http.put<any>(`${this.apiUrlMg}/${id}`, formData);

    return forkJoin([reqPg, reqMg]).pipe(map(res => res[0].Datos || res[0]));
  }

  eliminarGuardia(id: number): Observable<any> {
    const reqPg = this.http.delete(`${this.apiUrlPg}/${id}`);
    const reqMg = this.http.delete(`${this.apiUrlMg}/${id}`);
    return forkJoin([reqPg, reqMg]).pipe(map(res => res[0]));
  }

  private crearFormData(guardia: Partial<Guardia>, imagen?: File | null): FormData {
    const formData = new FormData();
    Object.keys(guardia).forEach(key => {
      if (key !== 'id_guardia' && key !== 'imagen' && guardia[key as keyof Guardia] !== undefined) {
        formData.append(key, String(guardia[key as keyof Guardia]));
      }
    });
    if (imagen) formData.append('imagen', imagen, imagen.name);
    return formData;
  }
}