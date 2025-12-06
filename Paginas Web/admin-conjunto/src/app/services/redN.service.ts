import {Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable} from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class RedNService{
    private redUrl = 'http://localhost:8000/redN/batch';

    constructor(private httpProto: HttpClient){}

    mandarPrediccion(datos: any): Observable<any>{
        return this.httpProto.post<any>(this.redUrl,datos)
    }

}