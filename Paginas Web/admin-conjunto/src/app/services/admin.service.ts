import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { Admin } from '../interfaces/admin.interface';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrlPg = 'http://localhost:5000/pg/admins'; 
  private apiUrlMg = 'http://localhost:5000/mg/admins'; // URL Mongo

  constructor(private http: HttpClient) { }

  // GET (Solo leemos de Postgres como fuente de verdad)
  obtenerAdmins(): Observable<Admin[]> {
    return this.http.get<any>(this.apiUrlPg).pipe(
      map((response: any) => response.Datos || [])
    );
  }

  obtenerAdminPorId(id: number): Observable<Admin> {
    return this.http.get<any>(`${this.apiUrlPg}/${id}`).pipe(
      map((response: any) => response.Datos || response)
    );
  }

  // POST: Crear en ambos
  crearAdmin(admin: Admin, imagen?: File | null): Observable<Admin> {
    const formData = this.crearFormData(admin, imagen);
    
    // Peticiones paralelas
    const reqPg = this.http.post<Admin>(this.apiUrlPg, formData);
    const reqMg = this.http.post<Admin>(this.apiUrlMg, formData);

    // forkJoin espera a ambas. Retornamos la respuesta de PG (res[0]) para la UI
    return forkJoin([reqPg, reqMg]).pipe(map(res => res[0]));
  }

  // PUT: Actualizar en ambos
  actualizarAdmin(id: number, admin: Admin, imagen?: File | null): Observable<Admin> {
    let dataToSend: any;

    if (imagen) {
      dataToSend = this.crearFormData(admin, imagen);
    } else {
      dataToSend = {
        nom_admin: admin.nom_admin,
        app_admin: admin.app_admin,
        apm_admin: admin.apm_admin,
        correo: admin.correo,
        usuario_admin: admin.usuario_admin,
        rol: admin.rol,
        estado: admin.estado
      };
      if (admin.contra_admin) dataToSend.contra_admin = admin.contra_admin;
    }
    
    const reqPg = this.http.put<any>(`${this.apiUrlPg}/${id}`, dataToSend);
    // Asumiendo que en Mongo usas el mismo ID numérico para buscar
    const reqMg = this.http.put<any>(`${this.apiUrlMg}/${id}`, dataToSend);

    return forkJoin([reqPg, reqMg]).pipe(
      map(res => res[0].Datos || res[0])
    );
  }

  // DELETE: Eliminar de ambos
  eliminarAdmin(id: number): Observable<any> {
    const reqPg = this.http.delete<any>(`${this.apiUrlPg}/${id}`);
    const reqMg = this.http.delete<any>(`${this.apiUrlMg}/${id}`);

    return forkJoin([reqPg, reqMg]).pipe(map(res => res[0]));
  }

  // Helper para no repetir código del FormData
  private crearFormData(admin: Admin, imagen?: File | null): FormData {
    const formData = new FormData();
    formData.append('nom_admin', admin.nom_admin || '');
    formData.append('app_admin', admin.app_admin || '');
    if (admin.apm_admin) formData.append('apm_admin', admin.apm_admin);
    formData.append('correo', admin.correo || '');
    formData.append('usuario_admin', admin.usuario_admin || '');
    formData.append('contra_admin', admin.contra_admin || '');
    formData.append('rol', admin.rol || 'logistica');
    formData.append('estado', admin.estado || 'ACTIVO');
    if (imagen) formData.append('imagen', imagen, imagen.name);
    return formData;
  }
}