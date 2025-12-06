import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Evento } from '../interfaces/evento.interface';
import { EventoService } from '../services/evento.service';
import { ReservaService } from '../services/reserva.service';
import { EmailService } from '../services/email.service';
import { RedNService } from '../services/redN.service';
// 1. IMPORTAR SERVICIO DE ASIGNACIÓN
import { Asignacion } from '../services/asignacion.service'; 
import { forkJoin } from 'rxjs';
import * as QRCode from 'qrcode'; 
import { Vehiculo } from '../interfaces/vehiculo.interface';
import { VehiculoService } from '../services/vehiculo.service';

interface VehiculoRedNeuronal extends Vehiculo {
    prediccionTexto?: string;   
    prediccionClase?: string;   
    loadingPrediccion?: boolean;
    placasred?: any;
    marca?: string; 
}

const MAPEOS_ESTADOS: any = {
  'AGS': 'Aguascalientes', 'BCN': 'Baja California', 'BCS': 'Baja California Sur',
  'CAM': 'Campeche', 'CHP': 'Chiapas', 'CHH': 'Chihuahua', 'COA': 'Coahuila',
  'COL': 'Colima', 'CDX': 'Ciudad de México', 'DUR': 'Durango', 'GUA': 'Guanajuato',
  'GRO': 'Guerrero', 'HID': 'Hidalgo', 'JAL': 'Jalisco', 'MEX': 'Estado de México',
  'MIC': 'Michoacán', 'MOR': 'Morelos', 'NAY': 'Nayarit', 'NLE': 'Nuevo León',
  'OAX': 'Oaxaca', 'PUE': 'Puebla', 'QUE': 'Querétaro', 'ROO': 'Quintana Roo',
  'SLP': 'San Luis Potosí', 'SIN': 'Sinaloa', 'SON': 'Sonora', 'TAB': 'Tabasco',
  'TAM': 'Tamaulipas', 'TLA': 'Tlaxcala', 'VER': 'Veracruz', 'YUC': 'Yucatán',
  'ZAC': 'Zacatecas'  
};

@Component({
  selector: 'app-eventos-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './eventos.html',
  styleUrls: ['./eventos.css']
})
export class EventosLogistica implements OnInit {
  private apiUrlBase = 'http://localhost:5000';
  
  eventos: Evento[] = [];
  allEventos: Evento[] = [];
  categorias: string[] = [];
  
  ordenSeleccionado = 'Seleccionar';
  categoriaSeleccionada = '';
  busqueda = '';

  updatingIds = new Set<number>();
  sendingEmailIds = new Set<number>();
  isLoading = false;

  modalVehiculos: boolean = false;
  vehiculosResponsable: VehiculoRedNeuronal[] = [];
  nombreResponsableActual: string = '';
  loadingVehiculos: boolean = false;

  toastMessage: string | null = null;
  toastType: 'success' | 'error' | null = null;
  private toastTimer: any = null;

  confirmVisible = false;
  confirmEvento: Evento | null = null;
  confirmNewState = '';
  confirmLabel = '';

  // Mapa para guardar conteo de asignaciones por evento
  private mapaAsignaciones: Map<number, number> = new Map();

  constructor(
    private eventoService: EventoService, 
    private reservaService: ReservaService,
    private emailService: EmailService, 
    private cd: ChangeDetectorRef,
    private vehiculoService : VehiculoService,
    private redN: RedNService,
    private asignacionService: Asignacion // <--- Inyectar servicio
  ) {}

  ngOnInit(): void {
    this.loadEventos();
  }

  // --- MODAL VEHÍCULOS ---
  mostrarVehiculosModal(evento: Evento) {
    if (!evento.id_responsable) {
          this.showToast('Este evento no tiene responsable asignado.', 'error');
          return;
      }

      this.modalVehiculos = true;
      this.loadingVehiculos = true;
      this.vehiculosResponsable = [];
      this.nombreResponsableActual = `Responsable ID: ${evento.id_responsable}`; 

      this.vehiculoService.listarVehiculosId(evento.id_responsable).subscribe({
          next: (res: any) => {
              const data = this.extraerDatos(res);
              this.vehiculosResponsable = data.map((v: any) => ({
                  ...v, 
                  prediccionTexto: '', 
                  prediccionClase: '',
                  loadingPrediccion: false,
                  placasred: [],
                  marca: v.marca || 'Desconocida' 
              }));
              
              this.loadingVehiculos = false;
              this.cd.detectChanges();
          },
          error: (err) => {
              console.error('Error cargando vehículos:', err);
              this.showToast('Error al cargar vehículos.', 'error');
              this.loadingVehiculos = false;
              this.cd.detectChanges(); 
          }
      }); 
  }

