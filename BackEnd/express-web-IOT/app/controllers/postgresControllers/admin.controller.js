const model = require('../../models/postgresModels/Admin');
const modelMongo = require('../../models/mongoModels/Admin');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const {validationResult} = require('express-validator');

function borrarImagen(rutaArchivo){
    try {
        if(fs.existsSync(rutaArchivo)){
            fs.unlinkSync(rutaArchivo);
        }
    } catch (error) {
            console.error('Error borrando archivo:', filePath, err);
    }
}


const listar_admins = async(req,res) => {
    try {
        const admins_listados = await model.findAll();
        return res.status(200).json({msg: "datos", Datos: admins_listados});
    } catch (error) {
        console.error("Hubo un error al traer a los admins", error);
        return res.status(500).json({msg: "Error", error: error.message});
    }
}

const listar_admins_id = async(req,res) => {
    let {id} = req.params;
    try {
        const admins_listados_id = await model.findByPk(id);

          if(!admins_listados_id){
            return res.status(404).json({msg: "Admin no encontrado por ese id"});
        }

        return res.status(200).json({msg: "Datos del admin por el id proporcionado", Datos: admins_listados_id});
    } catch (error) {
        console.error("Hubo un error al traer el admin por ese id", error);
        return res.status(500).json({msg:"Error", error: error.message});
    }
}

const insert_admins = async (req,res) => {
    try {
        const errores = validationResult(req);
        if(!errores.isEmpty()){
            if(req.file){
                borrarImagen(req.file.path);
            }
            return res.status(400).json({ errors: errores.array() });
        }

        const imagenRoute = req.file ? `/imagenes/postgres/admin/${req.file.filename}`: null;

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.contra_admin, salt);

        const imagenSubir = {
            ...req.body,
            contra_admin: hashedPassword,
            imagen: imagenRoute
        };

        // Insertar en PostgreSQL
        const admins_insertados = await model.create(imagenSubir);
        console.log('✅ Admin insertado en PostgreSQL con ID:', admins_insertados.admin_id);
        
        // Preparar datos para MongoDB (con el admin_id de PostgreSQL)
        const datosParaMongo = {
            admin_id: admins_insertados.admin_id,
            nom_admin: admins_insertados.nom_admin,
            app_admin: admins_insertados.app_admin,
            apm_admin: admins_insertados.apm_admin,
            correo: admins_insertados.correo,
            usuario_admin: admins_insertados.usuario_admin,
            contra_admin: hashedPassword,
            rol: admins_insertados.rol,
            imagen: imagenRoute,
            estado: admins_insertados.estado
        };

        // Insertar también en MongoDB (solo si está conectado)
        try {
            console.log('🔍 Estado de conexión MongoDB:', mongoose.connection.readyState);
            if (mongoose.connection.readyState === 1) {
                await modelMongo.create(datosParaMongo);
                console.log('✅ Admin insertado también en MongoDB');
            } else {
                console.warn('⚠️  MongoDB no conectado (readyState:', mongoose.connection.readyState, ') - Admin solo guardado en PostgreSQL');
            }
        } catch (mongoError) {
            console.error('❌ Error al insertar en MongoDB:', mongoError.message);
            console.error('Stack:', mongoError.stack);
            // No detenemos el proceso si falla MongoDB
        }

        return res.status(200).json({msg: "Datos insertados correctamente", Insercion: admins_insertados});
    } catch (error) {
        if(req.file){
            borrarImagen(req.file.path);
        }
        console.error("Hubo un error al insertar a los admins", error);
        return res.status(500).json({msg: "Error", error: error.message});        
    }
}

