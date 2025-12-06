# Scripts de Mantenimiento MongoDB

## Fix Duplicate Guardias

Este script elimina guardias duplicados y asegura que el índice único esté creado en MongoDB.

### ¿Qué hace?

1. **Busca guardias duplicados** por `numero_guardia`
2. **Elimina los duplicados**, manteniendo solo el primer registro de cada número
3. **Crea el índice único** en el campo `numero_guardia`
4. **Verifica** que todo esté configurado correctamente

### Cómo ejecutar

```bash
cd /home/ricardojr/Projects/conjuntoSantander/express-web-IOT
node scripts/fix-duplicate-guardias.js
```

### ⚠️ IMPORTANTE

- Este script **eliminará permanentemente** los guardias duplicados
- Solo mantendrá el primer registro encontrado de cada `numero_guardia`
- **Haz un backup** de tu base de datos antes de ejecutar si tienes datos importantes

### Después de ejecutar el script

Una vez completado, MongoDB **no permitirá** insertar dos guardias con el mismo `numero_guardia`, ni siquiera insertando documentos directamente en la base de datos.

Si intentas insertar un duplicado, recibirás un error:
```
Error: E11000 duplicate key error
```

Y tu API responderá con:
```json
{
  "msg": "El número de guardia ya está registrado en la base de datos",
  "error": "NUMERO_DUPLICADO"
}
```
