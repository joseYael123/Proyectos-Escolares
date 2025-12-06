const model = require('../../models/mongoModels/Guardia');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

// --- Helper para borrar imágenes ---
function borrarImagen(rutaArchivo) {
    const fullPath = path.join(__dirname, '../../../public', rutaArchivo);
    try {
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }
    } catch (err) {
        console.error('Error borrando archivo:', fullPath, err);
    }
}

const listar_guardias = async (req, res) => {
    try {
        const lista = await model.find();
        return res.status(200).json({ msg: "Datos de guardias", Datos: lista });
    } catch (error) {
        console.error("Error al traer guardias", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const listar_guardia_id = async (req, res) => {
    let { id } = req.params;
    try {
        const item = await model.findOne({ id_guardia: id });
        if (!item) {
            return res.status(404).json({ msg: "Guardia no encontrado por ese id" });
        }
        return res.status(200).json({ msg: "Datos del guardia por id", Datos: item });
    } catch (error) {
        console.error("Error al traer guardia por id", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const insert_guardia = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        if (req.file) {
            borrarImagen(req.file.path);
        }
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Validar que el número de guardia no exista
        const guardiaExistente = await model.findOne({ numero_guardia: req.body.numero_guardia });
        if (guardiaExistente) {
            if (req.file) borrarImagen(req.file.path);
            return res.status(400).json({ 
                msg: "El número de guardia ya está registrado",
                error: "NUMERO_DUPLICADO" 
            });
        }

        const imagenRoute = req.file ? `/imagenes/mongo/guardia/${req.file.filename}` : null;
        
        const payload = {
            ...req.body,
            imagen: imagenRoute
        };

        const insertado = await model.create(payload);
        return res.status(201).json({ msg: "Datos insertados correctamente", Insercion: insertado });
    } catch (error) {
        if (req.file) {
            borrarImagen(req.file.path);
        }
        console.error("Error al insertar guardia", error);
        
        // Manejar error de duplicado de MongoDB (índice único)
        if (error.code === 11000 && error.keyPattern && error.keyPattern.numero_guardia) {
            return res.status(400).json({ 
                msg: "El número de guardia ya está registrado en la base de datos",
                error: "NUMERO_DUPLICADO" 
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: "Error de validación", error: error.message });
        }
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const upd_guardia = async (req, res) => {
    let { id } = req.params;
    
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        if (req.file) {
            borrarImagen(req.file.path);
        }
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const guardiaActual = await model.findOne({ id_guardia: id });
        if (!guardiaActual) {
            if (req.file) borrarImagen(req.file.path);
            return res.status(404).json({ msg: "No hay un guardia con ese id" });
        }
        
        // Validar que el número de guardia no esté duplicado (si se está cambiando)
        if (req.body.numero_guardia && req.body.numero_guardia !== guardiaActual.numero_guardia) {
            const guardiaConNumero = await model.findOne({ numero_guardia: req.body.numero_guardia });
            if (guardiaConNumero) {
                if (req.file) borrarImagen(req.file.path);
                return res.status(400).json({ 
                    msg: "El número de guardia ya está registrado",
                    error: "NUMERO_DUPLICADO" 
                });
            }
        }
        
        const imagenAntigua = guardiaActual.imagen;
        const datosActualizar = { ...req.body };

        if (req.file) {
            datosActualizar.imagen = `/imagenes/mongo/guardia/${req.file.filename}`;
        }

        const actualizado = await model.findOneAndUpdate(
            { id_guardia: id },
            datosActualizar,
            { new: true }
        );

        if (req.file && imagenAntigua) {
            borrarImagen(imagenAntigua);
        }

        return res.status(200).json({ msg: "Guardia actualizado correctamente", Upd: actualizado });
    } catch (error) {
        if (req.file) {
            borrarImagen(req.file.path);
        }
        console.error("Error al actualizar guardia", error);
        
        // Manejar error de duplicado de MongoDB (índice único)
        if (error.code === 11000 && error.keyPattern && error.keyPattern.numero_guardia) {
            return res.status(400).json({ 
                msg: "El número de guardia ya está registrado en la base de datos",
                error: "NUMERO_DUPLICADO" 
            });
        }
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: "Error de validación", error: error.message });
        }
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const delete_guardia = async (req, res) => {
    let { id } = req.params;
    try {
        const borrado = await model.findOneAndDelete({ id_guardia: id });
        if (!borrado) {
            return res.status(404).json({ msg: "No hay un guardia con ese id" });
        }

        if (borrado.imagen) {
            borrarImagen(borrado.imagen);
        }

        return res.status(200).json({ msg: "Guardia borrado correctamente", Deleted: borrado });
    } catch (error) {
        console.error("Error al borrar guardia", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

module.exports = {
    listar_guardias, listar_guardia_id, insert_guardia, upd_guardia, delete_guardia
}