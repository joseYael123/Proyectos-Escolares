/**
 * Script para eliminar guardias duplicados y crear índice único
 * Este script mantiene solo el primer guardia de cada numero_guardia duplicado
 */

const mongoose = require('mongoose');
const Guardia = require('../app/models/mongoModels/Guardia');

// Configuración de conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://MongoPaTodos:1234@conjuntosantander.t6mbk8c.mongodb.net/conjuntoSantander?appName=conjuntoSantander';

async function fixDuplicateGuardias() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Conectado a MongoDB');

    // 1. Buscar duplicados
    const duplicates = await Guardia.aggregate([
      {
        $group: {
          _id: '$numero_guardia',
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log(`\nEncontrados ${duplicates.length} números de guardia duplicados`);

    if (duplicates.length === 0) {
      console.log('✓ No hay duplicados para limpiar');
    } else {
      // 2. Eliminar duplicados (mantener solo el primero)
      let deletedCount = 0;
      
      for (const duplicate of duplicates) {
        const [keepId, ...deleteIds] = duplicate.ids;
        
        console.log(`\n- Numero guardia: ${duplicate._id}`);
        console.log(`  Documentos encontrados: ${duplicate.count}`);
        console.log(`  Manteniendo ID: ${keepId}`);
        console.log(`  Eliminando ${deleteIds.length} duplicado(s)`);
        
        const result = await Guardia.deleteMany({
          _id: { $in: deleteIds }
        });
        
        deletedCount += result.deletedCount;
      }
      
      console.log(`\n✓ Total eliminados: ${deletedCount} guardias duplicados`);
    }

    // 3. Eliminar índice antiguo si existe
    try {
      await Guardia.collection.dropIndex('numero_guardia_1');
      console.log('✓ Índice antiguo eliminado');
    } catch (err) {
      console.log('- No había índice previo o ya fue eliminado');
    }

    // 4. Crear índice único
    await Guardia.collection.createIndex(
      { numero_guardia: 1 }, 
      { unique: true }
    );
    console.log('✓ Índice único creado en numero_guardia');

    // 5. Verificar índices
    const indexes = await Guardia.collection.indexes();
    console.log('\nÍndices actuales:');
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} ${index.unique ? '(unique)' : ''}`);
    });

    console.log('\n✅ Proceso completado exitosamente');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Conexión cerrada');
  }
}

// Ejecutar el script
fixDuplicateGuardias()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
