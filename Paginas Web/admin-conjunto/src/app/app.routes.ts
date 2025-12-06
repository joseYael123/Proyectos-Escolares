import { Routes } from '@angular/router';
import { Home } from './layout/home';
import { TablaAdmin } from './admin/tabla/tabla';
import { FormularioAdmin } from './admin/formulario/formulario';
import { TablaGuardia } from './guardia/tabla/tabla';
import { FormularioGuardia } from './guardia/formulario/formulario';
import {EventosLogistica} from './eventos/eventos';
import { AsignacionComponent } from './asignaciones/asignacion';
import { LoginComponent } from './auth/login/login';
import { authGuard, superAdminGuard, logisticaGuard, loginGuard } from './guards/auth.guard';
import { TablaEvento } from './eventosF/tabla/tabla';
import { TablaResponsable } from './responsable/tabla/tabla';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: 'home', component: Home, canActivate: [authGuard] },
  
  // Rutas solo para super admin - Administradores
  { path: 'admin', component: TablaAdmin, canActivate: [superAdminGuard] },
  { path: 'admin/crear', component: FormularioAdmin, canActivate: [superAdminGuard] },
  
  // Rutas solo para super admin - Guardias
  { path: 'guardia', component: TablaGuardia, canActivate: [superAdminGuard] },
  { path: 'guardia/crear', component: FormularioGuardia, canActivate: [superAdminGuard] },
  
  // Rutas para super admin y logística - Eventos y Asignaciones
  { path: 'eventos/revisar', component: EventosLogistica, canActivate: [logisticaGuard] },
  { path: 'asignacion', component: AsignacionComponent, canActivate: [logisticaGuard] },

  //Ruta para super admim solo - Evento
  {path: 'evento', component: TablaEvento, canActivate: [superAdminGuard]},

  //Ruta para admin y logistica
  {path: 'responsable', component: TablaResponsable, canActivate: [logisticaGuard]}
];
