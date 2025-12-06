Sistema Integral de Gestión Logística y Control de Acceso - Conjunto Santander 
Plataforma unificada para la gestión de reservas de espacios, administración logística y control de acceso vehicular automatizado mediante Inteligencia Artificial e IoT. 
Este sistema integra múltiples frentes (Web Pública, Panel Administrativo, API de IA y Hardware) bajo una arquitectura híbrida y robusta.

Arquitectura del Sistema 
El ecosistema se divide en 4 módulos principales interconectados:
- Módulo Público (Solicitud de Espacios): Para usuarios externos.
- Panel Administrativo: Para gestión logística y seguridad.
- Motor de IA (License Plate Recognition): API de Red Neuronal.
- Sistema IoT (ESP32): Control físico de barreras y sensores.🚀
-
-
Módulo de Solicitud de Espacios (Web Pública)
  Permite a usuarios externos reservar salas y registrar logística de eventos.
   Características Clave:
   Flujo Wizard Multi-pasos: 
  -Registro de Responsable,Selección de Fecha/Sala (React Calendar),Registro de Vehículos.
   Persistencia Híbrida (Dual-Write): 
  -Escritura simultánea en PostgreSQL (Relacional) y MongoDB (NoSQL) para integridad y redundancia.
  -Seguridad: Integración con Google reCAPTCHA v3 y validaciones estrictas con express-validator.
  UX Resiliente: -Persistencia en localStorage para evitar pérdida de datos ante recargas.
  Stack: React, Node.js (Express), Sequelize, Mongoose. 
  
  2. Panel Administrativo (Logística y Seguridad):
    El "cerebro" central para orquestar eventos y accesos.
-Características Clave:
-Gestión Visual de Espacios: Mapas interactivos de estacionamientos (Lot 1 y Lot 2) con visualización de ocupación en tiempo real.
-Generación de Pases QR: Creación de imágenes compuestas (Entrada + Salida) enviadas automáticamente vía Email (Nodemailer).
-Validación de Placas: Uso de ocrs para extraer el texto de la imagen y validar en backend.
-Sincronización IoT: Los estados de autorización se sincronizan en tiempo real para ser consumidos por los dispositivos ESP32.
Stack: Angular (Standalone Components), Bootstrap 5, SweetAlert2.

3. API de Inteligencia Artificial (Backend Python):
-Microservicio dedicado al reconocimiento y análisis de placas vehiculares.
 Características Clave:
-Motor Custom:
  Red Neuronal construida desde cero con NumPy (sin frameworks de alto nivel), envuelta en una API Flask.
  Endpoints Especializados:
-POST /redN/: Inferencia detallada en tiempo real (retorna activación de capas ocultas).
-POST /redN/batch: Procesamiento masivo optimizado para alto rendimiento.
-Preprocesamiento Automático: Normalización y padding de imágenes en el servidor antes de la inferencia.
Stack: Python, Flask, NumPy.

4. Sistema IoT y Firmware (ESP32):
   Control físico de acceso automatizado con comunicación dual (WiFi + ESP-NOW).
El sistema de hardware se divide en dos controladores lógicos (Entrada y Salida) que operan máquinas de estados finitos.

4.1.Controlador de Entrada (Logic & Features):
  Protocolo Híbrido: Utiliza ESP-NOW para disparar la cámara inalámbrica (baja latencia) y HTTP para consultar la autorización al servidor.
-WebServer Local: Implementa un servidor web en el puerto 80 para recibir comandos de apertura manual de emergencia (/esp32/servo?val=X).
  Manejo de Errores:Detecta fallos en la cámara (Timeout).
-LEDs RGB para feedback de estado (Azul: Procesando, Verde: Acceso, Rojo: Denegado).

4.2 Controlador de Salida (Logic & Features):
Máquina de Estados Robusta:
-FALSOS_PO: Filtro temporal (350ms) para evitar activaciones por objetos errantes.
-ESCUCHAR_API: Polling inteligente al servidor para validar permisos de salida.
-PASANDO: Lógica de cierre automático tras detección de cruce vehicular.
-Web Control: Al igual que la entrada, permite control manual vía HTTP, actualizando el estado del servo sin romper la lógica automática.
-Seguridad: Alarmas sonoras (Buzzer) y cierre forzoso tras timeouts prolongados (15s).
Stack Hardware: ESP32, Servo Motores, Sensores IR, C++ (Arduino IDE).


5.Stack Tecnológico Global:
Capa Tecnologías: 
FrontendReact (Public), 
Angular (Admin), 
Bootstrap, 
5Backend ,
LogicNode.js, 
Express, 
MulterBackend, 
AIPython, 
Flask, 
NumPy 
(Custom NN),
Bases de DatosPostgreSQL (Sequelize) + MongoDB (Mongoose)IoT,
HardwareESP32:
C++, 
ESP-NOW, 
HTTP Client 
ServiciosGmail Service, 
Google reCAPTCHA v3 

-Instalación y Despliegue: 
Requisitos Previos: 
Node.js v16 + Python 3.8 + PostgreSQL & MongoDB corriendo local o en nube.
Placas ESP32 configuradas con las credenciales WiFi correctas.
EjecuciónBackend Node: npm start (Puerto 5000 por defecto).
API Python: flask run (Puerto 5001 o configurado).
Frontend Angular: ng serve.
Frontend React: npm start.
Hardware: Cargar los sketches .ino en las respectivas ESP32 asegurando que la API_URL apunte a la IP del servidor Node.


Desarrollado para la optimización logística del Conjunto Santander.
