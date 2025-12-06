package cm.on.time;

/*@author Jose Y*/
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import javax.swing.JOptionPane;

public class Autenticacion_Administrador {
    public boolean autenticar_admin(Connection conexion, String nombre_esp, String contraseña) {
          boolean autenticado = false;
        String query = "SELECT * FROM administrador WHERE nombres_esp = ? AND contraseña = ?";

        try {
            PreparedStatement stmt = conexion.prepareStatement(query);
            stmt.setString(1, nombre_esp);
            stmt.setString(2, contraseña);
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