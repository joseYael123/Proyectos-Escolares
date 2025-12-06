# servidor_api_visualizador.py
# SE HAN MANTENIDO LAS IMPORTACIONES Y CONFIGURACIONES ORIGINALES
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time
import json
import pathlib
import numpy as np
import os
import sys

# Importar tus módulos de la red neuronal
import clasesRedPlacas as clase
import motorRedNeuronal as motor
import moduloProcesamiento

app = Flask(__name__)
CORS(app)

# --- Configuración del modelo ---
DIMEN_EMBEDDING = 24
NOMBRE_MODELO = "modelo_red_placas_entrenado.npz"
RUTA_PLACA_JSON_BASE = pathlib.Path(__file__).parent.parent / "pruebas" / "placas.json"
RUTA_MODELO_NPZ = pathlib.Path(__file__).parent /NOMBRE_MODELO

# --- Variables globales para el servidor y la red ---
mi_red_entrenada = None
mapeos_globales = None
network_lock = threading.Lock()

# Variables para la última predicción (MODO INPUT/SINGLE)
_ultima_prediccion_api = {
    "placa": "---",
    "estado_real": "N/A",
    "estado_predicho": "N/A",
    "confianza": 0.0,
    "probabilidades": [],
    "historial_activaciones": {}
}
_ultima_prediccion_lock = threading.Lock()

def cargar_modelo_y_mapeos():
    # (Este código es idéntico al tuyo original)
    global mi_red_entrenada, mapeos_globales
    try:
        mapeos_globales = moduloProcesamiento.cargar_mapeos_y_config(RUTA_PLACA_JSON_BASE)
        print("Servidor Flask: Mapeos cargados exitosamente.")

        mi_red_entrenada = motor.RedNeuronalConjunto()
        mi_red_entrenada.agregar_capas(clase.Capa_Embedding(mapeos_globales['TAM_DICCIONARIO'], DIMEN_EMBEDDING))
        mi_red_entrenada.agregar_capas(clase.Capa_aplanadora())
        mi_red_entrenada.agregar_capas(clase.Capa_densa(mapeos_globales['LONGITUD_PLACA'] * DIMEN_EMBEDDING, 128))
        mi_red_entrenada.agregar_capas(clase.ReLU())
        mi_red_entrenada.agregar_capas(clase.Capa_densa(128, 64))
        mi_red_entrenada.agregar_capas(clase.ReLU())
        mi_red_entrenada.agregar_capas(clase.Capa_densa(64, mapeos_globales['SALIDAS']))

        if not os.path.exists(RUTA_MODELO_NPZ):
            print(f"Servidor Flask: ¡ERROR! El archivo del modelo '{NOMBRE_MODELO}' no se encontró.")
            sys.exit(1)

        mi_red_entrenada.cargar_modelo(RUTA_MODELO_NPZ)
        print(f"Servidor Flask: Modelo entrenado cargado exitosamente.")

    except Exception as e:
        print(f"Servidor Flask: Error al cargar el modelo o mapeos: {e}")
        sys.exit(1)

# --- Endpoint para predicción ÚNICA (usado por modo Input y el polling) ---
@app.route('/redN/', methods=['POST'])
def predecir_placa():
    # (Este código es idéntico al tuyo original)
    global _ultima_prediccion_api
    if mi_red_entrenada is None or mapeos_globales is None:
        return jsonify({"error": "Modelo no cargado."}), 500

    datos = request.get_json()
    if not datos or 'placa' not in datos:
        return jsonify({"error": "Se esperaba {'placa': 'ABC123'}"}), 400

    placa_str = str(datos['placa']).upper()
    estado_real_str = str(datos.get('estado_real', 'N/A'))
    char_to_int = mapeos_globales['char_to_int']
    longitud_placa = mapeos_globales['LONGITUD_PLACA']

    if len(placa_str) != longitud_placa:
        return jsonify({"error": f"La placa debe tener {longitud_placa} caracteres."}), 400

    placa_int_array = np.array([char_to_int.get(c, 0) for c in placa_str], dtype=np.int32)

    probabilidades = None
    historial = {}

    with network_lock:
        probabilidades, historial = mi_red_entrenada.predecir_paso_a_paso(placa_int_array)

    if probabilidades is None:
        return jsonify({"error": "Error al realizar la predicción."}), 500

    indice_ganador = np.argmax(probabilidades)
    estado_predicho_str = mapeos_globales['etiquetas_estados_global'][indice_ganador]
    confianza = probabilidades[indice_ganador]

    with _ultima_prediccion_lock:
        _ultima_prediccion_api = {
            "placa": placa_str,
            "estado_real": estado_real_str,
            "estado_predicho": estado_predicho_str,
            "confianza": float(confianza),
            "probabilidades": probabilidades.tolist(),
            "historial_activaciones": {
                'embedding': historial.get('embedding', np.array([])).tolist(),
                'densa_1_relu': historial.get('densa_1_relu', np.array([])).tolist(),
                'densa_2_relu': historial.get('densa_2_relu', np.array([])).tolist(),
                'salida_logits': historial.get('salida_logits', np.array([])).tolist(),
            }
        }
    
    return jsonify({
        "placa_recibida": placa_str,
        "estado_predicho": estado_predicho_str,
        "confianza": float(confianza)
    })

