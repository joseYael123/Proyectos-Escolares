const model = require('../../models/postgresModels/Sala');

const listar_salas = async(req,res) => {
  try {
    const lista = await model.findAll();
    return res.status(200).json({msg: "Datos de salas", Datos: lista});
  } catch (error) {
    console.error("Error al traer salas", error);
    return res.status(500).json({msg: "Error", error: error.message});
  }
}

const listar_sala_id = async(req,res) => {
  let {id} = req.params;
  try {
    const item = await model.findByPk(id);
    if(!item){
      return res.status(404).json({msg: "Sala no encontrada por ese id"});
    }
    return res.status(200).json({msg: "Datos de la sala por id", Datos: item});
  } catch (error) {
    console.error("Error al traer sala por id", error);
    return res.status(500).json({msg:"Error", error: error.message});
  }
}

const insert_sala = async (req,res) => {
  try {
    const insertado = await model.create(req.body);
    return res.status(201).json({msg: "Datos insertados correctamente", Insercion: insertado});
  } catch (error) {
    console.error("Error al insertar sala", error);
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

const upd_sala = async(req,res) => {
  let {id} = req.params;
  try {
    const [actualizado] = await model.update(req.body, {where: {id_sala: id}})
    if(actualizado === 0){
      return res.status(404).json({msg:"No hay una sala con ese id"});
    }
    return res.status(200).json({msg:"Sala actualizada correctamente", Upd: actualizado});
  } catch (error) {
    console.error("Error al actualizar sala", error);
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

const delete_sala = async(req,res) => {
  let {id} = req.params;
  try {
    const borrado = await model.destroy({where: {id_sala: id}})
        if(borrado === 0){
      return res.status(404).json({msg:"No hay una sala con ese id"});
    }
        return res.status(200).json({msg:"Sala borrada correctamente", Deleted: borrado});
  } catch (error) {
    console.error("Error al borrar sala", error);
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

module.exports ={
  listar_salas, listar_sala_id, insert_sala, upd_sala, delete_sala
}