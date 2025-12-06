#!/usr/bin/env node

/**
 * Script de verificación de usuarios en MongoDB
 * Verifica que los usuarios tengan el formato correcto para el sistema de autenticación
 */

const mongoose = require('mongoose');
const Admin = require('../app/models/mongoModels/Admin');

// Conexión a MongoDB (ajusta la URL según tu configuración)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/conjuntoSantander';

async function verificarUsuarios() {
    try {
        console.log('🔌 Conectando a MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado a MongoDB\n');

        // Obtener todos los admins
        const admins = await Admin.find({});
        
        console.log(`📊 Total de usuarios encontrados: ${admins.length}\n`);

        admins.forEach((admin, index) => {
            console.log(`--- Usuario ${index + 1} ---`);
            console.log(`ID: ${admin.admin_id || 'No asignado'}`);
            console.log(`Usuario: ${admin.usuario_admin}`);
            console.log(`Nombre: ${admin.nom_admin} ${admin.app_admin}`);
            console.log(`Rol: ${admin.rol}`);
            console.log(`Estado: ${admin.estado}`);
            console.log(`Correo: ${admin.correo}`);
            
            // Verificaciones
            const warnings = [];
            
            if (!admin.rol || (admin.rol !== 'super admin' && admin.rol !== 'logistica')) {
                warnings.push(`⚠️  Rol inválido. Debe ser "super admin" o "logistica"`);
            }
            
            if (!admin.estado || (admin.estado !== 'ACTIVO' && admin.estado !== 'Activo')) {
                warnings.push(`⚠️  Estado inválido. Debe ser "ACTIVO" o "Activo"`);
            }
            
            if (!admin.contra_admin || admin.contra_admin.length < 20) {
                warnings.push(`⚠️  Contraseña no está hasheada con bcrypt`);
            }
            
            if (warnings.length > 0) {
                console.log('\n❌ Advertencias:');
                warnings.forEach(w => console.log(`   ${w}`));
            } else {
                console.log('✅ Usuario configurado correctamente');
            }
            
            console.log('');
        });

        // Resumen
        const superAdmins = admins.filter(a => a.rol === 'super admin').length;
        const logistica = admins.filter(a => a.rol === 'logistica').length;
        const activos = admins.filter(a => a.estado === 'ACTIVO' || a.estado === 'Activo').length;

        console.log('\n📈 Resumen:');
        console.log(`   Super Admins: ${superAdmins}`);
        console.log(`   Logística: ${logistica}`);
        console.log(`   Activos: ${activos}`);
        console.log(`   Inactivos: ${admins.length - activos}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexión cerrada');
    }
}

// Ejecutar
verificarUsuarios();
