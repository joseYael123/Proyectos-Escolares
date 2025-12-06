const model = require('../../models/postgresModels/Movimiento_vehiculo');

const listar_movimientos = async(req,res) => {
  try {
    const lista = await model.findAll();
    return res.status(200).json({msg: "Datos de movimientos", Datos: lista});
  } catch (error) {
    console.error("Error al traer movimientos", error);
    return res.status(500).json({msg: "Error", error: error.message});
  }
}

const listar_movimiento_id = async(req,res) => {
  let {id} = req.params;
  try {
    const item = await model.findByPk(id);
    if(!item){
      return res.status(404).json({msg: "Movimiento no encontrado por ese id"});
    }
    return res.status(200).json({msg: "Datos del movimiento por id", Datos: item});
  } catch (error) {
    console.error("Error al traer movimiento por id", error);
    return res.status(500).json({msg:"Error", error: error.message});
  }
}

const insert_movimiento = async (req,res) => {
  try {
    const insertado = await model.create(req.body);
    return res.status(201).json({msg: "Datos insertados correctamente", Insercion: insertado});
  } catch (error) {
    console.error("Error al insertar movimiento", error);
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

const upd_movimiento = async(req,res) => {
  let {id} = req.params;
  try {
    const [actualizado] = await model.update(req.body, {where: {id_movimiento: id}})
    if(actualizado === 0){
      return res.status(404).json({msg:"No hay un movimiento con ese id"});
    }
    return res.status(200).json({msg:"Movimiento actualizado correctamente", Upd: actualizado});
  } catch (error) {
    console.error("Error al actualizar movimiento", error);
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

const delete_movimiento = async(req,res) => {
  let {id} = req.params;
  try {
    const borrado = await model.destroy({where: {id_movimiento: id}})
        if(borrado === 0){
      return res.status(404).json({msg:"No hay un movimiento con ese id"});
    }
        return res.status(200).json({msg:"Movimiento borrado correctamente", Deleted: borrado});
  } catch (error) {
    console.error("Error al borrar movimiento", error);
    return res.status(500).json({msg: "Error", error: error.message});    
D  }
}

module.exports ={
  listar_movimientos, listar_movimiento_id, insert_movimiento, upd_movimiento, delete_movimiento
}