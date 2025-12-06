# moduloVisualizador_modificado.py
# Versión con soporte real para API_BATCH (espera la respuesta del lote)

import py5
import numpy as np
import threading
import json
import pathlib
import os
import time
import requests

# Importar los módulos que ya tienes
import clasesRedPlacas as clase
import motorRedNeuronal as motor
import moduloProcesamiento

# --- Configuración del modelo y datos ---
DIMEN_EMBEDDING = 24
NOMBRE_MODELO = "modelo_red_placas_entrenado.npz"

# Rutas
RUTA_PLACA_JSON_BASE = pathlib.Path(__file__).parent.parent / "pruebas" / "placas.json"
RUTA_PLACA_PRUEBA_JSON = pathlib.Path(__file__).parent.parent / "pruebas" / "placas_prueba.json"
RUTA_MODELO_NPZ = pathlib.Path(__file__).parent / NOMBRE_MODELO

URL_API = "http://localhost:8000/redN/"
URL_API_LATEST = URL_API + "latest_prediction"
URL_API_BATCH = URL_API + "batch" # ### NUEVA RUTA ###

# --- Variables Globales para py5 ---
mi_red_entrenada = None
mapeos_globales = None
network_lock = threading.Lock()

# Estado de visualización
probabilidades_actuales = None
historial_actual = {}
placa_simulada_int_array = None
placa_simulada_str = "Cargando..."
estado_real_simulado_str = ""

# Meta-información de la última predicción (para mostrar en el panel)
last_api_info = {
    'placa': None,
    'estado_predicho': None,
    'estado_real': None,
    'confianza': 0.0,
    'timestamp': 0.0
}

# --- Control de Modos ---
MODO_PREDICCION = "LOCAL_INPUT"
ultimo_cambio_placa = 0

# Datos de prueba locales
placas_prueba_X_str = None
placas_prueba_y_indices = None
indice_local_batch_actual = 0 # Renombrado para claridad
indice_estado_actual = -1
placas_por_estado = {}

# ### NUEVAS VARIABLES PARA API_BATCH ###
resultados_api_batch = [] # Almacenará la lista gigante de resultados del servidor
indice_api_batch_actual = 0
cargando_batch_api = False # Flag para mostrar estado de carga

# Input de usuario
input_usuario_placa = ""
mostrar_prediccion_unica = False
prediccion_unica_resultado = ""
input_activo = False

# Polling control
POLL_INTERVAL = 0.8
polling_thread = None
stop_polling = threading.Event()


# ----------------- UTILIDADES DE DIBUJO (Sin cambios) -----------------
def obtener_brillo(valor):
    if valor <= 0: return 0
    brillo_mapeado = py5.remap(abs(valor), 0, 1.5, 20, 100)
    return min(brillo_mapeado, 100)

def dibujar_capa_embedding(x, y, matriz_activacion, titulo):
    py5.fill(255); py5.text_size(12); py5.text(titulo, x, y - 15)
    tam_celda = 10; espacio_x = 12; espacio_y = 12
    if matriz_activacion is None:
        py5.fill(120); py5.text_size(10); py5.text("(sin activaciones)", x, y); return
    for i in range(matriz_activacion.shape[0]):
        for j in range(matriz_activacion.shape[1]):
            valor = matriz_activacion[i, j]
            brillo = obtener_brillo(valor * 2)
            py5.fill(200, 80, brillo)
            py5.rect(x + j * espacio_x, y + i * espacio_y, tam_celda, tam_celda)
    py5.fill(255); py5.text_size(12)
    py5.text(f"Placa de entrada: {placa_simulada_str}", x, y + matriz_activacion.shape[0] * espacio_y + 20)
    if estado_real_simulado_str:
        py5.text(f"Estado REAL: {estado_real_simulado_str}", x, y + matriz_activacion.shape[0] * espacio_y + 40)

def dibujar_capa_densa(x, y, vector_activacion, titulo, max_neuronas_por_columna=50):
    py5.fill(255); py5.text_size(12); py5.text(titulo, x, y - 15)
    tam_circulo = 8; espacio = 10
    if vector_activacion is None:
        py5.fill(120); py5.text_size(10); py5.text("(sin activaciones)", x, y); return
    num_neuronas = len(vector_activacion)
    for k in range(num_neuronas):
        col = k // max_neuronas_por_columna
        row = k % max_neuronas_por_columna
        valor = vector_activacion[k]
        brillo = obtener_brillo(valor)
        py5.fill(120, 80, brillo)
        py5.circle(x + col * (espacio + tam_circulo * 2), y + row * espacio, tam_circulo)

