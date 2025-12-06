package cm.on.time; 

/*
 * @author Jose Y
 */
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import javax.swing.JOptionPane;
import java.sql.ResultSet;

public class ConexionBD {
private static final String URL ="jdbc:postgresql://localhost:5432/ZSYS";
private static final String USER ="postgres";
private static final String PASSWORD ="7568";
private Connection conexion = null;

public Connection Conectar(){
     try {
            Class.forName("org.postgresql.Driver");
            conexion = DriverManager.getConnection(URL, USER, PASSWORD);
            System.out.println("Conexión exitosa a la base de datos");
        } catch (ClassNotFoundException | SQLException e) {
            System.err.println("Error de conexión: " + e.getMessage());
        }
        return conexion;
    }

   
public void Desconectar(Connection conexion){

    if(conexion != null){
    try{
        conexion.close();
        JOptionPane.showMessageDialog(null,"Desconexion a BD Exitosa.");
    } catch (SQLException e){
        JOptionPane.showMessageDialog(null, "Desconexion a BD Fallida.");
    }
    
}    
 
}

}

