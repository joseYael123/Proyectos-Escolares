export interface Espacio_esta {
    id_espacio: number;
    id_lot: number;
    numero_cajon: string | number; // La BD devuelve string "04", el front usa number a veces
    tipo_espacio: string;
    estado_disponible: boolean; // CRUCIAL: Viene de la BD
}