def dibujar_capa_softmax(x, y, vector_probabilidades, etiquetas, max_estados_mostrar=30):
    py5.fill(255); py5.text_size(12); py5.text("Salida Softmax (Probabilidades)", x, y - 15)
    espacio = 15
    if vector_probabilidades is None or not etiquetas:
        py5.fill(120); py5.text_size(10); py5.text("(sin probabilidades)", x, y); return
    indice_ganador = np.argmax(vector_probabilidades)
    estados_ordenados_indices = np.argsort(vector_probabilidades)[::-1]
    num_estados_a_mostrar = min(len(etiquetas), max_estados_mostrar)
    for i in range(num_estados_a_mostrar):
        original_idx = estados_ordenados_indices[i]
        prob = float(vector_probabilidades[original_idx])
        brillo = int(prob * 100)
        if original_idx == indice_ganador: py5.fill(50, 100, 100)
        else: py5.fill(200, 80, brillo)
        py5.circle(x, y + i * espacio, 10)
        py5.fill(255); py5.text_size(10)
        barra = "█" * int(prob * 30)
        etiqueta_texto = f"{etiquetas[original_idx]}: {prob*100:5.2f}%"
        py5.text(etiqueta_texto, x + 12, y + i * espacio)
        py5.text(barra, x + 120, y + i * espacio)

# ----------------- FUNCIONES DE PREDICCIÓN LOCALES E INPUT API -----------------

def predecir_y_actualizar_visualizacion(placa_str_input, estado_real_input_str="", usar_api_para_final=False):
    # (Esta función se mantiene igual para LOCAL_* y API_INPUT)
    global probabilidades_actuales, historial_actual, placa_simulada_int_array, placa_simulada_str, estado_real_simulado_str
    if mapeos_globales is None or mi_red_entrenada is None: return

    placa_simulada_str = placa_str_input.upper()
    estado_real_simulado_str = estado_real_input_str
    char_to_int = mapeos_globales['char_to_int']
    longitud_placa = mapeos_globales['LONGITUD_PLACA']
    placa_simulada_int_array = np.array([char_to_int.get(c, 0) for c in placa_simulada_str], dtype=np.int32)

    if len(placa_simulada_int_array) != longitud_placa:
        probabilidades_actuales = np.zeros(mapeos_globales['SALIDAS']); historial_actual = {}; return

    probabilidades_locales = None; probabilidades_api = None
    with network_lock:
        probabilidades_locales, historial_local = mi_red_entrenada.predecir_paso_a_paso(placa_simulada_int_array)

    if usar_api_para_final:
        try:
            headers = {'Content-Type': 'application/json'}
            data = {'placa': placa_simulada_str, 'estado_real': estado_real_input_str}
            requests.post(URL_API, headers=headers, json=data, timeout=4)
            # No necesitamos leer la respuesta aquí, el hilo de polling lo hará.
        except requests.exceptions.RequestException as e:
            print(f"Error de API (POST): {e}")

    if not usar_api_para_final:
        # Si es local, actualizamos inmediatamente. Si es API, esperamos al polling.
        with network_lock:
            probabilidades_actuales = probabilidades_locales
            historial_actual.clear()
            if historial_local:
                historial_actual['embedding'] = np.array(historial_local.get('embedding', []))
                historial_actual['densa_1_relu'] = np.array(historial_local.get('densa_1_relu', []))
                historial_actual['densa_2_relu'] = np.array(historial_local.get('densa_2_relu', []))
                historial_actual['salida_logits'] = np.array(historial_local.get('salida_logits', []))

def realizar_prediccion_unica(placa_str_input, usar_api=False):
    # (Sin cambios)
    global prediccion_unica_resultado, mostrar_prediccion_unica
    if mapeos_globales is None: return
    if len(placa_str_input) != mapeos_globales['LONGITUD_PLACA']:
        prediccion_unica_resultado = "Error longitud."; mostrar_prediccion_unica = True; return
    predecir_y_actualizar_visualizacion(placa_str_input, "Usuario", usar_api_para_final=usar_api)
    prediccion_unica_resultado = "Predicción enviada..."
    mostrar_prediccion_unica = True

# ----------------- NUEVAS FUNCIONES PARA API_BATCH REAL -----------------

