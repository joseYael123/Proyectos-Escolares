const model = require('../../models/mongoModels/Admin');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// --- Helper para borrar imágenes ---
function borrarImagen(rutaArchivo) {
    // Construye la ruta completa al archivo en la carpeta 'public'
    // AJUSTA ESTA RUTA SI ES NECESARIO
    const fullPath = path.join(__dirname, '../../../public', rutaArchivo);
    try {
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (err) {
        console.error('Error borrando archivo:', fullPath, err);
    }
}

const listar_admins = async (req, res) => {
    try {
        const lista = await model.find();
        return res.status(200).json({ msg: "Datos de admins", Datos: lista });
    } catch (error) {
        console.error("Error al traer admins", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const listar_admin_id = async (req, res) => {
    let { id } = req.params;
    try {
        const item = await model.findOne({ admin_id: id });
        if (!item) {
            return res.status(404).json({ msg: "Admin no encontrado por ese id" });
        }
        return res.status(200).json({ msg: "Datos del admin por id", Datos: item });
    } catch (error) {
        console.error("Error al traer admin por id", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const insert_admin = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        if (req.file) {
            borrarImagen(req.file.path); // Borra el archivo subido si la validación falla
        }
        return res.status(400).json({ errors: errores.array() });
    }

    try {
        // Define la ruta relativa para la BD
        const imagenRoute = req.file ? `/imagenes/mongo/admin/${req.file.filename}` : null;
        
        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.contra_admin, salt);
        
        // Si no viene admin_id, generar uno nuevo
        let adminId = req.body.admin_id;
        if (!adminId) {
            const ultimoAdmin = await model.findOne().sort({ admin_id: -1 });
            adminId = ultimoAdmin && ultimoAdmin.admin_id ? ultimoAdmin.admin_id + 1 : 1;
            console.log('🆔 Generando nuevo admin_id:', adminId);
        }
        
        const payload = {
            ...req.body,
            admin_id: adminId,
            contra_admin: hashedPassword,
            imagen: imagenRoute
        };

        const insertado = await model.create(payload);
        return res.status(201).json({ msg: "Datos insertados correctamente", Insercion: insertado });
    } catch (error) {
        if (req.file) {
            borrarImagen(req.file.path); // Borra el archivo si la inserción a la BD falla
        }
        console.error("Error al insertar admin", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: "Error de validación", error: error.message });
        }
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const upd_admin = async (req, res) => {
    let { id } = req.params;
    
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        if (req.file) {
            borrarImagen(req.file.path); // Borra el nuevo archivo si la validación falla
        }
        return res.status(400).json({ errors: errores.array() });
    }

    try {
        // 1. Encontrar el admin actual para obtener la ruta de la imagen vieja
        const adminActual = await model.findOne({ admin_id: id });
        if (!adminActual) {
            if (req.file) borrarImagen(req.file.path); // Borra si el admin no existe
            return res.status(404).json({ msg: "No hay un admin con ese id" });
        }
        
        const imagenAntigua = adminActual.imagen; // Guardamos la ruta de la imagen vieja
        const datosActualizar = { ...req.body };

        // 2. Si se está actualizando la contraseña, encriptarla
        if (datosActualizar.contra_admin) {
            const salt = await bcrypt.genSalt(10);
            datosActualizar.contra_admin = await bcrypt.hash(datosActualizar.contra_admin, salt);
        }

        // 3. Si se subió un archivo nuevo, preparamos la nueva ruta
        if (req.file) {
            datosActualizar.imagen = `/imagenes/mongo/admin/${req.file.filename}`;
        }

        // 4. Actualizar la base de datos
        const actualizado = await model.findOneAndUpdate(
            { admin_id: id },
            datosActualizar,
            { new: true }
        );

        // 5. Si todo salió bien y se subió un archivo nuevo, borra el viejo
        if (req.file && imagenAntigua) {
            borrarImagen(imagenAntigua); // Borra la imagen antigua del servidor
        }

        return res.status(200).json({ msg: "Admin actualizado correctamente", Upd: actualizado });
    } catch (error) {
        if (req.file) {
            borrarImagen(req.file.path); // Borra el nuevo archivo si la actualización falla
        }
        console.error("Error al actualizar admin", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: "Error de validación", error: error.message });
        }
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const delete_admin = async (req, res) => {
    let { id } = req.params;
    
    // Validar que el ID sea un número válido
    const adminId = parseInt(id);
    if (isNaN(adminId)) {
        return res.status(400).json({ 
            msg: "El ID debe ser un número válido" 
        });
    }
    
    try {
        // Encontrar y borrar el admin en una sola operación
        const borrado = await model.findOneAndDelete({ admin_id: adminId });
        
        if (!borrado) {
            return res.status(404).json({ 
                msg: "No se encontró una admin con ese id para borrar" 
            });
        }

        // Si el admin tenía una imagen, borrarla del servidor
        if (borrado.imagen) {
            try {
                borrarImagen(borrado.imagen);
            } catch (imgError) {
                console.warn("No se pudo borrar la imagen:", imgError.message);
                // Continuamos aunque no se pueda borrar la imagen
            }
        }

        // Respuesta de éxito
        return res.status(200).json({ 
            msg: "Admin eliminado exitosamente", 
            success: true,
            Deleted: {
                admin_id: borrado.admin_id,
                nom_admin: borrado.nom_admin,
                app_admin: borrado.app_admin,
                apm_admin: borrado.apm_admin,
                correo: borrado.correo,
                usuario_admin: borrado.usuario_admin,
                rol: borrado.rol,
                estado: borrado.estado
            }
        });
    } catch (error) {
        console.error("Error al borrar admin:", error);
        return res.status(500).json({ 
            msg: "Error interno del servidor al eliminar el admin", 
            success: false,
            error: error.message 
        });
    }
}

module.exports = {
    listar_admins, listar_admin_id, insert_admin, upd_admin, delete_admin
}