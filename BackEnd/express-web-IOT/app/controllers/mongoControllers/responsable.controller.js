const model = require('../../models/mongoModels/Responsable');
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

const listar_responsables = async (req, res) => {
    try {
        const lista = await model.find();
        return res.status(200).json({ msg: "Datos de responsables", Datos: lista });
    } catch (error) {
        console.error("Error al traer responsables", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const listar_responsable_id = async (req, res) => {
    let { id } = req.params;
    try {
        const item = await model.findOne({ id_responsable: id });
        if (!item) {
            return res.status(404).json({ msg: "Responsable no encontrado por ese id" });
        }
        return res.status(200).json({ msg: "Datos del responsable por id", Datos: item });
    } catch (error) {
        console.error("Error al traer responsable por id", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const insert_responsable = async (req, res) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        if (req.file) {
            borrarImagen(req.file.path);
        }
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const imagenRoute = req.file ? `/imagenes/mongo/responsable/${req.file.filename}` : null;
        
        const payload = {
            ...req.body,
            qr_imagen: imagenRoute // Basado en tu modelo actualizado
        };

        const insertado = await model.create(payload);
        return res.status(201).json({ msg: "Datos insertados correctamente", Insercion: insertado });
    } catch (error) {
        if (req.file) {
            borrarImagen(req.file.path);
        }
        console.error("Error al insertar responsable", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: "Error de validación", error: error.message });
        }
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const upd_responsable = async (req, res) => {
    let { id } = req.params;
    
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        if (req.file) {
            borrarImagen(req.file.path);
        }
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const responsableActual = await model.findOne({ id_responsable: id });
        if (!responsableActual) {
            if (req.file) borrarImagen(req.file.path);
            return res.status(404).json({ msg: "No hay un responsable con ese id" });
        }
        
        const imagenAntigua = responsableActual.qr_imagen;
        const datosActualizar = { ...req.body };

        if (req.file) {
            datosActualizar.qr_imagen = `/imagenes/mongo/responsable/${req.file.filename}`;
        }

        const actualizado = await model.findOneAndUpdate(
            { id_responsable: id },
            datosActualizar,
            { new: true }
        );

        if (req.file && imagenAntigua) {
            borrarImagen(imagenAntigua);
        }

        return res.status(200).json({ msg: "Responsable actualizado correctamente", Upd: actualizado });
    } catch (error) {
        if (req.file) {
            borrarImagen(req.file.path);
        }
        console.error("Error al actualizar responsable", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: "Error de validación", error: error.message });
        }
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

const delete_responsable = async (req, res) => {
    let { id } = req.params;
    try {
        const borrado = await model.findOneAndDelete({ id_responsable: id });
        if (!borrado) {
            return res.status(404).json({ msg: "No hay un responsable con ese id" });
        }

        if (borrado.qr_imagen) {
            borrarImagen(borrado.qr_imagen);
        }

        return res.status(200).json({ msg: "Responsable borrado correctamente", Deleted: borrado });
    } catch (error) {
        console.error("Error al borrar responsable", error);
        return res.status(500).json({ msg: "Error", error: error.message });
    }
}

module.exports = {
    listar_responsables, listar_responsable_id, insert_responsable, upd_responsable, delete_responsable
}