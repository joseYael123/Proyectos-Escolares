import numpy as np

class Capa_densa:
    def __init__(self, n_entradas, n_neuronas):
        # inicializamos los pesos (W) con forma (n_entradas, n_neuronas)
        self.pesos = np.random.randn(n_entradas, n_neuronas) * np.sqrt(2. / n_entradas)
        # inicializamos los biases (b) en ceros, uno para cada neurona
        self.biases = np.zeros((1,n_neuronas))

        # --- Variables de Caché (para el backpropagation) ---
        self.entradas = None # guarda la entrada X (de forma (64, 72)) que se usó en forward_prop
        
        # CORRECCIÓN: esto es la derivada de L con respecto a los PESOS (dL/dW)
        self.pesosGrad = None 
        
        # esto es la derivada de L con respecto al BIAS (dL/db)
        self.biasesGrad = None  
        
        # CORRECCIÓN: esto es la derivada de L con respecto a las ENTRADAS X (dL/dX)
        self.entradasGrad = None 

    def forward_prop(self,entradas):
        # CORRECCIÓN: solo guardamos las entradas X en caché. no se multiplican aquí.
        self.entradas = entradas 
        
        # aqui hacemos el producto punto (Z = X • W + b)
        salida = np.dot(entradas, self.pesos) + self.biases 
        
        # retornamos el producto punto (Z)
        return salida  
    
    def backward_prop(self, culpa_entrante): 
       # print(f"  [DEBUG Densa] culpa_entrante shape: {culpa_entrante.shape}, mean_abs: {np.mean(np.abs(culpa_entrante)):.8e}") # NUEVO
        # 'culpa_entrante' es la "culpa" ⚖️ que viene de la capa siguiente (dL/dZ)
        # tiene la forma (num_muestras, n_neuronas), ej. (64, 32)

        # 1. Calcular el gradiente de los Pesos (dL/dW)
        # Fórmula: dL/dW = X.T • dL/dZ
        # transponemos self.entradas (X) para que las formas (shapes) coincidan
        # (72, 64) • (64, 32) = (72, 32)
        # el resultado (pesosGrad) tiene la misma forma que self.pesos
        self.pesosGrad = np.dot(self.entradas.T, culpa_entrante)
        
        # 2. Calcular el gradiente de los Biases (dL/db)
        # Fórmula: dL/db = suma(dL/dZ)
        # sumamos la "culpa" (culpa_entrante) verticalmente (axis=0) 
        # a través de todas las 64 muestras.
        # keepdims=True mantiene la forma (1, 32) para que coincida con self.biases
        self.biasesGrad = np.sum(culpa_entrante, axis = 0 , keepdims=True)
        
        # 3. Calcular el gradiente de las Entradas (dL/dX)
        # Fórmula: dL/dX = dL/dZ • W.T
        # esta es la "culpa" ⚖️ que pasaremos hacia atrás a la capa anterior
        # (64, 32) • (32, 72) = (64, 72)
        self.entradasGrad = np.dot(culpa_entrante, self.pesos.T)
        
        #print(f"  [DEBUG Densa] pesosGrad mean_abs: {np.mean(np.abs(self.pesosGrad)):.8e}") # NUEVO
        #print(f"  [DEBUG Densa] biasesGrad mean_abs: {np.mean(np.abs(self.biasesGrad)):.8e}") # NUEVO
        #print(f"  [DEBUG Densa] entradasGrad mean_abs: {np.mean(np.abs(self.entradasGrad)):.8e}") # NUEVO


        # 4. Devolver la "culpa" (dL/dX) para la capa anterior
        return self.entradasGrad
    def imprimir_gradientes_debug(self, nombre_capa="Densa"):
        if self.pesosGrad is not None:
            print(f"  [{nombre_capa}] Gradiente Pesos Avg: {np.mean(np.abs(self.pesosGrad)):.8f}")
            print(f"  [{nombre_capa}] Gradiente Bias Avg: {np.mean(np.abs(self.biasesGrad)):.8f}")
        else:
            print(f"  [{nombre_capa}] Gradientes: No calculados aún")

