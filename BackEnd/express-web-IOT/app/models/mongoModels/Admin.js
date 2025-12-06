const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);


const adminSchema = mongoose.Schema(
    {
          admin_id: {
            type: Number,
            unique: true,
            sparse: true  // Permite múltiples valores null en el índice único
          },
          nom_admin: {
            type: String,
            required:[true, "El nombre del admin no puede ser null"]
          },
          app_admin: {
            type: String,
            required:[true, "El app del admin no puede ser null"]
          },
          apm_admin: {
            type: String,
            required: false,
            default: null
          },
          correo: {
            type: String,
            required:[true, "El correo no puede ser null"]
          },
          usuario_admin: {
            type: String,
            required:[true, "El user no puede ser null"]
          },
          contra_admin: {
            type: String,
            required:[true, "La contraseña no puede ser null"]
          },
          rol: {
            type: String,
            required: false,
            default: "logistica"
          },
          imagen: {
            type: String,
            required: false,
            default: null
          },
          estado: {
            type: String,
            required: false,
            default: "ACTIVO"
          }
    }, {
        timestamps: true 
    }
)

// No usamos AutoIncrement porque usamos el admin_id de PostgreSQL
adminSchema.plugin(AutoIncrement, {
  inc_field: 'admin_id',
   id: 'adminNums',      
  start_seq: 0         
 });

const Admin = mongoose.model(
  "Admin",       // 1. Nombre del Modelo (Mayúscula)
  adminSchema,   // 2. El Schema
  "admin"        // 3. El nombre EXACTO de tu colección
);

module.exports = Admin;