  cerrarModal(){
    this.modalVehiculos = false;
  }

  // --- IA Y PREDICCIONES ---
  predecirEstado(vehiculo: VehiculoRedNeuronal){
    vehiculo.loadingPrediccion = true;
    const payload = { placas: [vehiculo.placas] };

    this.redN.mandarPrediccion(payload as any).subscribe({
      next: (datos: any) => {
        let results = '';
        if(Array.isArray(datos) && datos.length > 0) results = datos[0];
        else if (datos.resultados && Array.isArray(datos.resultados) && datos.resultados.length > 0) results = datos.resultados[0].estado_predicho || datos.resultados[0];
        else if(datos.predicciones && Array.isArray(datos.predicciones) && datos.predicciones.length > 0) results = datos.predicciones[0];
        else if(datos.estado_predicho) results = datos.estado_predicho; 
        else if(datos.estado) results = datos.estado;
        else results = String(datos);

        if (typeof results === 'object' && results !== null) {
            const r: any = results;
            results = r.estado_predicho || r.estado || JSON.stringify(r);
        }

        const codigoEstado = (results || '').toString().replace(/"/g, '').trim().toUpperCase();
        const nombreCompleto = MAPEOS_ESTADOS[codigoEstado];

        if(nombreCompleto){
          vehiculo.prediccionTexto = nombreCompleto;
          vehiculo.prediccionClase = 'badge bg-info text-dark border border-info';
        } else {
            vehiculo.prediccionTexto = `Predicción: ${codigoEstado || 'Desconocido'}`;
            vehiculo.prediccionClase = 'badge bg-secondary';
        }
        
        vehiculo.loadingPrediccion = false;
        this.cd.detectChanges(); 
      }, 
      error: (erro) => {
            console.error('Error IA:', erro);
            vehiculo.prediccionTexto = 'Error de conexión con IA';
            vehiculo.prediccionClase = 'badge bg-danger';
            vehiculo.loadingPrediccion = false;
            this.cd.detectChanges();
      }
    });
  }

  analizarPlaca(vehiculo: VehiculoRedNeuronal) { this.predecirEstado(vehiculo); }
  predecirPlaca(vehiculo: VehiculoRedNeuronal) { this.predecirEstado(vehiculo); }

  // --- LÓGICA DE EVENTOS ---

  esHorarioPlaceholder(evento: Evento): boolean {
    if (!evento.reserva?.periodo_start || !evento.reserva?.periodo_end) return true;
    const inicio = new Date(evento.reserva.periodo_start);
    const fin = new Date(evento.reserva.periodo_end);
    return inicio.getHours() === 9 && fin.getHours() === 23;
  }

  loadEventos(): void {
    this.isLoading = true;
    forkJoin({
      eventosData: this.eventoService.obtenerEventos(),
      reservasData: this.reservaService.obtenerReservas(),
      // 2. TRAER ASIGNACIONES TAMBIÉN
      asignacionesData: this.asignacionService.obtenerAsignaciones()
    }).subscribe({
      next: ({ eventosData, reservasData, asignacionesData }) => {
        const rawEventos = this.extraerDatos(eventosData);
        const rawReservas = this.extraerDatos(reservasData);
        const rawAsignaciones = this.extraerDatos(asignacionesData);
        
        const mapaReservas = new Map<number, any>();
        rawReservas.forEach((r: any) => {
          if (r.id_evento) mapaReservas.set(r.id_evento, r); 
        });

        // Procesar conteo de asignaciones activas por evento
        this.mapaAsignaciones.clear();
        rawAsignaciones.forEach((a: any) => {
            // Solo contamos asignaciones que no han sido liberadas (o histórico si prefieres)
            // Asumiendo que queremos validar que se hayan asignado lugares para HOY/FUTURO.
            // Si quieres validar histórico también, quita el chequeo de fecha_liberacion.
            if (a.id_evento) {
                const current = this.mapaAsignaciones.get(a.id_evento) || 0;
                this.mapaAsignaciones.set(a.id_evento, current + 1);
            }
        });

        this.allEventos = rawEventos.map((ev: any) => {
          const reservaEncontrada = mapaReservas.get(ev.id_evento);
          if (reservaEncontrada && !ev.reserva) {
            ev.reserva = reservaEncontrada;
          }
          return ev;
        });
        this.applyFilters();
        this.categorias = Array.from(new Set(this.allEventos.map(e => e.categoria_evento).filter((v): v is string => !!v)));
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.showToast('Error al cargar la información', 'error');
        this.cd.detectChanges();
      }
    });
  }

  private extraerDatos(payload: any): any[] {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (payload.Datos) return Array.isArray(payload.Datos) ? payload.Datos : [payload.Datos];
    if (payload.data) return Array.isArray(payload.data) ? payload.data : [payload.data];
    return [];
  }

  getQrUrl(rutaRelativa?: string): string {
    if (!rutaRelativa) return '';
    let urlFinal = rutaRelativa.startsWith('http') ? rutaRelativa : `${this.apiUrlBase}${rutaRelativa.startsWith('/') ? '' : '/'}${rutaRelativa}`;
    return urlFinal;
  }

  reenviarCorreo(evento: Evento) {
    const id = evento.id_evento;
    if (!id) return;
    if (this.sendingEmailIds.has(id)) return;
    this.sendingEmailIds.add(id);

    this.emailService.enviarCorreo(id).subscribe({
      next: (res) => {
        this.showToast('Correo enviado exitosamente', 'success');
        this.sendingEmailIds.delete(id);
        this.cd.detectChanges();
      },
      error: (err) => {
        const msg = err.error?.msg || 'Error al enviar el correo';
        this.showToast(msg, 'error');
        this.sendingEmailIds.delete(id);
        this.cd.detectChanges();
      }
    });
  }

  isSendingEmail(id?: number): boolean { return id != null && this.sendingEmailIds.has(id); }

  // =========================================================
  // ACTUALIZACIÓN SIMPLE
  // =========================================================
  ejecutarActualizacion(id: number, data: Evento | FormData): void {
    if (!id) return;
    
    if (this.updatingIds.has(id)) {
        console.warn(`⏳ Actualización en progreso para evento ${id}.`);
        return;
    }
    this.updatingIds.add(id);

    this.eventoService.actualizarEvento(id, data).subscribe({
      next: (res) => {
        this.showToast('Evento actualizado', 'success');
        this.updatingIds.delete(id);
        this.loadEventos(); 
      },
      error: (err) => {
        console.error('Error al actualizar:', err);
        this.showToast('Error al actualizar evento', 'error');
        this.updatingIds.delete(id);
        this.cd.detectChanges();
      }
    });
  }

  // =========================================================
  // GENERACIÓN DE DOBLE QR (CANVAS) + ENVÍO
  // =========================================================
  async generarQrYEnviarMultipart(ev: Evento, nuevoEstado: string) {
    const id = (ev as any).id_evento;
    if(!id) return;

    if (this.updatingIds.has(id)) return;
    this.updatingIds.add(id);

    try {
      console.log('1. Generando QRs para evento:', ev.nombre_evento);
      const folio = ev.folio_evento || `EV-${id}`;

      const datosEntrada = {
        tipo: 'ENTRADA', 
        nombre: ev.nombre_evento,
        folio: folio, 
        inicio: ev.reserva?.periodo_start,
        fin: ev.reserva?.periodo_end
      };
      const base64Entrada = await QRCode.toDataURL(JSON.stringify(datosEntrada), { width: 250, margin: 1 });

      const datosSalida = {
        tipo: 'SALIDA', 
        folio: folio
      };
      const base64Salida = await QRCode.toDataURL(JSON.stringify(datosSalida), { width: 250, margin: 1 });

      const blobCombinado = await this.combinarQrsEnImagen(base64Entrada, base64Salida, ev.nombre_evento || '');

      const formData = new FormData();
      formData.append('nombre_evento', ev.nombre_evento || '');
      formData.append('descripcion', ev.descripcion || '');
      formData.append('categoria_evento', ev.categoria_evento || '');
      const admision = ev.tipo_de_admision || ev.tipo_admision || '';
      formData.append('tipo_de_admision', admision);
      formData.append('estado', nuevoEstado);
      if (ev.folio_evento) formData.append('folio_evento', ev.folio_evento);
      
      formData.append('qr_imagen', blobCombinado, `accesos_${folio}.png`);
      formData.append('qr_evento', JSON.stringify(datosEntrada));

      this.eventoService.actualizarEvento(id, formData).subscribe({
        next: (res) => {
            this.showToast('Accesos generados. Enviando correo...', 'success');
            setTimeout(() => {
                this.emailService.enviarCorreo(id).subscribe({
                    next: () => this.showToast('¡Correo enviado con ambos accesos!', 'success'),
                    error: (mailErr) => {
                        const errorMsg = mailErr.error?.msg || mailErr.message;
                        this.showToast(`Error correo: ${errorMsg}`, 'error');
                    }
                });
            }, 500);

            this.updatingIds.delete(id);
            this.loadEventos();
        },
        error: (err) => {
            console.error('Error al guardar:', err);
            this.showToast('Error al generar accesos', 'error');
            this.updatingIds.delete(id);
            this.cd.detectChanges();
        }
      });

    } catch (error) {
      console.error('Error local:', error);
      this.showToast('Error generando imagen', 'error');
      if(id) this.updatingIds.delete(id);
      this.cd.detectChanges();
    }
  }

  private combinerQrsEnImagen(b64Entrada: string, b64Salida: string, tituloEvento: string = ''): Promise<Blob> {
      return new Promise((resolve, reject) => {
          const img1 = new Image();
          const img2 = new Image();
          
          img1.onload = () => {
              img2.onload = () => {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if(!ctx) { reject('No canvas context'); return; }

                  const width = 600;
                  const height = 400;
                  canvas.width = width;
                  canvas.height = height;

                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(0, 0, width, height);

                  ctx.fillStyle = '#000000';
                  ctx.font = 'bold 20px Arial';
                  ctx.textAlign = 'center';
                  ctx.fillText(`ACCESOS: ${tituloEvento}`, width / 2, 40);

                  ctx.fillStyle = '#198754'; 
                  ctx.font = 'bold 18px Arial';
                  ctx.fillText('ENTRADA', 150, 80);

                  ctx.fillStyle = '#dc3545'; 
                  ctx.fillText('SALIDA', 450, 80);

                  ctx.drawImage(img1, 25, 100, 250, 250);
                  ctx.drawImage(img2, 325, 100, 250, 250);

                  ctx.lineWidth = 2;
                  ctx.strokeStyle = '#198754';
                  ctx.strokeRect(25, 100, 250, 250);
                  
                  ctx.strokeStyle = '#dc3545';
                  ctx.strokeRect(325, 100, 250, 250);

                  canvas.toBlob((blob) => {
                      if(blob) resolve(blob);
                      else reject('Error creating blob');
                  }, 'image/png');
              };
              img2.src = b64Salida;
          };
          img1.src = b64Entrada;
      });
  }

  private combinarQrsEnImagen(a: string, b: string, t: string) {
      return this.combinerQrsEnImagen(a, b, t);
  }

  private dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) { ia[i] = byteString.charCodeAt(i); }
    return new Blob([ab], { type: mimeString });
  }

  // --- CONFIRMACIONES UI ---
  promptConfirm(ev: Evento, nuevoEstado: string, label: string) {
    // 3. VALIDACIÓN: HORA ASIGNADA
    if (nuevoEstado === 'Confirmado' && this.esHorarioPlaceholder(ev)) {
        alert('⚠️ Debes asignar un horario real antes de confirmar el evento.');
        return;
    }

    // 4. VALIDACIÓN NUEVA: ESPACIOS ASIGNADOS
    // Verificamos que tenga al menos tantos espacios como vehículos requiere la reserva.
    if (nuevoEstado === 'Confirmado') {
        const id = (ev as any).id_evento;
        const espaciosAsignados = this.mapaAsignaciones.get(id) || 0;
        const espaciosRequeridos = ev.reserva?.cant_vehiculos || 0;

        if (espaciosRequeridos > 0 && espaciosAsignados < espaciosRequeridos) {
             alert(`⚠️ No puedes confirmar.\n\nEspacios requeridos: ${espaciosRequeridos}\nEspacios asignados: ${espaciosAsignados}\n\nPor favor ve a "Asignar Espacios" y completa la asignación.`);
             return;
        }
    }

    this.confirmEvento = { ...ev }; 
    this.confirmNewState = nuevoEstado;
    this.confirmLabel = label;
    this.confirmVisible = true;
  }

  confirmAction() {
    if (!this.confirmEvento || !this.confirmNewState) {
      this.closeConfirm(); return;
    }
    const eventoAProcesar = this.confirmEvento;
    const estado = this.confirmNewState;
    const id = eventoAProcesar.id_evento!;

    if (this.updatingIds.has(id)) return;

    this.closeConfirm();

    if (estado === 'Confirmado') {
      this.generarQrYEnviarMultipart(eventoAProcesar, estado);
    } else {
      eventoAProcesar.estado = estado;
      if (estado === 'Denegado' || estado === 'Denegar') {
        (eventoAProcesar as any).qr_evento = null; 
        (eventoAProcesar as any).qr_imagen = null; 
      }
      this.ejecutarActualizacion(id, eventoAProcesar);
    }
  }

  closeConfirm() { this.confirmVisible = false; this.confirmEvento = null; this.confirmNewState = ''; }
  onFilterChange(): void { this.applyFilters(); }
  buscar(): void { this.applyFilters(); }
  mostrarTodos(): void {
    this.busqueda = ''; this.categoriaSeleccionada = ''; this.ordenSeleccionado = 'Seleccionar'; this.eventos = [...this.allEventos]; 
  }
  private applyFilters(): void {
    let filtered = [...this.allEventos];
    if (this.categoriaSeleccionada) filtered = filtered.filter(e => e.categoria_evento === this.categoriaSeleccionada);
    if (this.busqueda) filtered = filtered.filter(e => (e.nombre_evento || '').toLowerCase().includes(this.busqueda.toLowerCase()));
    if (this.ordenSeleccionado !== 'Seleccionar') {
        filtered.sort((a, b) => {
            if (this.ordenSeleccionado === 'Nombre (A-Z)') return (a.nombre_evento || '').localeCompare(b.nombre_evento || '');
            if (this.ordenSeleccionado === 'Nombre (Z-A)') return (b.nombre_evento || '').localeCompare(a.nombre_evento || '');
            if (this.ordenSeleccionado === 'Fecha más reciente') return this.getPeriodoStart(b) - this.getPeriodoStart(a);
            if (this.ordenSeleccionado === 'Fecha más antigua') return this.getPeriodoStart(a) - this.getPeriodoStart(b);
            return 0;
        });
    }
    this.eventos = filtered;
  }
  getEstadoBadge(estado?: string): string {
    const e = (estado || '').toString().toLowerCase();
    if (e === 'pendiente') return 'bg-warning text-dark';
    if (e === 'confirmado') return 'bg-success';
    if (e === 'denegado' || e === 'denegar') return 'bg-danger';
    return 'bg-secondary';
  }
  getEstadoActions(ev: Evento) {
    const e = (ev?.estado || '').toString().toLowerCase();
    if (e === 'confirmado') return { btn1: { value: 'Pendiente', label: 'A pendiente', cls: 'btn btn-sm btn-warning' }, btn2: { value: 'Denegado', label: 'Denegar', cls: 'btn btn-sm btn-danger' } };
    if (e === 'denegado' || e === 'denegar') return { btn1: { value: 'Confirmado', label: 'Confirmar', cls: 'btn btn-sm btn-success' }, btn2: { value: 'Pendiente', label: 'A pendiente', cls: 'btn btn-sm btn-secondary' } };
    return { btn1: { value: 'Confirmado', label: 'Confirmar', cls: 'btn btn-sm btn-success' }, btn2: { value: 'Denegado', label: 'Rechazar', cls: 'btn btn-sm btn-danger' } };
  }
  isUpdating(id?: number): boolean { return id != null && this.updatingIds.has(id); }
  private getPeriodoStart(e: Evento): number {
    const raw = (e as any).reserva?.periodo_start ?? (e as any).periodo_start;
    if (!raw) return 0;
    return new Date(raw).getTime();
  }
  formatDuracion(d: any): string {
    if (d == null) return '';
    if (typeof d === 'object' && d.hours) return `${d.hours} h`;
    return String(d);
  }
  showToast(message: string, type: 'success' | 'error' = 'success') {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType = type;
    this.toastTimer = setTimeout(() => { this.toastMessage = null; }, 3500);
  }
}