class ReLU:
    def __init__(self):
        # caché para guardar el producto punto (Z) de la capa anterior
        self.entradas_prod = None
        # la "culpa" filtrada que esta capa devolverá
        self.gradiente_entrante = None

    def forward_prop(self, producto_p):
        # guardamos en caché el producto punto (Z) de la neurona
        self.entradas_prod = producto_p
        
        # aplicamos la función: si z > 0, devuelve z. si z <= 0, devuelve 0.
        return np.maximum(0, producto_p)
    
    def backward_prop(self, gradiente):
       # print(f"  [DEBUG ReLU] gradiente_entrante shape: {gradiente.shape}, mean_abs: {np.mean(np.abs(gradiente)):.8e}") # NUEVO
       # print(f"  [DEBUG ReLU] entradas_prod shape: {self.entradas_prod.shape}") # NUEVO
        
        self.gradiente_entrante = gradiente.copy()
        # 'derivadasPar' es la "culpa" ⚖️ que llega de la capa siguiente (dL/dA)
        
        # CORRECCIÓN: no copiamos la caché. copiamos la "culpa_entrante" (derivadasPar)
        # para poder modificarla (filtrarla).
        self.gradiente_entrante = gradiente.copy()
        
        # CORRECCIÓN: esta es la derivada de ReLU (la regla 1 o 0).
        # usamos la caché 'self.entradas_prod' (Z) como el "interruptor" 💡.
        # donde Z fue negativo o cero (<= 0)...
        # ...ponemos la "culpa" (self.derivasEntra) a 0.
        # donde Z fue positivo, la "culpa" (derivadasPar) se queda igual (se multiplica x 1).
        self.gradiente_entrante[self.entradas_prod <= 0] = 0
      #  print(f"  [DEBUG ReLU] gradiente_salida mean_abs: {np.mean(np.abs(self.gradiente_entrante)):.8e}") # NUEVO
        
        # devolvemos la "culpa" filtrada (dL/dZ)
        return self.gradiente_entrante
    
class Softmax_PerdidaEntropica:
    def __init__(self):
        # caché para guardar ŷ (las probabilidades)
        self.resultado_activacion = None
        # la "culpa" ⚖️ (gradiente) que esta capa genera (ŷ - y)
        self.entradas_d = None 

    def forward_prop(self, logits, one_hot_verdadero):
        # 'logits' es Z (el producto punto) de la última capa (ej. 64, 32)
        
        # 1. Cálculo de Softmax 📊
        # restamos np.max para estabilidad numérica (evita que e^x explote)
        softmaxResultado = np.exp(logits - np.max(logits, axis= 1, keepdims= True))
        
        # dividimos por la suma de todas las neuronas (a lo largo de axis=1)
        # para normalizar y que todo sume 1.0
        #Np.max devuelve el resultado más alto de la columna en este caso
        probabilidades = softmaxResultado / np.sum(softmaxResultado, axis=1, keepdims= True)
        
        # guardamos ŷ (las probabilidades) en caché para backprop
        self.resultado_activacion = probabilidades
        
        # 2. Cálculo de Pérdida 📉
        # CORRECCIÓN: 1e-7 es 0.0000001 (notación científica), no euler.
        # evitamos log(0) (que es -inf) "recortando" ✂️ los valores
        y_predictiva = np.clip(probabilidades, 1e-7, 1 - 1e-7)
        
        # CORRECCIÓN: log(1) es 0, no infinito. el clip evita log(0).
        
        # multiplicamos las probabilidades por el one-hot (que es [0,0,1,0...])
        # np.sum(..., axis=1) selecciona solo la probabilidad de la clase correcta
        valor_correcto = np.sum(y_predictiva * one_hot_verdadero, axis=1)
        
        # aplicamos el logaritmo negativo
        perdida_log = -np.log(valor_correcto)
        
        # devolvemos el promedio de la pérdida de todo el lote (batch)
        return np.mean(perdida_log)
    
    def backward_prop(self, one_hot_v):
        
        # 'one_hot_v' es la etiqueta real (y)
        
        # obtenemos el número de muestras (ej. 64)
        muestras = len(one_hot_v)
        
        # copiamos ŷ (la predicción) de la caché
        self.entradas_d = self.resultado_activacion.copy()
        
        # --- ¡LA FÓRMULA MÁGICA (ŷ - y)! ---
        # esta línea calcula el gradiente (dL/dZ)
        # encuentra la columna (argmax) donde estaba el 1 en el one-hot (y)...
        # ...y le resta 1 a la probabilidad ŷ en esa posición
        self.entradas_d[range(muestras), np.argmax(one_hot_v, axis=1)] -= 1
        
        # normalizamos el gradiente dividiendo por el número de muestras
        # para que la tasa de aprendizaje sea estable
        self.entradas_d = self.entradas_d / muestras
        #print(f"  [DEBUG Softmax] gradiente_inicial shape: {self.entradas_d.shape}, mean_abs: {np.mean(np.abs(self.entradas_d)):.8e}") # NUEVO
        # devolvemos la "culpa" ⚖️ inicial (dL/dZ)
        return self.entradas_d

