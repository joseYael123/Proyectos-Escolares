import { HttpClient } from "@angular/common/http";
import { Injectable} from "@angular/core";
import { Observable } from "rxjs";
import { Vehiculo } from "../interfaces/vehiculo.interface";


@Injectable({
    providedIn: 'root'
})
export class VehiculoService{
    private apiUrlPg = "http://localhost:5000/pg/vehiculos";
    //private apiUrlMg = "http://localhost:5000/mg/vehiculos";

    constructor(private http: HttpClient){}

    listarVehiculos(): Observable<Vehiculo[]>{
        return this.http.get<Vehiculo[]>(this.apiUrlPg);
    }

    listarVehiculosId(id: number): Observable<Vehiculo[]>{
        return this.http.get<Vehiculo[]>(`${this.apiUrlPg}/${id}`)
    }

    crearVehiculos(vehiculo: Vehiculo): Observable<Vehiculo>{
        return this.http.post<Vehiculo>(this.apiUrlPg, vehiculo)
    }

    actualizarVehiculo(id: number, vehiculo: Vehiculo): Observable<Vehiculo>{
        return this.http.put<Vehiculo>(`${this.apiUrlPg}/${id}`, vehiculo)
    }

    deleteVehiculo(id: number): Observable<Vehiculo>{
        return this.http.delete<Vehiculo>(this.apiUrlPg + id)
    }
}