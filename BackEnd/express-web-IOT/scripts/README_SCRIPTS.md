# Scripts de Utilidad

## verificar-usuarios.js

Script para verificar que los usuarios en MongoDB tengan el formato correcto para el sistema de autenticación.

### Uso:

```bash
node scripts/verificar-usuarios.js
```

### Verifica:
- Roles correctos (super admin o logistica)
- Estados válidos (ACTIVO o Activo)
- Contraseñas hasheadas
- Información completa de usuarios

### Salida esperada:
- Lista de todos los usuarios
- Advertencias si hay problemas
- Resumen estadístico
