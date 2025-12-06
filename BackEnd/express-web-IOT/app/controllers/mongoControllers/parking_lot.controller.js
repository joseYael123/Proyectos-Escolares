const model = require('../../models/mongoModels/Parking_lot');

const listar_parkings = async(req,res) => {
  try {
    const lista = await model.find();
    return res.status(200).json({msg: "Datos de parkings", Datos: lista});
  } catch (error) {
    console.error("Error al traer parkings", error);
    return res.status(500).json({msg: "Error", error: error.message});
  }
}

const listar_parking_id = async(req,res) => {
  let {id} = req.params;
  try {
    const item = await model.findOne({ id_lot: id });
    if(!item){
      return res.status(404).json({msg: "Parking no encontrado por ese id"});
    }
    return res.status(200).json({msg: "Datos del parking por id", Datos: item});
  } catch (error) {
    console.error("Error al traer parking por id", error);
    return res.status(500).json({msg:"Error", error: error.message});
  }
}

const insert_parking = async (req,res) => {
  try {
    const insertado = await model.create(req.body);
    return res.status(201).json({msg: "Datos insertados correctamente", Insercion: insertado});
  } catch (error) {
    console.error("Error al insertar parking", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: "Error de validación", error: error.message });
        }
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

const upd_parking = async(req,res) => {
  let {id} = req.params;
  try {
    const actualizado = await model.findOneAndUpdate({ id_lot: id }, req.body, { new: true });
    if(!actualizado){
      return res.status(404).json({msg:"No hay un parking con ese id"});
    }
    return res.status(200).json({msg:"Parking actualizado correctamente", Upd: actualizado});
  } catch (error) {
    console.error("Error al actualizar parking", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ msg: "Error de validación", error: error.message });
        }
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

const delete_parking = async(req,res) => {
  let {id} = req.params;
  try {
    const borrado = await model.findOneAndDelete({ id_lot: id });
        if(!borrado){
      return res.status(404).json({msg:"No hay un parking con ese id"});
    }
        return res.status(200).json({msg:"Parking borrado correctamente", Deleted: borrado});
  } catch (error) {
    console.error("Error al borrar parking", error);
    return res.status(500).json({msg: "Error", error: error.message});    
  }
}

module.exports ={
  listar_parkings, listar_parking_id, insert_parking, upd_parking, delete_parking
}