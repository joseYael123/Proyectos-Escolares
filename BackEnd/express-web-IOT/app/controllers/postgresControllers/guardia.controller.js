const model = require('../../models/postgresModels/Guardia');
const modelMongo = require('../../models/mongoModels/Guardia');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

const listar_guardias = async (req, res) => {
  try {
    const lista = await model.findAll();
    return res.status(200).json({ msg: "Datos de guardias", Datos: lista });
  } catch (error) {
    console.error("Error al traer guardias", error);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

const listar_guardia_id = async (req, res) => {
  let { id } = req.params;
  try {
    const item = await model.findByPk(id);
    if (!item) return res.status(404).json({ msg: "Guardia no encontrado por ese id" });
    return res.status(200).json({ msg: "Datos del guardia por id", Datos: item });
  } catch (error) {
    console.error("Error al traer guardia por id", error);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

const insert_guardia = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }

    // Validar que el número de guardia no exista
    const guardiaExistente = await model.findOne({ where: { numero_guardia: req.body.numero_guardia } });
    if (guardiaExistente) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json({ 
        msg: "El número de guardia ya está registrado",
        error: "NUMERO_DUPLICADO" 
      });
    }

    const imagenRuta = req.file ? `/imagenes/postgres/guardia/${req.file.filename}` : null;
    
    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.contra_guardia, salt);
    
    const payload = { 
      ...req.body, 
      contra_guardia: hashedPassword,
      imagen: imagenRuta 
    };

    // Insertar en PostgreSQL
    const insertado = await model.create(payload);
    console.log('✅ Guardia insertado en PostgreSQL con ID:', insertado.id_guardia);
    
    // Preparar datos para MongoDB
    const datosParaMongo = {
      id_guardia: insertado.id_guardia,
      nom_guardia: insertado.nom_guardia,
      app_guardia: insertado.app_guardia,
      apm_guardia: insertado.apm_guardia,
      numero_guardia: insertado.numero_guardia,
      contra_guardia: hashedPassword,
      estado: insertado.estado,
      imagen: imagenRuta
    };

    // Insertar en MongoDB si está conectado
    try {
      if (mongoose.connection.readyState === 1) {
        await modelMongo.create(datosParaMongo);
        console.log('✅ Guardia insertado también en MongoDB');
      } else {
        console.warn('⚠️  MongoDB no conectado - Guardia solo guardado en PostgreSQL');
      }
    } catch (mongoError) {
      console.error('❌ Error al insertar en MongoDB:', mongoError.message);
    }
    
    return res.status(201).json({ msg: "Datos insertados correctamente", Insercion: insertado });
  } catch (error) {
    console.error("Error al insertar guardia", error);
    if (req.file) safeUnlink(req.file.path);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

const upd_guardia = async (req, res) => {
  let { id } = req.params;
  try {
    console.log('📝 Actualizando guardia ID:', id);
    console.log('📦 Datos recibidos:', req.body);
    console.log('🖼️ Archivo recibido:', req.file ? req.file.filename : 'No hay archivo');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(400).json({ errors: errors.array() });
    }

    const guardia = await model.findByPk(id);
    if (!guardia) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(404).json({ msg: "No hay un guardia con ese id" });
    }

    // Validar que el número de guardia no esté duplicado (si se está cambiando)
    if (req.body.numero_guardia && req.body.numero_guardia !== guardia.numero_guardia) {
      const guardiaConNumero = await model.findOne({ where: { numero_guardia: req.body.numero_guardia } });
      if (guardiaConNumero) {
        if (req.file) safeUnlink(req.file.path);
        return res.status(400).json({ 
          msg: "El número de guardia ya está registrado",
          error: "NUMERO_DUPLICADO" 
        });
      }
    }

    // Preparar datos para actualizar
    let datosActualizar = {...req.body};
    
    // Si se está actualizando la contraseña, encriptarla
    if (datosActualizar.contra_guardia) {
      const salt = await bcrypt.genSalt(10);
      datosActualizar.contra_guardia = await bcrypt.hash(datosActualizar.contra_guardia, salt);
    }
    
    // Si hay nueva imagen, agregarla
    const antiguaImagen = guardia.imagen;
    if (req.file) {
      datosActualizar.imagen = `/imagenes/postgres/guardia/${req.file.filename}`;
    }

    // Actualizar en PostgreSQL
    const [updated] = await model.update(datosActualizar, {where: {id_guardia: id}});
    
    if (updated === 0) {
      if (req.file) safeUnlink(req.file.path);
      return res.status(404).json({msg:"No se pudo actualizar el guardia"});
    }

    // Obtener el guardia actualizado
    const guardiaActualizado = await model.findByPk(id);

    // Borrar imagen antigua si había una nueva
    if (req.file && antiguaImagen) {
      const viejoPath = path.join(__dirname, '../../public', antiguaImagen);
      safeUnlink(viejoPath);
    }

    // Actualizar en MongoDB si está conectado
    try {
      if (mongoose.connection.readyState === 1) {
        const resultadoMongo = await modelMongo.findOneAndUpdate(
          { id_guardia: parseInt(id) },
          datosActualizar,
          { new: true }
        );
        console.log('✅ Guardia actualizado también en MongoDB:', resultadoMongo ? 'Éxito' : 'No encontrado');
      } else {
        console.warn('⚠️  MongoDB no conectado - Guardia solo actualizado en PostgreSQL');
      }
    } catch (mongoError) {
      console.error('❌ Error al actualizar en MongoDB:', mongoError.message);
    }

    return res.status(200).json({ msg: "Guardia actualizado correctamente", Datos: guardiaActualizado });
  } catch (error) {
    console.error("Error al actualizar guardia", error);
    if (req.file) safeUnlink(req.file.path);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

const delete_guardia = async (req, res) => {
  let { id } = req.params;
  try {
    console.log('🗑️ Eliminando guardia ID:', id);
    
    const guardia = await model.findByPk(id);
    if (!guardia) return res.status(404).json({ msg: "No hay un guardia con ese id" });

    const imagenRuta = guardia.imagen;
    
    // Eliminar de PostgreSQL
    const deleted = await model.destroy({where: {id_guardia: id}});
    
    if (deleted === 0) {
      return res.status(404).json({msg:"No se pudo eliminar el guardia"});
    }
    
    console.log('✅ Guardia eliminado de PostgreSQL');

    // Borrar imagen del servidor si existe
    if (imagenRuta) {
      const fullpath = path.join(__dirname, '../../public', imagenRuta);
      safeUnlink(fullpath);
    }

    // Eliminar de MongoDB si está conectado
    try {
      if (mongoose.connection.readyState === 1) {
        const resultadoMongo = await modelMongo.findOneAndDelete({ id_guardia: parseInt(id) });
        if (resultadoMongo) {
          console.log('✅ Guardia eliminado también en MongoDB');
        } else {
          console.warn('⚠️  Guardia no encontrado en MongoDB');
        }
      } else {
        console.warn('⚠️  MongoDB no conectado - Guardia solo eliminado en PostgreSQL');
      }
    } catch (mongoError) {
      console.error('❌ Error al eliminar en MongoDB:', mongoError.message);
    }

    return res.status(200).json({ msg: "Guardia borrado correctamente", Eliminado: guardia });
  } catch (error) {
    console.error("Error al borrar guardia", error);
    return res.status(500).json({ msg: "Error", error: error.message });
  }
};

module.exports = {
  listar_guardias,
  listar_guardia_id,
  insert_guardia,
  upd_guardia,
  delete_guardia
};
