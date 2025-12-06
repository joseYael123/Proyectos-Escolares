const model = require('../../models/postgresModels/Responsable');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

function safeUnlink(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error('Error borrando archivo:', filePath, err);
  }
}

const listar_responsables = async (req, res) => {
  try {
    const lista = await model.findAll();
    return res.status(200).json({ msg: "Datos de responsables", Datos: lista });
  } catch (error) {
    console.error("Error al traer responsables", error);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

const listar_responsable_id = async (req, res) => {
  let { id } = req.params;
  try {
    const item = await model.findByPk(id);
    if (!item) return res.status(404).json({ msg: "Responsable no encontrado por ese id" });
    return res.status(200).json({ msg: "Datos del responsable por id", Datos: item });
  } catch (error) {
    console.error("Error al traer responsable por id", error);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

const insert_responsable = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }

    const imagenRuta = req.file ? `/imagenes/postgres/responsable/${req.file.filename}` : null;
    const payload = { ...req.body, imagen: imagenRuta };

    const insertado = await model.create(payload);
    return res.status(201).json({ msg: "Datos insertados correctamente", Insercion: insertado });
  } catch (error) {
    console.error("Error al insertar responsable", error);
    if (req.file) safeUnlink(req.file.path);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

const upd_responsable = async (req, res) => {
  let { id } = req.params;
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }

    const responsable = await model.findByPk(id);
    if (!responsable) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(404).json({ msg: "No hay un responsable con ese id" });
    }

    const antiguaImagen = responsable.imagen;
    if (req.file) req.body.imagen = `/imagenes/postgres/responsable/${req.file.filename}`;

    responsable.set(req.body);
    const saved = await responsable.save();

    if (req.file && antiguaImagen) {
      const viejoPath = path.join(__dirname, '../../public/imagenes/postgres/responsable', antiguaImagen);
      safeUnlink(viejoPath);
    }

    return res.status(200).json({ msg: "Responsable actualizado correctamente", Upd: saved });
  } catch (error) {
    console.error("Error al actualizar responsable", error);
    if (req.file) safeUnlink(req.file.path);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

const delete_responsable = async (req, res) => {
  let { id } = req.params;
  try {
    const responsable = await model.findByPk(id);
    if (!responsable) return res.status(404).json({ msg: "No hay un responsable con ese id" });

    const imagenRuta = responsable.imagen;
    await responsable.destroy();

    if (imagenRuta) {
      const fullpath = path.join(__dirname, '../../public/imagenes/postgres/responsable', imagenRuta);
      safeUnlink(fullpath);
    }

    return res.status(200).json({ msg: "Responsable borrado correctamente" });
  } catch (error) {
    console.error("Error al borrar responsable", error);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

module.exports = {
  listar_responsables,
  listar_responsable_id,
  insert_responsable,
  upd_responsable,
  delete_responsable
};