const upd_admin = async(req,res) => {
    let {id} = req.params;
    try {
        console.log('📝 Actualizando admin ID:', id);
        console.log('📦 Datos recibidos:', req.body);
        console.log('🖼️ Archivo recibido:', req.file ? req.file.filename : 'No hay archivo');
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Si subió una nueva imagen durante el intento de update, bórrala
            if (req.file) borrarImagen(req.file.path);
            return res.status(400).json({ errors: errors.array() });
        }

        // Preparar datos para actualizar
        let datosActualizar = {...req.body};
        
        // Si se está actualizando la contraseña, encriptarla
        if (datosActualizar.contra_admin) {
            const salt = await bcrypt.genSalt(10);
            datosActualizar.contra_admin = await bcrypt.hash(datosActualizar.contra_admin, salt);
        }
        
        // Si hay nueva imagen, agregarla
        if(req.file) {
            const imagenRoute = `/imagenes/postgres/admin/${req.file.filename}`;
            datosActualizar.imagen = imagenRoute;
        }

        const [admins_actu] = await model.update(datosActualizar, {where: {admin_id: id}});
        
        if(admins_actu === 0){
            if(req.file) borrarImagen(req.file.path);
            return res.status(404).json({msg:"No hay un admin con ese id"});
        }

        // Obtener el admin actualizado
        const adminActualizado = await model.findByPk(id);
        
        // Actualizar también en MongoDB (solo si está conectado)
        try {
            console.log('🔍 Estado de conexión MongoDB:', mongoose.connection.readyState);
            if (mongoose.connection.readyState === 1) {
                const resultadoMongo = await modelMongo.findOneAndUpdate(
                    { admin_id: parseInt(id) },
                    datosActualizar,
                    { new: true }
                );
                console.log('✅ Admin actualizado también en MongoDB:', resultadoMongo ? 'Éxito' : 'No encontrado');
            } else {
                console.warn('⚠️  MongoDB no conectado (readyState:', mongoose.connection.readyState, ') - Admin solo actualizado en PostgreSQL');
            }
        } catch (mongoError) {
            console.error('❌ Error al actualizar en MongoDB:', mongoError.message);
            console.error('Stack:', mongoError.stack);
            // No detenemos el proceso si falla MongoDB
        }
        
        return res.status(200).json({
            msg:"Admin actualizado correctamente", 
            Datos: adminActualizado
        });
    } catch (error) {
        if(req.file) borrarImagen(req.file.path);
        console.error("Hubo un error al actualizar el admin", error);
        return res.status(500).json({msg: "Error", error: error.message});        
    }
}

const delete_admin = async(req,res) => {
    let {id} = req.params;
    try {
        console.log('🗑️ Eliminando admin ID:', id);
        
        // Buscar el admin antes de eliminarlo (para obtener info de imagen)
        const adminAEliminar = await model.findByPk(id);
        
        if(!adminAEliminar) {
            return res.status(404).json({msg:"No se encontró un admin con ese id para borrar"});
        }

        // Eliminar el admin de PostgreSQL
        const admins_borrados = await model.destroy({where: {admin_id: id}});
        
        if(admins_borrados === 0){
            return res.status(404).json({msg:"No se pudo eliminar el admin"});
        }

        console.log('✅ Admin eliminado de PostgreSQL');

        // Si tenía imagen, eliminarla del servidor
        if(adminAEliminar.imagen) {
            const rutaImagen = path.join(__dirname, '../../public', adminAEliminar.imagen);
            borrarImagen(rutaImagen);
        }

        // Eliminar también en MongoDB (solo si está conectado)
        try {
            console.log('🔍 Estado de conexión MongoDB:', mongoose.connection.readyState);
            if (mongoose.connection.readyState === 1) {
                const resultadoMongo = await modelMongo.findOneAndDelete({ admin_id: parseInt(id) });
                if (resultadoMongo) {
                    console.log('✅ Admin eliminado también en MongoDB');
                } else {
                    console.warn('⚠️  Admin no encontrado en MongoDB (puede no existir)');
                }
            } else {
                console.warn('⚠️  MongoDB no conectado (readyState:', mongoose.connection.readyState, ') - Admin solo eliminado en PostgreSQL');
            }
        } catch (mongoError) {
            console.error('❌ Error al eliminar en MongoDB:', mongoError.message);
            console.error('Stack:', mongoError.stack);
            // No detenemos el proceso si falla MongoDB
        }

        return res.status(200).json({
            msg:"Admin eliminado exitosamente", 
            Eliminado: adminAEliminar
        });
    } catch (error) {
        console.error("Hubo un error al eliminar el admin", error);
        return res.status(500).json({msg: "Error", error: error.message});        
    }
}

module.exports ={
    listar_admins, listar_admins_id, insert_admins, upd_admin, delete_admin
}