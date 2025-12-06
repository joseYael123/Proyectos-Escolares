const model = require('../../models/postgresModels/Asignacion_espacio');

const listar_asignaciones = async(req,res) => {
  try {
    const lista = await model.findAll();
    return res.status(200).json({msg: "Datos de asignaciones", Datos: lista});
  } catch (error) {
    console.error("Error al traer asignaciones", error);
    return res.status(500).json({msg: "Error", error: error.message});
  }
}

const listar_asignacion_id = async(req,res) => {
  let {id} = req.params;
  try {
    const item = await model.findByPk(id);
    if(!item){
      return res.status(404).json({msg: "Asignación no encontrada por ese id"});
    }
    return res.status(200).json({msg: "Datos de la asignación por id", Datos: item});
  } catch (error) {
    console.error("Error al traer asignación por id", error);
    return res.status(500).json({msg:"Error", error: error.message});
  }
}

const insert_asignacion = async (req,res) => {
  try {
    const insertado = await model.create(req.body);
    return res.status(201).json({msg: "Datos insertados correctamente", Insercion: insertado});
  } catch (error) {
    console.error("Error al insertar asignación", error);
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

const upd_asignacion = async(req,res) => {
  let {id} = req.params;
  try {
    const [actualizado] = await model.update(req.body, {where: {id_asignacion: id}})
    if(actualizado === 0){
      return res.status(404).json({msg:"No hay una asignación con ese id"});
    }
    return res.status(200).json({msg:"Asignación actualizada correctamente", Upd: actualizado});
  } catch (error) {
    console.error("Error al actualizar asignación", error);
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

const delete_asignacion = async(req,res) => {
  let {id} = req.params;
  try {
    const borrado = await model.destroy({where: {id_asignacion: id}})
        if(borrado === 0){
      return res.status(404).json({msg:"No hay una asignación con ese id"});
    }
        return res.status(200).json({msg:"Asignación borrada correctamente", Deleted: borrado});
  } catch (error) {
    console.error("Error al borrar asignación", error);
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

module.exports ={
  listar_asignaciones, listar_asignacion_id, insert_asignacion, upd_asignacion, delete_asignacion
}