def cargar_batch_desde_api():
    """Envía todas las placas de prueba al servidor y guarda los resultados."""
    global resultados_api_batch, cargando_batch_api, indice_api_batch_actual
    
    if placas_prueba_X_str is None or len(placas_prueba_X_str) == 0:
        print("No hay placas de prueba para enviar en batch.")
        return

    cargando_batch_api = True
    print(f"Enviando batch de {len(placas_prueba_X_str)} placas a la API...")
    
    try:
        headers = {'Content-Type': 'application/json'}
        # Enviamos la lista completa de placas
        data = {'placas': placas_prueba_X_str}
        
        # Esta petición puede tardar un poco si son muchas placas
        response = requests.post(URL_API_BATCH, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        api_data = response.json()
        if 'resultados' in api_data:
            resultados_api_batch = api_data['resultados']
            print(f"Batch completado. Recibidos {len(resultados_api_batch)} resultados de la API.")
            indice_api_batch_actual = -1 # Resetear índice para empezar a mostrar
        else:
            print("Error en respuesta batch API: No se encontró clave 'resultados'.")
            resultados_api_batch = []

    except requests.exceptions.RequestException as e:
        print(f"Error de API Batch (POST): {e}")
        resultados_api_batch = []
    finally:
        cargando_batch_api = False

def actualizar_visualizacion_con_datos_api(datos_placa):
    """Actualiza la interfaz usando un diccionario de resultados de la API."""
    global probabilidades_actuales, historial_actual, placa_simulada_str, estado_real_simulado_str
    
    with network_lock:
        placa_simulada_str = datos_placa.get('placa', 'Desconocida')
        # En batch, el estado real a veces no viene del servidor, lo buscamos localmente si es necesario
        estado_real_simulado_str = datos_placa.get('estado_real', 'N/A')

        probs = datos_placa.get('probabilidades')
        if probs: probabilidades_actuales = np.array(probs)
        else: probabilidades_actuales = np.zeros(mapeos_globales['SALIDAS'])

        h = datos_placa.get('historial_activaciones', {})
        historial_actual.clear()
        historial_actual['embedding'] = np.array(h.get('embedding', []))
        historial_actual['densa_1_relu'] = np.array(h.get('densa_1_relu', []))
        historial_actual['densa_2_relu'] = np.array(h.get('densa_2_relu', []))
        historial_actual['salida_logits'] = np.array(h.get('salida_logits', []))

        # Actualizar panel lateral también
        last_api_info['placa'] = placa_simulada_str
        last_api_info['estado_predicho'] = datos_placa.get('estado_predicho')
        last_api_info['estado_real'] = estado_real_simulado_str
        last_api_info['confianza'] = datos_placa.get('confianza', 0.0)
        last_api_info['timestamp'] = time.time()


# ----------------- POLLING A LA API (Sigue siendo necesario para API_INPUT) -----------------

def poll_latest_prediction_loop():
    global last_api_info, probabilidades_actuales, historial_actual, placa_simulada_str, estado_real_simulado_str
    session = requests.Session()
    while not stop_polling.is_set():
        # Solo hacemos polling si NO estamos en modo batch para evitar conflictos
        if MODO_PREDICCION != "API_BATCH": 
            try:
                resp = session.get(URL_API_LATEST, timeout=2)
                if resp.status_code == 200:
                    data = resp.json()
                    placa = data.get('placa')
                    # Si la placa en el servidor es diferente a la actual y tiene datos válidos
                    if placa and placa != placa_simulada_str and data.get('probabilidades'):
                        actualizar_visualizacion_con_datos_api(data)
            except requests.exceptions.RequestException: pass
        stop_polling.wait(POLL_INTERVAL)


# ----------------- FUNCIONES DE py5 (setup, draw, keyPressed) -----------------

def setup():
    global mi_red_entrenada, mapeos_globales, placas_prueba_X_str, placas_prueba_y_indices
    global MODO_PREDICCION, placas_por_estado, polling_thread

    # --- CORRECCIÓN AQUÍ ---
    # py5.size DEBE ser la primera instrucción y estar sola en su línea
    py5.size(1600, 700)
    
    # Ahora ya es seguro llamar a comandos de dibujo
    py5.no_stroke()
    py5.text_align(py5.LEFT, py5.CENTER)
    # -----------------------

    py5.text_size(12)
    py5.color_mode(py5.HSB, 360, 100, 100)

    try:
        mapeos_globales = moduloProcesamiento.cargar_mapeos_y_config(RUTA_PLACA_JSON_BASE)
    except FileNotFoundError: py5.exit_sketch()

    # (Carga de red neuronal local - igual que antes)
    mi_red_entrenada = motor.RedNeuronalConjunto()
    mi_red_entrenada.agregar_capas(clase.Capa_Embedding(mapeos_globales['TAM_DICCIONARIO'], DIMEN_EMBEDDING))
    mi_red_entrenada.agregar_capas(clase.Capa_aplanadora())
    mi_red_entrenada.agregar_capas(clase.Capa_densa(mapeos_globales['LONGITUD_PLACA'] * DIMEN_EMBEDDING, 128))
    mi_red_entrenada.agregar_capas(clase.ReLU())
    mi_red_entrenada.agregar_capas(clase.Capa_densa(128, 64))
    mi_red_entrenada.agregar_capas(clase.ReLU())
    mi_red_entrenada.agregar_capas(clase.Capa_densa(64, mapeos_globales['SALIDAS']))

    if os.path.exists(RUTA_MODELO_NPZ):
        mi_red_entrenada.cargar_modelo(RUTA_MODELO_NPZ)

    # Cargar datos de prueba
    X_int_data, y_indices_data = moduloProcesamiento.cargar_datos_prueba(RUTA_PLACA_PRUEBA_JSON, mapeos_globales)
    int_to_char = mapeos_globales['int_to_char']
    placas_prueba_X_str = ["".join([int_to_char.get(idx, '?') for idx in placa_int]) for placa_int in X_int_data]
    placas_prueba_y_indices = y_indices_data if y_indices_data is not None else np.array([])
    
    if y_indices_data is not None and len(y_indices_data) > 0:
        # Si los datos son 2D (One-Hot), convertimos a índices con argmax
        if y_indices_data.ndim == 2:
            placas_prueba_y_indices = np.argmax(y_indices_data, axis=1)
        else:
            # Si ya son 1D (Índices), los usamos tal cual
            placas_prueba_y_indices = y_indices_data
    else:
        placas_prueba_y_indices = np.array([])

    for i, idx_estado in enumerate(placas_prueba_y_indices):
        estado_str = mapeos_globales['int_to_estado'].get(idx_estado)
        if estado_str:
            if estado_str not in placas_por_estado: placas_por_estado[estado_str] = []
            placas_por_estado[estado_str].append(i)

    polling_thread = threading.Thread(target=poll_latest_prediction_loop, daemon=True)
    polling_thread.start()
    
    MODO_PREDICCION = "LOCAL_INPUT"; input_activo = True
    print("Visualizador listo. Presiona 'V' para API Batch.")


def draw():
    global MODO_PREDICCION, ultimo_cambio_placa, indice_local_batch_actual, indice_api_batch_actual
    py5.background(18)

    if mapeos_globales is None: py5.text("Cargando...", 10, 10); return

    # --- LÓGICA CENTRAL DE MODOS ---

    # 1. Modo API_BATCH (REAL)
    if MODO_PREDICCION == "API_BATCH":
        if cargando_batch_api:
            py5.fill(255); py5.text_size(20)
            py5.text("Esperando respuesta del lote (Batch) de la API...", py5.width/2 - 200, py5.height/2)
            return # No dibujamos nada más mientras carga

        if not resultados_api_batch:
            py5.fill(255); py5.text("No hay resultados del batch o error en API.", 10, 20)
        elif time.time() - ultimo_cambio_placa > 2:
            # Ciclamos sobre los resultados DESCARGADOS, no enviamos nuevas peticiones
            indice_api_batch_actual = (indice_api_batch_actual + 1) % len(resultados_api_batch)
            datos_placa_actual = resultados_api_batch[indice_api_batch_actual]
            
            # Intentamos recuperar el estado real localmente si no vino de la API
            estado_real = datos_placa_actual.get('estado_real', 'N/A')
            if estado_real == 'N/A' and placas_prueba_y_indices is not None and len(placas_prueba_y_indices) > indice_api_batch_actual:
                 estado_real = mapeos_globales['int_to_estado'].get(placas_prueba_y_indices[indice_api_batch_actual], "N/A")
            datos_placa_actual['estado_real'] = estado_real # Lo inyectamos para que la función de actualización lo use

            actualizar_visualizacion_con_datos_api(datos_placa_actual)
            ultimo_cambio_placa = time.time()

    # 2. Modos LOCAL_BATCH (El antiguo batch)
    elif MODO_PREDICCION == "LOCAL_BATCH" and time.time() - ultimo_cambio_placa > 2:
        if placas_prueba_X_str:
            indice_local_batch_actual = (indice_local_batch_actual + 1) % len(placas_prueba_X_str)
            current_X_str = placas_prueba_X_str[indice_local_batch_actual]
            current_y_str = ""
            if placas_prueba_y_indices is not None:
                current_y_str = mapeos_globales['int_to_estado'].get(placas_prueba_y_indices[indice_local_batch_actual], "")
            predecir_y_actualizar_visualizacion(current_X_str, current_y_str, usar_api_para_final=False)
        ultimo_cambio_placa = time.time()
    
    # 3. Modos CYCLE (Local y API - funcionan igual, uno a uno)
    elif "CYCLE" in MODO_PREDICCION and time.time() - ultimo_cambio_placa > 2:
        # (Lógica de cycle existente, omitida para brevedad, asume que funciona bien)
        pass

    # --- DIBUJADO (Igual que antes) ---
    y_inicio = 50
    if 'embedding' in historial_actual: dibujar_capa_embedding(50, y_inicio, historial_actual['embedding'], "Capa 1: Embedding")
    if 'densa_1_relu' in historial_actual: dibujar_capa_densa(300, y_inicio, historial_actual['densa_1_relu'], "Capa 3: Oculta 1")
    if 'densa_2_relu' in historial_actual: dibujar_capa_densa(450, y_inicio, historial_actual['densa_2_relu'], "Capa 4: Oculta 2")
    if 'salida_logits' in historial_actual: dibujar_capa_densa(600, y_inicio, historial_actual['salida_logits'], "Capa 5: Logits")
    dibujar_capa_softmax(800, y_inicio, probabilidades_actuales, mapeos_globales['etiquetas_estados_global'])

    # PANEL DERECHO
    panel_x = py5.width - 380; panel_y = 40
    py5.fill(220, 20, 20); py5.rect(panel_x - 10, panel_y - 10, 360, 320, 10)
    py5.fill(220, 10, 90); py5.rect(panel_x, panel_y, 340, 300, 8)
    py5.fill(255); py5.text_size(18); py5.text(f"ULTIMA PREDICCION ({MODO_PREDICCION.split('_')[0]})", panel_x + 12, panel_y + 24)
    py5.text_size(28); py5.text(last_api_info['placa'] or placa_simulada_str, panel_x + 12, panel_y + 70)
    py5.text_size(16); py5.text(f"Pred: {last_api_info['estado_predicho']}", panel_x + 12, panel_y + 110)
    conf = last_api_info['confianza'] * 100; py5.text(f"Conf: {conf:.2f}%", panel_x + 12, panel_y + 135)
    py5.fill(0, 0, 20); py5.rect(panel_x + 12, panel_y + 155, 316, 18, 6)
    py5.fill(150, 90, 90); py5.rect(panel_x + 12, panel_y + 155, 316 * (conf/100.0), 18, 6)
    py5.fill(255); py5.text_size(12); py5.text(f"Real: {last_api_info['estado_real']}", panel_x + 12, panel_y + 215)

    # INFO MODOS
    py5.text(f"Modo: {MODO_PREDICCION}", 50, py5.height - 80)
    if MODO_PREDICCION == "API_BATCH" and resultados_api_batch:
         py5.text(f"Visualizando batch API: {indice_api_batch_actual + 1}/{len(resultados_api_batch)}", 50, py5.height - 60)

    # INPUT BOX
    if "INPUT" in MODO_PREDICCION:
        py5.rect(py5.width - 400, y_inicio + 200, 350, 30)
        py5.fill(255); py5.text(input_usuario_placa.upper(), py5.width - 390, y_inicio + 215)


def key_pressed():
    global MODO_PREDICCION, input_activo, input_usuario_placa, resultados_api_batch
    
    if py5.key_code == ord('V'):
        print("Cambiando a API BATCH y solicitando datos...")
        MODO_PREDICCION = "API_BATCH"
        input_activo = False
        resultados_api_batch = [] # Limpiamos resultados anteriores
        # Lanzamos la carga en un hilo para no bloquear la interfaz inmediatamente
        threading.Thread(target=cargar_batch_desde_api, daemon=True).start()
        
    elif py5.key_code == ord('L'): MODO_PREDICCION = "LOCAL_INPUT"; input_activo = True
    elif py5.key_code == ord('A'): MODO_PREDICCION = "API_INPUT"; input_activo = True
    elif py5.key_code == ord('B'): MODO_PREDICCION = "LOCAL_BATCH"; input_activo = False
    # (Resto de teclas igual...)
    
    if input_activo:
        if py5.key == py5.BACKSPACE: input_usuario_placa = input_usuario_placa[:-1]
        elif py5.key == py5.ENTER:
            usar_api = "API" in MODO_PREDICCION
            realizar_prediccion_unica(input_usuario_placa, usar_api=usar_api)
        elif py5.key.isalnum(): input_usuario_placa += str(py5.key).upper()

def exit_sketch(): stop_polling.set()
py5.run_sketch()