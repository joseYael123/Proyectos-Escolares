package cm.on.time;

/*@author Jose Y*/
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import javax.swing.JOptionPane;

public class Autenticacion_Residente {
    public boolean autenticar_residente(Connection conexion, String nombres, String apellido_paterno, String calle, String num_casa) {
          boolean autenticado = false;
        String query = "SELECT * FROM residentes WHERE nombres = ? AND apellido_paterno = ? AND calle = ? AND num_casa = ?";

        try {
            PreparedStatement stmt = conexion.prepareStatement(query);
            stmt.setString(1, nombres);
            stmt.setString(2, apellido_paterno);
            stmt.setString(3, calle);
            stmt.setString(4, num_casa);            
            ResultSet rs = stmt.executeQuery();
                
            if (rs.next()) {
                autenticado = true;
            }
        } catch (SQLException e) {
            JOptionPane.showMessageDialog(null,"Error de autenticación: " + e.getMessage());
        }

        return autenticado;
    }
}