import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Asignacion } from '../../services/asignacion.service';
import { Espacios_estacionamiento } from '../../services/espacios.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { forkJoin } from 'rxjs';

interface EspacioVisual {
  id_espacio: number;
  numero: string; // String para "01", "02"
  disponible: boolean;
  ocupadoPor?: string;
  tipo: string;
  id_asignacion?: number;
  esReservadoSistema?: boolean;
  esInhabilitadoBD?: boolean;
}

@Component({
  selector: 'app-asignacion-espacios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './espacios.html',
  styleUrls: ['./espacios.css']
})
export class AsignacionEspaciosComponent implements OnInit {
  
  @Input() evento: any; 
  @Output() onClose = new EventEmitter<void>(); 

  fechaAsignacion: string = '';
  espaciosVisuales: EspacioVisual[] = [];
  
  todosVehiculosResponsable: any[] = []; 
  vehiculosDisponibles: any[] = [];      
  idVehiculoSeleccionado: number | null = null;
  
  totalAsignadosEvento: number = 0; 
  capacidadTotal: number = 0;
  idsVehiculosOcupadosGlobalmente = new Set<number>(); 

  isLoading: boolean = false;
  idLotSeleccionado: number = 2; 
  
  modalConfirmarVisible: boolean = false;
  modalLiberarVisible: boolean = false;
  
  espacioSeleccionado: EspacioVisual | null = null;

  constructor(
    private asignacionService: Asignacion,
    private espaciosService: Espacios_estacionamiento,
    private vehiculoService: VehiculoService,
    private cd: ChangeDetectorRef
  ) {}

  get ocupacionVisual(): number {
    if (this.modalConfirmarVisible && this.espacioSeleccionado && !this.espacioSeleccionado.id_asignacion) {
      return this.totalAsignadosEvento + 1;
    }
    return this.totalAsignadosEvento;
  }

  ngOnInit(): void {
    if (this.evento && this.evento.reserva) {
      const rawDate = this.evento.reserva.periodo_start;
      this.fechaAsignacion = this.formatearFecha(rawDate);
      this.capacidadTotal = Number(this.evento.reserva.cant_vehiculos) || 0;
      this.cargarDatosIniciales();
    }
  }

  private formatearFecha(fecha: string | Date): string {
      if (!fecha) return '';
      const d = new Date(fecha);
      return d.toISOString().split('T')[0]; 
  }

  cambiarLote(id: number) {
    this.idLotSeleccionado = id;
    this.cargarMapa();
  }

  cargarDatosIniciales() {
    this.isLoading = true;
    forkJoin({
        espaciosResp: this.espaciosService.listarEspacios(),
        asignacionesResp: this.asignacionService.obtenerAsignaciones(),
        vehiculosResp: this.vehiculoService.listarVehiculos()
    }).subscribe({
        next: (res: any) => {
            const todosVehiculos = this.extraerDatos(res.vehiculosResp);
            
            if (this.evento && this.evento.id_responsable) {
                this.todosVehiculosResponsable = todosVehiculos.filter((v: any) => 
                    v.id_responsable == this.evento.id_responsable
                );
            }

            this.procesarDatosCompletos(res.espaciosResp, res.asignacionesResp);
            this.isLoading = false;
            this.cd.detectChanges();
        },
        error: (err) => {
            console.error('Error inicial:', err);
            this.isLoading = false;
            this.cd.detectChanges();
        }
    });
  }

