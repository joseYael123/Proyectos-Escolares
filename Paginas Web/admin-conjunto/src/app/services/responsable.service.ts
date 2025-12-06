import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Responsable } from '../interfaces/responable.interface';

@Injectable({
    providedIn: 'root'
})
export class ResponsableService{
    private apiUrl = "http://localhost:5000/pg/responsables";

    constructor(private http: HttpClient){}

    listarResponsables(): Observable<Responsable[]>{
        return this.http.get<Responsable[]>(this.apiUrl);
    }

    listarResponsablesId(id: number): Observable<Responsable[]>{
        return this.http.get<Responsable[]>(`${this.apiUrl}/${id}`);
    }

    crearResponsables(responsable: Responsable): Observable<Responsable>{
        return this.http.post<Responsable>(this.apiUrl, responsable)
    }

    actualizarResponsable(id: number, responsable: Responsable): Observable<Responsable>{
        return this.http.put<Responsable>(`${this.apiUrl}/${id}`, responsable)
    }

    borrarResponsable(id: number): Observable<Responsable>{
        return this.http.delete<Responsable>(`${this.apiUrl}/${id}`)
    }
}