@app.route('/redN/latest_prediction', methods=['GET'])
def get_latest_prediction():
    with _ultima_prediccion_lock:
        return jsonify(_ultima_prediccion_api)

# En moduloApi.py

# --- ¡OPTIMIZADO! Endpoint para predicción BATCH (Lotes) ---
@app.route('/redN/batch', methods=['POST'])
def predecir_batch():
    if mi_red_entrenada is None or mapeos_globales is None:
        return jsonify({"error": "Modelo no cargado."}), 500

    datos = request.get_json()
    # Esperamos: {"placas": ["ABC123", "DEF456", ...]}
    if not datos or 'placas' not in datos or not isinstance(datos['placas'], list):
        return jsonify({"error": "Se esperaba {'placas': ['P1', 'P2',...]}"}), 400

    lista_placas_str = datos['placas']
    resultados_batch = []
    
    char_to_int = mapeos_globales['char_to_int']
    # Obtenemos la lista de nombres de estados
    etiquetas_estados = mapeos_globales['etiquetas_estados_global']
    
    # Usamos el lock para procesar todo el lote de una vez
    with network_lock:
        for placa_str_raw in lista_placas_str:
            placa_str = str(placa_str_raw).upper()
            
            # Relleno simple si falta (usando valores por defecto por seguridad)
            longitud_objetivo = mapeos_globales.get('LONGITUD_PLACA', 9)
            pad_char = mapeos_globales.get("PAD_CHAR", "#")
            if len(placa_str) < longitud_objetivo:
                 placa_str = placa_str + (pad_char * (longitud_objetivo - len(placa_str)))
            elif len(placa_str) > longitud_objetivo:
                 placa_str = placa_str[:longitud_objetivo]

            placa_int_array = np.array([char_to_int.get(c, 0) for c in placa_str], dtype=np.int32)

            # Predicción (solo necesitamos las probabilidades finales)
            probabilidades, _ = mi_red_entrenada.predecir_paso_a_paso(placa_int_array)

            if probabilidades is not None:
                indice_ganador = np.argmax(probabilidades)
                # Obtenemos el nombre del estado usando el índice ganador
                estado_predicho_str = etiquetas_estados[indice_ganador]
                confianza = probabilidades[indice_ganador]

                # --- ESTRUCTURA OPTIMIZADA (Solo lo esencial) ---
                resultado_individual = {
                    "placa": placa_str,
                    # "estado_real": "N/A", # Opcional en batch
                    "estado_predicho": estado_predicho_str, # Nombre completo/etiqueta
                    "confianza": float(confianza)
                }
                resultados_batch.append(resultado_individual)
            else:
                 resultados_batch.append({"placa": placa_str, "error": "Fallo prediccion"})

    # Devolvemos la lista completa de resultados ligeros
    return jsonify({"resultados": resultados_batch})


if __name__ == '__main__':
    cargar_modelo_y_mapeos()
    print("Servidor Flask: Iniciando el servidor en http://localhost:8000/redN/")
    # Importante: threaded=True permite manejar el polling y el batch simultáneamente mejor
    app.run(host='0.0.0.0', port=8000, debug=False, threaded=True)