  cargarMapa() {
    forkJoin({
      espaciosResp: this.espaciosService.listarEspacios(),
      asignacionesResp: this.asignacionService.obtenerAsignaciones()
    }).subscribe({
      next: (res: any) => {
        this.procesarDatosCompletos(res.espaciosResp, res.asignacionesResp);
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error recargando mapa:', err)
    });
  }

  private procesarDatosCompletos(espaciosResp: any, asignacionesResp: any) {
    const espacios = this.extraerDatos(espaciosResp);
    const asignaciones = this.extraerDatos(asignacionesResp);

    // 1. ASIGNACIONES ACTIVAS HOY
    const asignacionesActivasDelDia = asignaciones.filter((a: any) => {
        if (!a.fecha_asignacion) return false;
        const fechaAsig = this.formatearFecha(a.fecha_asignacion);
        const sigueActiva = !a.fecha_liberacion; 
        return fechaAsig === this.fechaAsignacion && sigueActiva;
    });

    // 2. TOTAL OCUPADO
    const asignacionesDeEsteEvento = asignacionesActivasDelDia.filter((a: any) => 
        a.id_evento == this.evento.id_evento
    );
    this.totalAsignadosEvento = asignacionesDeEsteEvento.length;

    // 3. FILTRO DE VEHÍCULOS
    this.idsVehiculosOcupadosGlobalmente.clear();
    asignacionesActivasDelDia.forEach((a: any) => {
        if (a.id_vehiculo) this.idsVehiculosOcupadosGlobalmente.add(Number(a.id_vehiculo));
    });
    this.actualizarVehiculosDisponibles();

    // 4. CONSTRUIR MAPA
    const espaciosDelLote = espacios.filter((e: any) => e.id_lot == this.idLotSeleccionado);

    const mapa: EspacioVisual[] = espaciosDelLote.map((e: any) => {
        const num = Number(e.numero_cajon);
        
        // --- FORMATEO DE NÚMERO A STRING ("01", "02") ---
        let numeroString = String(e.numero_cajon);
        if (typeof e.numero_cajon === 'number' && e.numero_cajon < 10) {
             numeroString = `0${num}`;
        }

        // --- REGLAS DE ESTADO ---
        
        // Regla 1: Reservado Sistema (Solo 34-40 en Lot 2)
        const esReservadoSistema = (num >= 34 && num <= 40 && this.idLotSeleccionado == 2);
        
        // Regla 2: Inhabilitado por BD
        const esInhabilitadoBD = e.estado_disponible === false;

        let disponible = true;
        let textoOcupado = '';
        let idAsignacion = undefined;

        if (esReservadoSistema) {
            disponible = false;
            textoOcupado = 'Reservado Sistema';
        } else {
            // Lógica dinámica estándar
            const ocupacion = asignacionesActivasDelDia.find((a: any) => a.id_espacio == e.id_espacio);
            
            if (ocupacion) {
                disponible = false;
                textoOcupado = 'Asignado';
                idAsignacion = ocupacion.id_asignacion;
            }
        }

        return {
            id_espacio: e.id_espacio,
            numero: numeroString, // <--- Usamos el string formateado
            tipo: e.tipo_espacio,
            disponible: disponible,
            ocupadoPor: textoOcupado,
            id_asignacion: idAsignacion,
            esReservadoSistema: esReservadoSistema,
            esInhabilitadoBD: esInhabilitadoBD
        };
    });

    this.espaciosVisuales = mapa.sort((a, b) => Number(a.numero) - Number(b.numero));
  }

  private actualizarVehiculosDisponibles() {
      this.vehiculosDisponibles = this.todosVehiculosResponsable.filter(v => 
          !this.idsVehiculosOcupadosGlobalmente.has(Number(v.id_vehiculo))
      );
      if (this.idVehiculoSeleccionado && this.idsVehiculosOcupadosGlobalmente.has(this.idVehiculoSeleccionado)) {
          this.idVehiculoSeleccionado = null;
      }
  }

  private extraerDatos(payload: any): any[] {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.Datos)) return payload.Datos;
    if (Array.isArray(payload.data)) return payload.data;
    return [];
  }

  // --- INTERACCIÓN ---

  seleccionarEspacio(espacio: EspacioVisual) {
    this.espacioSeleccionado = espacio;

    if (!espacio.disponible) {
        if (espacio.esReservadoSistema) {
            alert('🚫 Espacio reservado por el sistema (34-40).');
            return;
        }
        if (espacio.id_asignacion) {
            this.modalLiberarVisible = true;
        }
        return;
    }

    if (this.totalAsignadosEvento >= this.capacidadTotal) {
        alert(`⚠️ Cupo Lleno (${this.totalAsignadosEvento}/${this.capacidadTotal}).`);
        return;
    }

    this.idVehiculoSeleccionado = null; 
    this.modalConfirmarVisible = true;
  }

  confirmarGuardado() {
    if (!this.espacioSeleccionado || !this.idVehiculoSeleccionado) return;

    const payload = {
        id_evento: this.evento.id_evento, // <--- Se asegura el envío del ID Evento
        id_espacio: this.espacioSeleccionado.id_espacio,
        id_vehiculo: this.idVehiculoSeleccionado,
        fecha_asignacion: this.fechaAsignacion,
        observaciones: 'Asignado desde Panel Admin' 
    };

    this.asignacionService.crearAsignaciones(payload as any).subscribe({
        next: (res) => {
            // Actualizar estado en BD a false
            const espacioUpdate = {
                id_espacio: this.espacioSeleccionado!.id_espacio,
                id_lot: this.idLotSeleccionado,
                numero_cajon: this.espacioSeleccionado!.numero, 
                tipo_espacio: this.espacioSeleccionado!.tipo,
                estado_disponible: false
            };

            this.espaciosService.actualizarEspacios(this.espacioSeleccionado!.id_espacio, espacioUpdate as any).subscribe({
                next: () => {
                    this.modalConfirmarVisible = false;
                    this.cargarMapa(); 
                },
                error: (err) => console.error('Error actualizando espacio:', err)
            });
        },
        error: (err) => alert('Error al asignar: ' + (err.error?.error || err.message))
    });
  }

  confirmarLiberacion() {
    if (!this.espacioSeleccionado || !this.espacioSeleccionado.id_asignacion) return;

    const payload = {
        id_evento: this.evento.id_evento, // <--- AGREGADO: ID Evento en liberación
        fecha_liberacion: new Date().toISOString(),
        observaciones: 'Liberado manualmente'
    };

    this.asignacionService.actualizarAsignaciones(this.espacioSeleccionado.id_asignacion, payload as any).subscribe({
        next: () => {
            // Actualizar estado físico en BD a true
            const espacioUpdate = {
                id_espacio: this.espacioSeleccionado!.id_espacio,
                id_lot: this.idLotSeleccionado,
                numero_cajon: this.espacioSeleccionado!.numero,
                tipo_espacio: this.espacioSeleccionado!.tipo,
                estado_disponible: true
            };

            this.espaciosService.actualizarEspacios(this.espacioSeleccionado!.id_espacio, espacioUpdate as any).subscribe({
                next: () => {
                    this.modalLiberarVisible = false;
                    this.cargarMapa(); 
                },
                error: (err) => console.error('Error habilitando espacio:', err)
            });
        },
        error: (err) => {
            console.error(err);
            alert('Error al liberar el espacio');
        }
    });
  }

  cerrar() {
    this.onClose.emit();
  }
}