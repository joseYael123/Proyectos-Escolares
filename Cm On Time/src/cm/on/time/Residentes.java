package cm.on.time;

/**
 *
 * @author joyag
 */
public class Residentes {
    private String id_residente;
    private String nombres;
    private String apellido_paterno;
    private String apellido_materno;
    private String calle;
    private String num_casa;

    public Residentes(String id_residente, String nombres, String apellido_paterno, String apellido_materno, String calle, String num_casa) {
        this.id_residente = id_residente;
        this.nombres = nombres;
        this.apellido_paterno = apellido_paterno;
        this.apellido_materno = apellido_materno;
        this.calle = calle;
        this.num_casa = num_casa;
    }

    public String getId_residente() {
        return id_residente;
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

    public String getCalle() {
        return calle;
    }

    public String getNum_casa() {
        return num_casa;
    }

    public void setId_residente(String id_residente) {
        this.id_residente = id_residente;
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

    public void setCalle(String calle) {
        this.calle = calle;
    }

    public void setNum_casa(String num_casa) {
        this.num_casa = num_casa;
    }


   
    
    

}
