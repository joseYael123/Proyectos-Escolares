const model = require('../../models/postgresModels/Espacio_estacionamiento');

const listar_espacios = async(req,res) => {
  try {
    const lista = await model.findAll();
    return res.status(200).json({msg: "Datos de espacios", Datos: lista});
  } catch (error) {
    console.error("Error al traer espacios", error);
    return res.status(500).json({msg: "Error", error: error.message});
  }
}

const listar_espacio_id = async(req,res) => {
  let {id} = req.params;
  try {
    const item = await model.findByPk(id);
    if(!item){
      return res.status(404).json({msg: "Espacio no encontrado por ese id"});
    }
    return res.status(200).json({msg: "Datos del espacio por id", Datos: item});
  } catch (error) {
    console.error("Error al traer espacio por id", error);
    return res.status(500).json({msg:"Error", error: error.message});
  }
}

const insert_espacio = async (req,res) => {
  try {
    const insertado = await model.create(req.body);
    return res.status(201).json({msg: "Datos insertados correctamente", Insercion: insertado});
  } catch (error) {
    console.error("Error al insertar espacio", error);
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

const upd_espacio = async(req,res) => {
  let {id} = req.params;
  try {
    const [actualizado] = await model.update(req.body, {where: {id_espacio: id}})
    if(actualizado === 0){
      return res.status(404).json({msg:"No hay un espacio con ese id"});
    }
    return res.status(200).json({msg:"Espacio actualizado correctamente", Upd: actualizado});
  } catch (error) {
    console.error("Error al actualizar espacio", error);
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

const delete_espacio = async(req,res) => {
  let {id} = req.params;
  try {
    const borrado = await model.destroy({where: {id_espacio: id}})
        if(borrado === 0){
      return res.status(404).json({msg:"No hay un espacio con ese id"});
    }
        return res.status(200).json({msg:"Espacio borrado correctamente", Deleted: borrado});
  } catch (error) {
    console.error("Error al borrar espacio", error);
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

module.exports ={
  listar_espacios, listar_espacio_id, insert_espacio, upd_espacio, delete_espacio
}