class DescensoGradiente:
    def __init__(self, ta_aprendi):
        # guardamos la tasa de aprendizaje (learning rate)
        self.ta_aprendi = ta_aprendi

    def upd_parametros(self, capa):
        # 'capa' es un objeto (ej. Capa_densa, Capa_Embedding)
        
        # comprobamos si la capa tiene pesos y gradiente de pesos
        if hasattr(capa, 'pesos') and hasattr(capa, 'pesosGrad'):
            # aplicamos la fórmula: nuevo_peso = peso_antiguo - (tasa * gradiente)
            capa.pesos -= self.ta_aprendi * capa.pesosGrad
            
        # comprobamos si la capa tiene biases y gradiente de biases
        if hasattr(capa, 'biases') and hasattr(capa, 'biasesGrad'):
            # aplicamos la fórmula: nuevo_bias = bias_antiguo - (tasa * gradiente)
            capa.biases -= self.ta_aprendi * capa.biasesGrad

class Capa_Embedding: 
    def __init__(self, diccionario, dimensionDiccio):
        # la matriz de embedding (la "tabla" 📖) son los pesos (W)
        self.pesos = np.random.randn(diccionario, dimensionDiccio) * np.sqrt(1. / dimensionDiccio) # o /dimensionDiccio        
        # caché 📦 para guardar los índices de entrada (ej. [10, 1, 12...])
        self.entradasIn = None
        # gradiente de los pesos (dL/dW)
        self.pesosGrad = None

    def forward_prop(self, indices_entradas):
        
        # 'indices_entradas' tiene forma (num_muestras, longitud_placa), ej. (64, 9)
        
        # guardamos los índices en caché 📦 para el backprop
        self.entradasIn = indices_entradas
        
        # "buscamos" 🔎 los vectores en la matriz de pesos
        # numpy nos deja usar un array de índices para seleccionar filas
        salida = self.pesos[indices_entradas]
        # 'salida' tiene forma (num_muestras, longitud_placa, dimensionDiccio), ej. (64, 9, 8)
        return salida
        
    def backward_prop(self, derivadas_valor):
       # print(f"  [DEBUG Embedding] derivadas_valor shape: {derivadas_valor.shape}, mean_abs: {np.mean(np.abs(derivadas_valor)):.8e}") # NUEVO
        # 'derivadas_valor' es la "culpa" ⚖️ des-aplanada 🔄 (ej. 64, 9, 8)
        
        # 1. creamos el "acumulador" de gradientes (dL/dW)
        #    es una matriz de ceros con la misma forma que los pesos (ej. 36, 8)
        self.pesosGrad = np.zeros_like(self.pesos)
       # print(f"  [DEBUG Embedding] pesosGrad mean_abs: {np.mean(np.abs(self.pesosGrad)):.8e}") # NUEVO

        # 2. sumamos ➕ la "culpa" (derivadas_valor) en las filas correctas
        #    'np.add.at' suma los gradientes si un caracter se repite (ej. 'A'... 'A'...)
        np.add.at(self.pesosGrad, self.entradasIn, derivadas_valor)
        
        # esta capa es la primera, no necesita devolver 'entradasGrad'
    def imprimir_gradientes_debug(self, nombre_capa="Embedding"):
        if self.pesosGrad is not None:
            # np.mean(np.abs(...)) te da la magnitud promedio de los gradientes
            print(f"  [{nombre_capa}] Gradiente Pesos Avg: {np.mean(np.abs(self.pesosGrad)):.8f}")
        else:
            print(f"  [{nombre_capa}] Gradiente Pesos: No calculado aún")

class Capa_aplanadora:
    def __init__(self):
        # caché 📦 para "recordar" 🧠 la forma original (ej. 64, 9, 8)
        self.forma_origi = None
        # la "culpa" ⚖️ que esta capa devolverá (dL/dX)
        self.entradasGradiente = None

    def forward_prop(self, entradas):
        # 'entradas' tiene forma (num_muestras, 9, 8)
        
        # 1. guardamos la forma original en la caché
        self.forma_origi = entradas.shape
        
        # 2. obtenemos el número de muestras (ej. 64)
        muestras = entradas.shape[0]
        
        # 3. "aplanamos" 📏 la matriz a (num_muestras, -1), ej. (64, 72)
        salida = entradas.reshape(muestras, -1)
        return salida
    
    def backward_prop(self, valores_derivados):
     #   print(f"  [DEBUG Aplanadora] valores_derivados shape: {valores_derivados.shape}, mean_abs: {np.mean(np.abs(valores_derivados)):.8e}") # NUEVO
        # 'valores_derivados' es la "culpa" ⚖️ aplanada (ej. 64, 72)
        
        # "des-aplanamos" 🔄 la "culpa" a su forma original (ej. 64, 9, 8)
        self.entradasGradiente = valores_derivados.reshape(self.forma_origi)
       # print(f"  [DEBUG Aplanadora] entradasGradiente_salida shape: {self.entradasGradiente.shape}, mean_abs: {np.mean(np.abs(self.entradasGradiente)):.8e}") # NUEVO
        # devolvemos la "culpa" des-aplanada para la capa de embedding
        return self.entradasGradiente