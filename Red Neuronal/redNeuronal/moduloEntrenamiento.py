# train.py
import numpy as np
import threading
import json
import pathlib
import os

# Importar tus módulos
import clasesRedPlacas as clase
import motorRedNeuronal as motor
import moduloProcesamiento # <--- ¡CORREGIDO! Asegúrate de que este es el nombre de tu archivo

# --- Hiperparámetros de la Red (variables locales al script de entrenamiento) ---
DIMEN_EMBEDDING = 24
EPOCHS = 500 # Puedes aumentar esto a 500 o más
BATCH_SIZE = 64
LEARNING_RATE = 0.01
NOMBRE_MODELO = "modelo_red_placas_entrenado.npz"

# Ruta al archivo JSON
# Si train.py está en 'Red Neuronal/redNeuronal/' y 'pruebas' está en 'Red Neuronal/pruebas/'
# entonces necesitas retroceder dos niveles para llegar a la raíz del proyecto y luego bajar a 'pruebas'.
# Si 'train.py' y 'pruebas' están en la misma carpeta raíz, sería: pathlib.Path(__file__).parent / "pruebas" / "placas.json"
# Por tu ejemplo de 'Red-Neruonal-Conjunto\Red Neuronal\redNeuronal\placas.json', 
# parece que 'pruebas' podría estar un nivel más arriba si el proyecto principal es 'Red-Neruonal-Conjunto'.
# Voy a usar .parent / "pruebas" / "placas.json" asumiendo que el script de entrenamiento está
# en la misma carpeta que la carpeta 'pruebas'. Si no es así, ajusta esta línea.
RUTA_PLACA_JSON = pathlib.Path(__file__).parent.parent / "pruebas" / "placas.json" 


# Global para la red y los datos (para el hilo)
mi_red = None
X_entrenamiento = None
y_entrenamiento_one_hot = None
mapeos_entrenamiento = None
network_lock = threading.Lock()

def construir_y_entrenar_red():
    global mi_red, X_entrenamiento, y_entrenamiento_one_hot, mapeos_entrenamiento

    print("Iniciando carga de datos y mapeos...")
    # 1. Cargar datos y mapeos
    try:
        # ¡CORREGIDO! Llamar a la función desde utils_datos
        # La función cargar_datos_entrenamiento en utils_datos ya carga los mapeos internamente
        X_entrenamiento, y_entrenamiento_one_hot, mapeos_entrenamiento = moduloProcesamiento.cargar_datos_entrenamiento(RUTA_PLACA_JSON)
        print(f"Datos de entrenamiento cargados: {len(X_entrenamiento)} ejemplos.")
        if y_entrenamiento_one_hot is not None:
             print(f"Forma de las etiquetas one-hot: {y_entrenamiento_one_hot.shape}")
        else:
             print("Advertencia: No se cargaron etiquetas (y_entrenamiento_one_hot es None).")

    except FileNotFoundError as e:
        print(f"Error: {e}. Asegúrate de que '{RUTA_PLACA_JSON}' exista.")
        return
    except ValueError as e:
        print(f"Error en el formato de los datos o mapeos: {e}")
        return
    except Exception as e:
        print(f"Ocurrió un error inesperado al cargar los datos: {e}")
        return


    TAM_DICCIONARIO = mapeos_entrenamiento['TAM_DICCIONARIO']
    LONGITUD_PLACA = mapeos_entrenamiento['LONGITUD_PLACA']
    SALIDAS = mapeos_entrenamiento['SALIDAS']

    print(f"Configuración de la red: Diccionario={TAM_DICCIONARIO}, Longitud Placa={LONGITUD_PLACA}, Salidas={SALIDAS}")

    # 2. Construir la arquitectura de la red
    mi_red = motor.RedNeuronalConjunto()
    mi_red.agregar_capas(clase.Capa_Embedding(TAM_DICCIONARIO, DIMEN_EMBEDDING))
    mi_red.agregar_capas(clase.Capa_aplanadora())
    mi_red.agregar_capas(clase.Capa_densa(LONGITUD_PLACA * DIMEN_EMBEDDING, 128))
    mi_red.agregar_capas(clase.ReLU())
    mi_red.agregar_capas(clase.Capa_densa(128, 64))
    mi_red.agregar_capas(clase.ReLU())
    mi_red.agregar_capas(clase.Capa_densa(64, SALIDAS))

    # 3. Configurar pérdida y optimizador
    # ¡CORREGIDO! Crear instancias de las clases de pérdida y optimizador
    perdida_fn = clase.Softmax_PerdidaEntropica()
    optimizador = clase.DescensoGradiente(ta_aprendi=LEARNING_RATE)
    
    # ¡CORREGIDO! Llamar a configurar_perdida_optimi
    mi_red.configurar_perdida_optimi(perdida_fn, optimizador)
    print(f"Red configurada con pérdida Softmax_PerdidaEntropica y optimizador DescensoGradiente (TA: {LEARNING_RATE})")


    print("\n--- ¡Entrenamiento iniciado! ---")
    historial_perdida = []

    for epoca in range(EPOCHS + 1):
        num_muestras_totales = len(X_entrenamiento)
        if num_muestras_totales == 0:
            print("No hay datos de entrenamiento para procesar. Finalizando.")
            break

        indices_mezclados = np.random.permutation(num_muestras_totales)

        X_mezclado = X_entrenamiento[indices_mezclados]
        y_mezclado = y_entrenamiento_one_hot[indices_mezclados]

        perdida_epoca_acumulada = 0

        for i in range(0, num_muestras_totales, BATCH_SIZE):
            X_lote = X_mezclado[i : i + BATCH_SIZE]
            y_lote = y_mezclado[i : i + BATCH_SIZE]

            with network_lock:
                perdida_lote = mi_red.forward(X_lote, y_lote)
                mi_red.backward(y_lote)
                mi_red.upda_parametros()

            perdida_epoca_acumulada += perdida_lote

        num_lotes = np.ceil(num_muestras_totales / BATCH_SIZE)
        if num_lotes > 0:
            perdida_actual = perdida_epoca_acumulada / num_lotes
        else:
            perdida_actual = 0.0 # Evitar división por cero si no hay lotes

        historial_perdida.append(perdida_actual)

        if epoca % 10 == 0:
            print(f"Época: {epoca}, Pérdida Promedio: {perdida_actual:.4f}")
            # Puedes añadir aquí la lógica de cálculo de precisión si quieres verlo durante el entrenamiento

    print("--- ¡Entrenamiento completado! ---")
    
    # 4. Guardar el modelo entrenado
    ruta_guardado = pathlib.Path(__file__).parent / NOMBRE_MODELO
    with network_lock:
        mi_red.guardar_modelo(ruta_guardado)
    print(f"Modelo guardado en '{ruta_guardado}'")

if __name__ == "__main__":
    construir_y_entrenar_red()