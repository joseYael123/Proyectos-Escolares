import clasesRedPlacas as clases
import numpy as np
import os

# Esta clase es el "ensamblador" 🎼. No hace cálculos por sí misma,
# sino que ORQUESTA el flujo de datos (forward) y de gradientes (backward)
# a través de las capas que le agreguemos.
class RedNeuronalConjunto:

    def __init__(self):
        # self.capas es una lista [] que guardará los objetos de capa en orden
        # (ej. Embedding, Aplanadora, Densa, ReLU, Densa, ReLU...)
        self.capas = []
        
        # variable para guardar el objeto de la capa de pérdida (Softmax + Entropía Cruzada)
        self.softmax_perdida = None
        
        # variable para guardar el objeto Optimizador (DescensoGradiente)
        self.optimisador = None

    def agregar_capas(self,capa):
        # método para añadir un objeto de capa (ej. Capa_densa) a la lista self.capas
        self.capas.append(capa)

    def configurar_perdida_optimi(self, perdida, optimisador):
        # método para asignar la capa de pérdida y el optimizador a la red
        self.softmax_perdida = perdida
        self.optimisador = optimisador

    def forward(self, X , Y_one_hot): # 'X' son los datos de entrada (ej. 64 placas), 'Y_one_hot' son las etiquetas
        
        # 'salida' empieza siendo los datos de entrada X
        salida = X

        # --- Bucle Forward Pass ---
        # iteramos sobre cada capa en self.capas (en orden, desde la primera a la última)
        for capa in self.capas:
            # pasamos la 'salida' de la capa anterior como 'entrada' a la capa actual
            # y actualizamos 'salida' con el resultado de esa capa
            salida = capa.forward_prop(salida)

        # DESPUÉS de pasar por todas las capas, 'salida' son los logits finales (ej. 64, 32)
        # calculamos la pérdida (L) usando los logits y las etiquetas reales (Y_one_hot)
        perdida = self.softmax_perdida.forward_prop(salida, Y_one_hot)
        
        # devolvemos el número de la pérdida (un escalar, ej. 3.4657)
        return perdida
    
    def backward(self, y_one_hot):
        # 'y_one_hot' son las etiquetas reales que necesitamos para calcular el gradiente inicial
        
        # 1. iniciamos el backpropagation en la capa de pérdida
        # esto calcula el gradiente inicial (dL/dZ) = (ŷ - y)
        self.softmax_perdida.backward_prop(y_one_hot)
        
        # 2. obtenemos ese gradiente inicial (ej. 64, 32)
        # 'entradas_d' es el nombre de la variable donde Softmax_PerdidaEntropica guardó (ŷ - y)
        valores_derivados = self.softmax_perdida.entradas_d 

        # --- Bucle Backward Pass ---
        # iteramos sobre las capas en ORDEN INVERSO (reversed), desde la última a la primera
        for capa in reversed(self.capas):
            
            # 'valores_derivados' (la "culpa" ⚖️, dL/dX de la capa n+1) 
            # se pasa como entrada (dL/dZ) a la capa actual (capa n)
            # la capa (ej. Capa_densa) calcula sus gradientes internos (pesosGrad, biasesGrad)
            # y DEVUELVE la "culpa" para la capa anterior (entradasGrad, o dL/dX de la capa n)
            # 'valores_derivados' se actualiza con esa nueva "culpa" devuelta
            valores_derivados = capa.backward_prop(valores_derivados)

    def upda_parametros(self):
        # iteramos sobre cada capa (en orden normal)
        for capa in self.capas:
            # llamamos al optimizador ⚙️ para que actualice 
            # los pesos y biases de esta capa (si los tiene, usando hasattr)
            self.optimisador.upd_parametros(capa)

    def entrenar(self, X, y_one_hot, epocas, imprimir = 100):
        # historial para guardar la pérdida de cada época (para graficar 📈)
        historial_perdida = []
        
        # bucle de entrenamiento principal, se repite 'epocas' veces
        for epoca in range(epocas + 1): 
            
            # --- Paso 1: Forward Pass ---
            # calculamos la predicción y la pérdida (L)
            perdida = self.forward(X, y_one_hot)
            
            # --- Paso 2: Backward Pass ---
            # calculamos todos los gradientes (dL/dW, dL/db) de todas las capas
            self.backward(y_one_hot)
            
            # --- Paso 3: Actualización ---
            # aplicamos el descenso del gradiente (nuevo_peso = peso - tasa * gradiente)
            self.upda_parametros()
            
            # imprimimos el progreso cada 'imprimir' épocas
            if epoca % imprimir == 0:
                print(f"Epoca: {epoca}, Perdida {perdida:.4f}")
                historial_perdida.append(perdida)
        
        # al final del bucle, imprimimos el completado
        print("Entrenamiento completado")
        # devolvemos el historial de pérdidas
        return historial_perdida
        
    def predecir_paso_a_paso(self, X_muestra):
        # 1. Asegurar que la entrada sea 2D (un "lote" de 1 muestra)
        # si X_muestra.ndim (número de dimensiones) es 1 (ej. forma (9,))
        if X_muestra.ndim == 1:
            # la convertimos a (1, 9) usando np.newaxis
            X_muestra = X_muestra[np.newaxis, :]
        # (el 'elif' maneja el caso de que se pase un lote completo por error)
        elif X_muestra.ndim == 2 and X_muestra.shape[0] !=1:
            X_muestra = X_muestra[0, :][np.newaxis, :]

        # 'salida' empieza siendo la muestra de entrada (1, 9)
        salida = X_muestra
        # 'historial_activaciones' es un diccionario {} para guardar las salidas
        # de cada capa para la visualización 🎨
        historial_activaciones = {} 
        
        # --- Bucle Forward Pass (para predicción) ---
        # (i es el índice, capa es el objeto)
        for i, capa in enumerate(self.capas): 
            # pasamos la salida de la capa anterior a la capa actual
            salida = capa.forward_prop(salida)
            
            # --- Lógica para guardar en el historial ---
            # (isinstance(capa, clases.Capa_Embedding) comprueba el tipo de objeto)
            if isinstance(capa, clases.Capa_Embedding):
                # .copy() es importante para guardar el valor en este instante
                historial_activaciones['embedding'] = salida[0].copy()
            elif isinstance(capa, clases.Capa_aplanadora):
                historial_activaciones['aplanado'] = salida[0].copy()
            elif isinstance(capa, clases.ReLU):
                # guardamos la salida de ReLU (la activación)
                if 'densa_1_relu' not in historial_activaciones:
                    historial_activaciones['densa_1_relu'] = salida[0].copy()
                elif 'densa_2_relu' not in historial_activaciones:
                    historial_activaciones['densa_2_relu'] = salida[0].copy()
            # (i == len(self.capas) - 1) comprueba si es la última capa de la lista
            elif isinstance(capa, clases.Capa_densa) and i == len(self.capas) - 1:
                # guardamos los logits (antes de Softmax)
                historial_activaciones['salida_logits'] = salida[0].copy()

        # --- Cálculo Manual de Softmax ---
        # 'salida' ahora son los logits finales (1, 32)
        logits = salida
        # aplicamos la fórmula de Softmax (e^z / suma(e^z))
        valores = np.exp(logits - np.max(logits, axis=1 , keepdims= True))
        probabilidades = valores / np.sum(valores, axis=1, keepdims=True)

        # devolvemos el vector de probabilidades (32,) y el historial
        return probabilidades[0], historial_activaciones
    
    def guardar_modelo(self, ruta):
        parametros_guardados = {}
        for i, capa in enumerate(self.capas):
            if hasattr(capa, 'pesos'):
                parametros_guardados[f"capa_{i}_pesos"] = capa.pesos
            if hasattr(capa, 'biases'):
                parametros_guardados[f"capa_{i}_biases"] = capa.biases
                
        np.savez(ruta, **parametros_guardados)
        print(f"Modelo guardado con ruta {ruta}")

    def cargar_modelo(self, ruta):
        if not os.path.exists(ruta):
                raise FileNotFoundError(f"Archivo de modelo no encontrado con nombre {ruta}")
            
        parametros_cargardos = np.load(ruta, allow_pickle=True)
            
        for i,capa in enumerate(self.capas):
            if hasattr(capa, 'pesos') and f'capa_{i}_pesos' in parametros_cargardos:
                capa.pesos = parametros_cargardos[f'capa_{i}_pesos']
            if hasattr(capa, 'biases') and f'capa_{i}_biases' in parametros_cargardos:
                capa.biases = parametros_cargardos[f'capa_{i}_biases']
            print(f"Modelo cargado con exito desde la ruta {ruta}")
            
                   
            
            
            