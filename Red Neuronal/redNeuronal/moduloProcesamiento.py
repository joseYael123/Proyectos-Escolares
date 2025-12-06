# utils_datos.py
import numpy as np
import json
import pathlib
import os
import string

def cargar_mapeos_y_config(archivo_json="placas.json"):
    """
    Carga los mapeos de caracteres/estados y configuración básica (TAM_DICCIONARIO, SALIDAS, LONGITUD_PLACA)
    desde un archivo JSON. Esto es útil para inicializar la red y los preprocesadores.
    """
    directorio_actual = pathlib.Path(__file__).parent / "pruebas"
    nombre_archivo = directorio_actual / archivo_json
    
    if not os.path.exists(nombre_archivo):
        print(f"¡ERROR! No se encontró el archivo '{archivo_json}' en {directorio_actual}")
        raise FileNotFoundError(f"No se encontró {nombre_archivo}")

    with open(nombre_archivo, "r", encoding="utf-8") as f:
        datos_raw = json.load(f)

    LETRAS = "ABCDEFGHJKLMNPRSTUVWXYZ"
    DIGITOS = "0123456789"
    caracteres_unicos = sorted(list(set(LETRAS + DIGITOS)))
    char_to_int = {char: i for i, char in enumerate(caracteres_unicos)}
    int_to_char = {i: char for char, i in char_to_int.items()}
    TAM_DICCIONARIO = len(caracteres_unicos)

    estados_unicos = sorted(list(set([d["estado"] for d in datos_raw])))
    etiquetas_estados_global = estados_unicos
    estado_to_int = {estado: i for i, estado in enumerate(estados_unicos)}
    int_to_estado = {i: estado for estado, i in estado_to_int.items()}
    SALIDAS = len(estados_unicos)
    
    LONGITUD_PLACA = 0
    if datos_raw:
        LONGITUD_PLACA = len(datos_raw[0]["placa"])

    mapeos = {
        "char_to_int": char_to_int,
        "int_to_char": int_to_char,
        "estado_to_int": estado_to_int,
        "int_to_estado": int_to_estado,
        "etiquetas_estados_global": etiquetas_estados_global,
        "TAM_DICCIONARIO": TAM_DICCIONARIO,
        "SALIDAS": SALIDAS,
        "LONGITUD_PLACA": LONGITUD_PLACA
    }
    return mapeos

def preprocesar_placas(placas_raw, mapeos):
    """
    Preprocesa una lista de diccionarios de placas (ej. [{"placa": "ABC123", "estado": "CDMX"}])
    utilizando los mapeos proporcionados.
    """
    X_list = []
    y_list = [] # Puede estar vacío si no hay etiquetas (para predicción pura)

    char_to_int = mapeos['char_to_int']
    estado_to_int = mapeos['estado_to_int']
    LONGITUD_PLACA = mapeos['LONGITUD_PLACA']
    SALIDAS = mapeos['SALIDAS']

    for registro in placas_raw:
        placa_str = registro["placa"]
        
        if len(placa_str) != LONGITUD_PLACA:
            print(f"Omitiendo placa con longitud incorrecta: {placa_str}")
            continue
            
        placa_int = [char_to_int.get(c, 0) for c in placa_str]
        X_list.append(placa_int)
        
        if "estado" in registro: # Si la placa tiene una etiqueta de estado
            y_list.append(estado_to_int.get(registro["estado"], -1)) # -1 para estados desconocidos
        else:
            y_list.append(-1) # Placeholder si no hay etiqueta

    X_procesado = np.array(X_list, dtype=np.int32)
    
    if any(y != -1 for y in y_list): # Si hay al menos una etiqueta válida
        y_procesado_one_hot = np.zeros((len(y_list), SALIDAS), dtype=np.float32)
        for i, idx_estado in enumerate(y_list):
            if idx_estado != -1 and idx_estado < SALIDAS:
                y_procesado_one_hot[i, idx_estado] = 1.0
    else:
        y_procesado_one_hot = None # O un array vacío, dependiendo del uso
        
    return X_procesado, y_procesado_one_hot

def cargar_datos_entrenamiento(archivo_json):
    """Carga y preprocesa los datos completos para entrenamiento."""
    mapeos = cargar_mapeos_y_config(archivo_json)
    
    directorio_actual = pathlib.Path(__file__).parent
    nombre_archivo = directorio_actual / archivo_json
    with open(nombre_archivo, "r", encoding="utf-8") as f:
        datos_raw = json.load(f)
        
    X_entrenamiento, y_entrenamiento_one_hot = preprocesar_placas(datos_raw, mapeos)
    return X_entrenamiento, y_entrenamiento_one_hot, mapeos

def cargar_datos_prueba(archivo_json, mapeos=None):
    """Carga y preprocesa datos de prueba. Requiere 'mapeos' si no se carga de nuevo el config."""
    if mapeos is None:
        mapeos = cargar_mapeos_y_config(archivo_json) # Carga los mapeos si no se proporcionaron
    
    directorio_actual = pathlib.Path(__file__).parent
    nombre_archivo = directorio_actual / archivo_json
    
    if not os.path.exists(nombre_archivo):
        print(f"¡ADVERTENCIA! Archivo de prueba '{nombre_archivo}' no encontrado.")
        return np.array([], dtype=np.int32).reshape(0, mapeos['LONGITUD_PLACA']), None

    with open(nombre_archivo, "r", encoding="utf-8") as f:
        datos_raw = json.load(f)
        
    X_prueba, y_prueba_one_hot = preprocesar_placas(datos_raw, mapeos)
    return X_prueba, y_prueba_one_hot