
package cm.on.time;

 /*
 * @author joyag
 */
public class Empleados {
   
    private String id_empleado;
    private String nombres;
    private String apellido_paterno;
    private String apellido_materno;
    private String tipo_empleado;


    public Empleados(String id_empleado, String nombres, String apellido_paterno, String apellido_materno, String tipo_empleado) {
        this.id_empleado = id_empleado;
        this.nombres = nombres;
        this.apellido_paterno = apellido_paterno;
        this.apellido_materno = apellido_materno;
        this.tipo_empleado = tipo_empleado;
    }

    public String getId_empleado() {
        return id_empleado;
    }

    public String getNombres() {
        return nombres;
    }

    public String getApellido_paterno() {
        return apellido_paterno;
    }

    public String getApellido_materno() {
        return apellido_materno;
    }

    public String getTipo_empleado() {
        return tipo_empleado;
    }

    public void setId_empleado(String id_empleado) {
        this.id_empleado = id_empleado;
    }

    public void setNombres(String nombres) {
        this.nombres = nombres;
    }

    public void setApellido_paterno(String apellido_paterno) {
        this.apellido_paterno = apellido_paterno;
    }

    public void setApellido_materno(String apellido_materno) {
        this.apellido_materno = apellido_materno;
    }

    public void setTipo_empleado(String tipo_empleado) {
        this.tipo_empleado = tipo_empleado;
    }


    
    
    
    
    
}
