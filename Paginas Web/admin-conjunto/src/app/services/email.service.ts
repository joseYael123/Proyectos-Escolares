import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {
  private apiUrl = 'http://localhost:5000/email';

  constructor(private http: HttpClient) { }

  // Ahora es una función genérica para enviar o reenviar
  enviarCorreo(idEvento: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/enviar`, { id_evento: idEvento });
  }
}